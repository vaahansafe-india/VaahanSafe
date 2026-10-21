(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const token = location.hash.slice(1);
  const reasons = {
    PARKING: "Parking or blocked access",
    EMERGENCY: "Accident or emergency",
    LIGHTS_ON: "Lights left on",
    DAMAGE: "Vehicle damage",
    OTHER: "Safety concern",
  };
  let report = null,
    timer,
    currentPhoto = 0,
    urls = [],
    controller;
  const time = (value) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  function clearPhotos() {
    urls.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    urls = [];
    $("large-photo").removeAttribute("src");
    $("photos").replaceChildren();
  }
  function state(title, copy, retry = false) {
    clearInterval(timer);
    controller?.abort();
    clearPhotos();
    report = null;
    $("report").hidden = true;
    $("state").hidden = false;
    $("state").classList.remove("loading");
    $("state-title").textContent = title;
    $("state-copy").textContent = copy;
    $("retry").hidden = !retry;
    if ($("photo-dialog").open) $("photo-dialog").close();
  }
  function expired() {
    state(
      "This link is no longer available.",
      "This report link has expired or is no longer available. The owner can still review their saved report in their VaahanSafe account.",
    );
  }
  function tick() {
    if (!report) return;
    const remaining = Date.parse(report.expiresAt) - Date.now();
    if (remaining <= 0) {
      expired();
      return;
    }
    const hours = Math.floor(remaining / 3600000),
      minutes = Math.ceil((remaining % 3600000) / 60000);
    $("countdown").textContent = `${hours}h ${minutes}m remaining`;
    const total = Date.parse(report.expiresAt) - Date.parse(report.issuedAt);
    $("expiry-progress").style.width =
      `${Math.min(100, Math.max(0, (remaining / total) * 100))}%`;
  }
  async function api(path, signal) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal,
    });
    if (response.status === 410) {
      expired();
      throw new Error("EXPIRED");
    }
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Too many requests. Please wait one minute and try again."
          : "We couldn’t load the report right now. Please try again.",
      );
    return response;
  }
  function showPhoto(index) {
    if (!report || Date.parse(report.expiresAt) <= Date.now()) {
      expired();
      return;
    }
    if (!urls[index]) return;
    currentPhoto = index;
    $("large-photo").src = urls[index];
    $("large-photo").alt = `Finder-shared photo ${index + 1}`;
    $("dialog-caption").textContent =
      `Photo ${index + 1} of ${report.photoCount}`;
    $("previous-photo").disabled = index === 0;
    $("next-photo").disabled = index === report.photoCount - 1;
    if (!$("photo-dialog").open) $("photo-dialog").showModal();
  }
  async function loadPhoto(index, card) {
    card.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "photo-image";
    const label = document.createElement("span");
    label.className = "loading-text";
    label.textContent = "Opening photo…";
    loading.append(label);
    card.append(loading);
    try {
      const response = await api(`/api/photos/${index}`, controller.signal);
      const blob = await response.blob();
      if (!report || Date.parse(report.expiresAt) <= Date.now()) return;
      const objectUrl = URL.createObjectURL(blob);
      if (urls[index]) URL.revokeObjectURL(urls[index]);
      urls[index] = objectUrl;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `View photo ${index + 1} in full`);
      const imageArea = document.createElement("div");
      imageArea.className = "photo-image";
      const image = document.createElement("img");
      image.src = objectUrl;
      image.alt = `Finder-shared photo ${index + 1}`;
      image.decoding = "async";
      imageArea.append(image);
      const caption = document.createElement("div");
      caption.className = "photo-label";
      const name = document.createElement("span");
      name.textContent = `PHOTO ${String(index + 1).padStart(2, "0")}`;
      const expand = document.createElement("span");
      expand.textContent = "View full image ↗";
      caption.append(name, expand);
      button.append(imageArea, caption);
      button.addEventListener("click", () => showPhoto(index));
      card.replaceChildren(button);
    } catch (error) {
      if (error.name === "AbortError" || error.message === "EXPIRED" || !report)
        return;
      const panel = document.createElement("div");
      panel.className = "photo-error";
      const text = document.createElement("p");
      text.textContent = "This photo couldn’t load.";
      const retry = document.createElement("button");
      retry.className = "button";
      retry.textContent = "Retry photo";
      retry.addEventListener("click", () => loadPhoto(index, card));
      panel.append(text, retry);
      card.replaceChildren(panel);
    }
  }
  async function load() {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      expired();
      return;
    }
    controller?.abort();
    clearPhotos();
    controller = new AbortController();
    $("state").classList.add("loading");
    $("state-title").textContent = "Opening your report.";
    $("state-copy").textContent =
      "Checking this private link and preparing the shared details.";
    $("retry").hidden = true;
    try {
      const response = await api("/api/report", controller.signal);
      const data = await response.json();
      if (!reasons[data.reason] || !Number.isFinite(Date.parse(data.expiresAt)))
        throw new Error("This report couldn’t be opened.");
      report = data;
      $("reference").textContent = data.reportReference;
      $("reason").textContent = reasons[data.reason];
      $("reason").classList.toggle("emergency", data.reason === "EMERGENCY");
      $("vehicle").textContent = data.vehicleReference;
      $("situation").textContent = reasons[data.reason];
      $("note").textContent =
        data.note ||
        "The finder did not add a note. Review any shared photos and location below.";
      $("reported-time").textContent = `${time(data.reportedAt)} IST`;
      $("expiry-date").textContent = time(data.expiresAt);
      $("expiry-date").dateTime = data.expiresAt;
      $("photo-count").textContent =
        `${String(data.photoCount).padStart(2, "0")} SHARED`;
      $("emergency").hidden = data.reason !== "EMERGENCY";
      const l = data.location;
      $("coordinates").hidden = !l;
      $("maps").hidden = !l;
      $("location-time").hidden = !l;
      if (
        l &&
        Number.isFinite(l.latitude) &&
        Number.isFinite(l.longitude) &&
        Math.abs(l.latitude) <= 90 &&
        Math.abs(l.longitude) <= 180
      ) {
        $("location-copy").textContent =
          "The finder shared their location near the vehicle. This is a device estimate, not live vehicle tracking.";
        $("coordinates").textContent =
          `${l.latitude.toFixed(5)}° , ${l.longitude.toFixed(5)}°`;
        $("accuracy").textContent =
          `Approximate accuracy: ±${Math.ceil(l.accuracy)} metres.`;
        $("location-time").textContent = `Captured ${time(l.capturedAt)} IST`;
        $("maps").href =
          `https://www.google.com/maps/search/?api=1&query=${l.latitude},${l.longitude}`;
      } else {
        $("location-copy").textContent =
          "The finder chose not to share a location with this report.";
        $("accuracy").textContent = "No GPS location is available.";
        $("coordinates").hidden = true;
        $("maps").hidden = true;
        $("location-time").hidden = true;
      }
      $("state").hidden = true;
      $("report").hidden = false;
      tick();
      if (!report) return;
      timer = setInterval(tick, 1000);
      if (!data.photoCount) {
        const empty = document.createElement("div");
        empty.className = "empty-photos";
        empty.textContent = "No photos were attached to this report.";
        $("photos").append(empty);
        $("photo-caption").hidden = true;
      } else {
        for (let i = 0; i < Math.min(data.photoCount, 3); i++) {
          const card = document.createElement("div");
          card.className = "photo";
          $("photos").append(card);
          void loadPhoto(i, card);
        }
      }
      $("main").focus({ preventScroll: true });
    } catch (error) {
      if (error.name === "AbortError" || error.message === "EXPIRED") return;
      state(
        "A moment, please.",
        error.message || "We couldn’t open this report. Please try again.",
        true,
      );
    }
  }
  $("retry").addEventListener("click", load);
  $("close-photo").addEventListener("click", () => $("photo-dialog").close());
  $("previous-photo").addEventListener("click", () =>
    showPhoto(currentPhoto - 1),
  );
  $("next-photo").addEventListener("click", () => showPhoto(currentPhoto + 1));
  $("photo-dialog").addEventListener("click", (event) => {
    if (event.target === $("photo-dialog")) $("photo-dialog").close();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && report) {
      tick();
      if (report)
        void api("/api/report", controller.signal).catch((error) => {
          if (error.message !== "EXPIRED" && error.name !== "AbortError")
            state(
              "Please reopen your report.",
              "We couldn’t confirm that this link is still available. Please try again.",
              true,
            );
        });
    }
  });
  window.addEventListener("pagehide", () => {
    controller?.abort();
    clearInterval(timer);
    clearPhotos();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void load();
  });
  if (location.pathname === "/r" || token) void load();
})();
