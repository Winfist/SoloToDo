export const LEGAL_LINKS = {
  privacy: "https://solo-todo.web.app/datenschutz.html",
  terms: "https://solo-todo.web.app/nutzungsbedingungen.html",
  imprint: "https://solo-todo.web.app/impressum.html",
};

export function openLegalPage(kind) {
  const href = LEGAL_LINKS[kind];
  if (!href || typeof window === "undefined") return;

  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = href;
  }
}
