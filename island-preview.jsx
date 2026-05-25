import React from "react";
import { createRoot } from "react-dom/client";
import HunterIslandHub from "./components/views/HunterIslandHub.jsx";
import { translate } from "./data/i18n.js";

// Free user, leveled up: most modules level-unlocked (so Pro-locks show),
// shadow_army kept level-locked to demo the level-lock state side by side.
const can = (feature) => !["shadow_army"].includes(feature);
const tr = (key, params) => translate("de", key, params);

const state = {
  level: 24,
  statPoints: 2,
  gold: 250,
  equipment: { inventory: [], slots: {} },
  navbarConfig: { tabs: ["dashboard"] },
  premium: null,
};

function Harness() {
  return (
    <HunterIslandHub
      state={state}
      can={can}
      tr={tr}
      theme={{ primary: "#7c3aed", accent: "#a78bfa" }}
      rank={{ name: "C" }}
      activeDungeons={[]}
      filteredQuests={[]}
      namedShadows={[]}
      catalogAchievements={[]}
      achUnlocked={[]}
      premiumStatus={{ active: false }}
      navigateToWithAccess={(r) => console.log("navigate:", r)}
      openPremiumModal={(f) => console.log("openPremiumModal:", f)}
      onOpenCharisma={() => console.log("charisma")}
      shellTopOffset={0}
      shellBottomOffset={0}
      tutorialStepId={null}
    />
  );
}

try { localStorage.setItem("sl-hunter-island-mode", "apps"); } catch {}
createRoot(document.getElementById("root")).render(<Harness />);
