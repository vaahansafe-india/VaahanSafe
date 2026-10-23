import {
  ShieldCheckIcon,
  LockIcon,
  Clock01Icon,
  Location01Icon,
  Image01Icon,
  Cancel01Icon,
  ZoomInIcon,
  ZoomOutIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LinkSquare01Icon,
  FitToScreenIcon,
  AlertCircleIcon,
  RefreshIcon,
  Menu01Icon,
  ArrowDown01Icon,
  Route01Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";

const icons = {
  shield: ShieldCheckIcon,
  lock: LockIcon,
  clock: Clock01Icon,
  location: Location01Icon,
  image: Image01Icon,
  close: Cancel01Icon,
  zoomIn: ZoomInIcon,
  zoomOut: ZoomOutIcon,
  previous: ArrowLeft01Icon,
  next: ArrowRight01Icon,
  external: LinkSquare01Icon,
  fit: FitToScreenIcon,
  alert: AlertCircleIcon,
  retry: RefreshIcon,
  menu: Menu01Icon,
  down: ArrowDown01Icon,
  route: Route01Icon,
  note: Edit02Icon,
};
export type ViewerIcon = keyof typeof icons;
const escape = (value: unknown) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
/** Serialize the existing Hugeicons vectors without shipping React to the viewer. */
export function icon(name: ViewerIcon, size = 20) {
  const paths = icons[name] as readonly (readonly [
    string,
    Record<string, unknown>,
  ])[];
  return `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .filter(([key]) => key !== "key")
          .map(
            ([key, value]) =>
              `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${escape(value)}"`,
          )
          .join(" ")}/>`,
    )
    .join("")}</svg>`;
}
