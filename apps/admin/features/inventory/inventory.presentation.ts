export const inventoryDate = (at: string | null) =>
  at
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(at))
    : "Not recorded";
