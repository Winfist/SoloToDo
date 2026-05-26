export const LEGAL_LINKS = {
  privacy: "/datenschutz.html",
  terms: "/nutzungsbedingungen.html",
  imprint: "/impressum.html",
};

export function openLegalPage(kind) {
  const href = LEGAL_LINKS[kind];
  if (!href || typeof window === "undefined") return;

  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = href;
  }
}
