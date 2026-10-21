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
    refreshTimer,
    mapTimer,
    clockOffset = 0,
    zoom = 1,
    pinchStart,
    photoTrigger,
    currentPhoto = 0,
    urls = [],
    controller;
  const now = () => Date.now() + clockOffset;
  function addIcon(element, name) {
    const template = $(`icon-${name}`);
    if (template) element.append(template.content.cloneNode(true));
  }
  function clearLocation() {
    clearTimeout(mapTimer);
    $("map-container").replaceChildren();
    $("map-panel").hidden = true;
    $("place-details").hidden = true;
    $("maps").removeAttribute("href");
    $("maps").hidden = true;
    for (const id of [
      "place-name",
      "place-region",
      "location-copy",
      "accuracy",
      "location-time",
    ])
      $(id).textContent = "";
  }
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
    clearInterval(refreshTimer);
    controller?.abort();
    clearPhotos();
    clearLocation();
    report = null;
    $("report").hidden = true;
    $("state").hidden = false;
    $("state").classList.add("state-unavailable");
    $("state").classList.remove("loading");
    $("state-title").textContent = title;
    $("state-copy").textContent = copy;
    $("retry").hidden = !retry;
    $("state").removeAttribute("aria-busy");
    for (const id of [
      "note",
      "vehicle",
      "situation",
      "reference",
      "reported-time",
    ])
      $(id).textContent = "";
    if ($("photo-dialog").open) $("photo-dialog").close();
    $("state-title").focus({ preventScroll: true });
  }
  function expired(code = "LINK_EXPIRED") {
    const revoked = code === "LINK_REVOKED",
      unknown = code === "LINK_UNAVAILABLE";
    state(
      revoked
        ? "Sharing has been turned off."
        : unknown
          ? "This link is unavailable."
          : "This report link has expired.",
      revoked
        ? "The vehicle owner has revoked access to this report. Its photos and location are no longer available through this link."
        : unknown
          ? "Open the complete private link from your original VaahanSafe WhatsApp alert. The owner can review saved reports in their account."
          : "The sharing window has ended. For privacy, report links last up to 24 hours. The owner can still review saved reports in their account.",
    );
    const symbol = $("state-icon");
    if (symbol) {
      symbol.replaceChildren();
      addIcon(symbol, revoked ? "revoked" : "expired");
    }
    $("state").dataset.status = revoked
      ? "revoked"
      : unknown
        ? "unavailable"
        : "expired";
    const header = $("header-status");
    if (header) {
      header.replaceChildren();
      addIcon(header, "revoked");
      header.append(
        document.createTextNode(
          revoked
            ? " ACCESS REVOKED"
            : unknown
              ? " LINK UNAVAILABLE"
              : " LINK EXPIRED",
        ),
      );
    }
  }
  function tick() {
    if (!report) return;
    const remaining = Date.parse(report.expiresAt) - now();
    if (remaining <= 0) {
      expired();
      return;
    }
    const secondsLeft = Math.max(0, Math.ceil(remaining / 1000)),
      hours = Math.floor(secondsLeft / 3600),
      minutes = Math.floor((secondsLeft % 3600) / 60),
      seconds = secondsLeft % 60;
    $("countdown-value").textContent = [hours, minutes, seconds]
      .map((v) => String(v).padStart(2, "0"))
      .join(":");
    $("countdown").setAttribute(
      "aria-label",
      `${hours} hours, ${minutes} minutes and ${seconds} seconds remaining`,
    );
    const total = Date.parse(report.expiresAt) - Date.parse(report.issuedAt);
    const percent = Math.min(
      100,
      Math.max(0, (remaining / Math.max(1, total)) * 100),
    );
    $("expiry-progress").style.width = `${percent}%`;
    $("expiry-meter").setAttribute(
      "aria-valuenow",
      String(Math.round(percent)),
    );
    $("expiry").dataset.state =
      remaining <= 300000 ? "urgent" : remaining <= 3600000 ? "soon" : "active";
    $("expiry-title").textContent =
      remaining <= 3600000
        ? "This link expires soon"
        : "Private access · up to 24 hours";
    $("expiry-message").textContent =
      remaining <= 300000
        ? "Less than 5 minutes left. Access closes automatically."
        : "The owner can revoke access sooner.";
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
      const body = await response.json().catch(() => ({}));
      expired(body.code || "LINK_UNAVAILABLE");
      throw new Error("EXPIRED");
    }
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Too many requests. Please wait one minute and try again."
          : "We couldn’t load the report right now. Please try again.",
      );
    const serverDate = Date.parse(response.headers.get("date") || "");
    if (Number.isFinite(serverDate)) clockOffset = serverDate - Date.now();
    return response;
  }
  function applyZoom() {
    const image = $("large-photo"),
      stage = $("photo-stage");
    if (!image.naturalWidth) return;
    const fit = Math.min(
      (stage.clientWidth - 32) / image.naturalWidth,
      (stage.clientHeight - 32) / image.naturalHeight,
      1,
    );
    image.style.width = `${Math.max(1, image.naturalWidth * fit * zoom)}px`;
    image.style.height = `${Math.max(1, image.naturalHeight * fit * zoom)}px`;
    $("zoom-label").textContent =
      zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`;
    $("zoom-out").disabled = zoom <= 1;
    $("zoom-in").disabled = zoom >= 4;
  }
  function changeZoom(value) {
    zoom = Math.max(1, Math.min(4, value));
    applyZoom();
  }
  function showPhoto(index) {
    if (!report || Date.parse(report.expiresAt) <= now()) {
      expired();
      return;
    }
    if (!urls[index]) return;
    currentPhoto = index;
    zoom = 1;
    $("large-photo").src = urls[index];
    $("large-photo").alt = `Finder-shared photo ${index + 1}`;
    $("dialog-caption").textContent = `${index + 1} / ${report.photoCount}`;
    $("previous-photo").disabled = index === 0;
    $("next-photo").disabled = index === report.photoCount - 1;
    if (!$("photo-dialog").open) $("photo-dialog").showModal();
    applyZoom();
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
      if (!report || Date.parse(report.expiresAt) <= now()) return;
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
      await image.decode();
      if (!report || Date.parse(report.expiresAt) <= now()) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      imageArea.append(image);
      const caption = document.createElement("div");
      caption.className = "photo-label";
      const name = document.createElement("span");
      name.textContent = `PHOTO ${String(index + 1).padStart(2, "0")}`;
      const expand = document.createElement("span");
      expand.textContent = "Open photo ";
      addIcon(expand, "expand");
      caption.append(name, expand);
      button.append(imageArea, caption);
      button.addEventListener("click", () => {
        photoTrigger = button;
        showPhoto(index);
      });
      card.replaceChildren(button);
    } catch (error) {
      if (error.name === "AbortError" || error.message === "EXPIRED" || !report)
        return;
      if (urls[index]) URL.revokeObjectURL(urls[index]);
      urls[index] = undefined;
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
  async function loadPlaceName() {
    const activeReport = report;
    if (!activeReport?.location) return;
    $("retry-location").hidden = true;
    $("place-name").textContent = "Finding the location name…";
    try {
      const response = await api("/api/location", controller.signal);
      const data = await response.json();
      if (report !== activeReport) return;
      $("place-name").textContent = data.place?.name || "Shared location";
      $("place-region").textContent =
        data.place?.region ||
        "The area name is unavailable. The map pin still shows the shared location.";
      $("retry-location").hidden = !!data.place;
    } catch (error) {
      if (
        error.name === "AbortError" ||
        error.message === "EXPIRED" ||
        report !== activeReport
      )
        return;
      $("place-name").textContent = "Shared location";
      $("place-region").textContent =
        "We couldn’t load the place name. You can still use the map.";
      $("retry-location").hidden = false;
    }
  }
  function showLocation(l) {
    clearLocation();
    $("map-attribution").hidden = true;
    if (
      !l ||
      !Number.isFinite(l.latitude) ||
      !Number.isFinite(l.longitude) ||
      Math.abs(l.latitude) > 90 ||
      Math.abs(l.longitude) > 180
    ) {
      $("location-title").textContent = "Location not shared.";
      $("location-copy").textContent =
        "The finder did not include a location with this report.";
      $("accuracy").textContent = "Use the note and photos for context.";
      return;
    }
    $("location-title").textContent = "Where it happened.";
    $("map-panel").hidden = false;
    $("place-details").hidden = false;
    $("maps").hidden = false;
    $("map-attribution").hidden = false;
    $("location-copy").textContent =
      "A finder-shared device estimate, not live vehicle tracking.";
    $("accuracy").textContent = Number.isFinite(l.accuracy)
      ? `Accuracy ±${Math.ceil(l.accuracy)} m`
      : "Approximate pin";
    $("location-time").textContent = Number.isFinite(Date.parse(l.capturedAt))
      ? `Captured ${time(l.capturedAt)} IST`
      : "";
    $("maps").href =
      `https://www.google.com/maps/search/?api=1&query=${l.latitude},${l.longitude}`;
    const lat = l.latitude,
      lon = l.longitude;
    const bounds = [
      Math.max(-180, lon - 0.008),
      Math.max(-85.05, lat - 0.005),
      Math.min(180, lon + 0.008),
      Math.min(85.05, lat + 0.005),
    ];
    const mapUrl = new URL("https://www.openstreetmap.org/export/embed.html");
    mapUrl.search = new URLSearchParams({
      bbox: bounds.join(","),
      layer: "mapnik",
      marker: `${lat},${lon}`,
    }).toString();
    const frame = document.createElement("iframe");
    frame.title = "Map of the location shared with this report";
    frame.referrerPolicy = "no-referrer";
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups",
    );
    $("map-status").textContent = "Opening map…";
    $("map-status").hidden = false;
    frame.addEventListener("load", () => {
      clearTimeout(mapTimer);
      $("map-status").hidden = true;
    });
    frame.src = mapUrl.href;
    $("map-container").append(frame);
    mapTimer = setTimeout(() => {
      $("map-status").textContent =
        "Map taking longer than usual. Use Open in Maps below.";
    }, 12000);
    void loadPlaceName();
  }
  async function revalidate() {
    if (!report || document.hidden) return;
    try {
      await api("/api/report", controller.signal);
    } catch (error) {
      if (error.message !== "EXPIRED" && error.name !== "AbortError") {
        state(
          "Let’s check access again.",
          "We couldn’t confirm that this link is still available. Reopen the report to continue securely.",
          true,
        );
      }
    }
  }
  async function load() {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      expired("LINK_UNAVAILABLE");
      return;
    }
    controller?.abort();
    clearPhotos();
    clearLocation();
    clearInterval(timer);
    clearInterval(refreshTimer);
    controller = new AbortController();
    $("state").hidden = false;
    $("report").hidden = true;
    $("state").classList.add("loading");
    $("state").setAttribute("aria-busy", "true");
    $("state").dataset.status = "loading";
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
      showLocation(data.location);
      $("state").hidden = true;
      $("report").hidden = false;
      tick();
      if (!report) return;
      timer = setInterval(tick, 1000);
      refreshTimer = setInterval(revalidate, 60000);
      $("photo-caption").hidden = !data.photoCount;
      if (!data.photoCount) {
        const empty = document.createElement("div");
        empty.className = "empty-photos";
        addIcon(empty, "image");
        const message = document.createElement("p");
        message.textContent = "No photos were attached to this report.";
        empty.append(message);
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
      $("state").dataset.status = "error";
      if ($("state-icon")) {
        $("state-icon").replaceChildren();
        addIcon($("state-icon"), "error");
      }
    }
  }
  $("retry").addEventListener("click", load);
  $("skip-content").addEventListener("click", () => {
    $("main").focus({ preventScroll: true });
    $("main").scrollIntoView({ block: "start" });
  });
  $("retry-location").addEventListener("click", loadPlaceName);
  $("zoom-in").addEventListener("click", () => changeZoom(zoom + 0.5));
  $("zoom-out").addEventListener("click", () => changeZoom(zoom - 0.5));
  $("fit-photo").addEventListener("click", () => changeZoom(1));
  $("large-photo").addEventListener("load", applyZoom);
  $("large-photo").addEventListener("dblclick", () =>
    changeZoom(zoom === 1 ? 2 : 1),
  );
  const touchDistance = (touches) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  $("photo-stage").addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 2)
        pinchStart = { distance: touchDistance(event.touches), zoom };
    },
    { passive: true },
  );
  $("photo-stage").addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length === 2 && pinchStart?.distance) {
        event.preventDefault();
        changeZoom(
          (pinchStart.zoom * touchDistance(event.touches)) /
            pinchStart.distance,
        );
      }
    },
    { passive: false },
  );
  $("photo-stage").addEventListener(
    "touchend",
    () => {
      pinchStart = undefined;
    },
    { passive: true },
  );
  $("photo-dialog").addEventListener("close", () => {
    photoTrigger?.focus({ preventScroll: true });
  });
  $("photo-dialog").addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(Math.max(0, currentPhoto - 1));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(Math.min((report?.photoCount || 1) - 1, currentPhoto + 1));
    }
    if (["+", "="].includes(event.key)) {
      event.preventDefault();
      changeZoom(zoom + 0.5);
    }
    if (event.key === "-") {
      event.preventDefault();
      changeZoom(zoom - 0.5);
    }
    if (event.key === "0") {
      event.preventDefault();
      changeZoom(1);
    }
  });
  window.addEventListener("resize", () => {
    if ($("photo-dialog").open) applyZoom();
  });
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
      if (report) void revalidate();
    }
  });
  window.addEventListener("pagehide", () => {
    controller?.abort();
    clearInterval(timer);
    clearInterval(refreshTimer);
    clearPhotos();
    clearLocation();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void load();
  });
  if (location.pathname === "/r" || token) void load();
})();
