import React from "react";
import { getFeatureIconName } from "./featureIconMap.js";

const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONS = {
  gate: <><path {...P} d="M5 19V9a7 7 0 0 1 14 0v10" /><path {...P} d="M5 19h14M9 19v-6h6v6" /></>,
  shop: <><path {...P} d="M4 8h16l-1 11H5L4 8Z" /><path {...P} d="M8 8a4 4 0 0 1 8 0" /></>,
  sanctum: <><path {...P} d="M12 3l7 6v11H5V9l7-6Z" /><circle {...P} cx="12" cy="13" r="2.4" /></>,
  story: <><path {...P} d="M5 5h11l3 3v11H5V5Z" /><path {...P} d="M15 5v4h4M8 12h8M8 15h6" /></>,
  habit: <><path {...P} d="M4 12l4 4L20 4" /><path {...P} d="M4 19h16" opacity=".5" /></>,
  goal: <><circle {...P} cx="12" cy="12" r="8" /><circle {...P} cx="12" cy="12" r="3" /></>,
  shadow: <><path {...P} d="M12 4c3 3 5 5 5 9a5 5 0 0 1-10 0c0-4 2-6 5-9Z" /><path {...P} d="M10 15c1-1 3-1 4 0" /></>,
  codex: <><path {...P} d="M6 4h12v16H6z" /><path {...P} d="M9 4v16M12 8h3M12 12h3" /></>,
  job: <><circle {...P} cx="12" cy="8" r="3.2" /><path {...P} d="M5 20a7 7 0 0 1 14 0" /></>,
  season: <><circle {...P} cx="12" cy="12" r="4" /><path {...P} d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  link: <><path {...P} d="M9 13a4 4 0 0 1 0-5l2-2a4 4 0 0 1 6 6l-1 1" /><path {...P} d="M15 11a4 4 0 0 1 0 5l-2 2a4 4 0 0 1-6-6l1-1" /></>,
  star: <path {...P} d="M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 16.8 6.4 20 8 13.7 3 9.5 9.5 9 12 3Z" />,
  bolt: <path {...P} d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" />,
  scan: <><path {...P} d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" /><path {...P} d="M7 12h10" /></>,
  music: <><circle {...P} cx="7" cy="17" r="2.5" /><circle {...P} cx="17" cy="15" r="2.5" /><path {...P} d="M9.5 17V6l10-2v11" /></>,
  chart: <><path {...P} d="M4 20V4M4 20h16" /><path {...P} d="M8 16l3-4 3 2 4-6" /></>,
  calendar: <><rect {...P} x="4" y="5" width="16" height="15" rx="2" /><path {...P} d="M4 9h16M9 3v4M15 3v4" /></>,
  trophy: <><path {...P} d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path {...P} d="M12 13v4M9 20h6M7 6H4a4 4 0 0 0 4 4M17 6h3a4 4 0 0 1-4 4" /></>,
  focus: <><circle {...P} cx="12" cy="12" r="3" /><circle {...P} cx="12" cy="12" r="8" opacity=".5" /></>,
  gem: <><path {...P} d="M6 4h12l3 5-9 11L3 9l3-5Z" /><path {...P} d="M3 9h18M12 4 9 9l3 11 3-11-3-5Z" /></>,
  equip: <><path {...P} d="M5 4l6 6M19 4l-6 6" /><path {...P} d="M9 12l3 3 3-3-3 7-3-7Z" /></>,
  chain: <><rect {...P} x="4" y="9" width="7" height="6" rx="3" /><rect {...P} x="13" y="9" width="7" height="6" rx="3" /><path {...P} d="M9 12h6" /></>,
};

export default function FeatureIcon({ feature, size = 18 }) {
  const node = ICONS[getFeatureIconName(feature)] || ICONS.star;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{node}</svg>;
}
