import { wasTitleCompletedRecently } from "../data/questUtils.js";

let failures = 0;
const assert = (condition, message) => {
  if (!condition) { console.error(`FAIL: ${message}`); failures += 1; }
};

const NOW = Date.now();
const DAY = 86400000;
const dateKey = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString().slice(0, 10);

// ── Pool-exhaustion guard: only RECENT completions block re-offering a
// pool quest. Titles completed long ago must become available again,
// otherwise the finite pool drains permanently for long-term players. ──
const completions = [
  { id: "a", title: "Meditation", completedAtMs: NOW - 3 * DAY, completedAt: dateKey(3) },
  { id: "b", title: "Kalt duschen", completedAtMs: NOW - 40 * DAY, completedAt: dateKey(40) },
  { id: "c", title: "Lesen", completedAt: dateKey(20) }, // legacy entry without Ms
];

assert(wasTitleCompletedRecently(completions, "Meditation", NOW) === true,
  "title completed 3 days ago is still blocked (default 14-day window)");
assert(wasTitleCompletedRecently(completions, "Kalt duschen", NOW) === false,
  "title completed 40 days ago is available again");
assert(wasTitleCompletedRecently(completions, "Lesen", NOW) === false,
  "legacy entry (date-only) outside the window is available again");
assert(wasTitleCompletedRecently(completions, "Lesen", NOW, 30) === true,
  "custom window respects the date-only fallback");
assert(wasTitleCompletedRecently(completions, "Nie gemacht", NOW) === false,
  "unknown title is not blocked");
assert(wasTitleCompletedRecently([], "Meditation", NOW) === false, "empty history blocks nothing");
assert(wasTitleCompletedRecently(null, "Meditation", NOW) === false, "null history blocks nothing");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All quest-utils tests passed.");
