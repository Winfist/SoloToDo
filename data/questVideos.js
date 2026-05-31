// Mappings for pre-rendered Google OMNI/Veo exercise guidance videos.
// Videos must be stored in public/videos/quests/.

export const QUEST_TEMPLATE_VIDEOS = {
  // ── STR: E-Rank (Beginner) ──
  "qp_str_01": "qp_str_01.mp4",
  "qp_str_01b": "qp_str_01b.mp4",
  "qp_str_01c": "qp_str_01c.mp4",
  "qp_str_01d": "qp_str_01d.mp4",
  "qp_str_05": "qp_str_05.mp4",
  "qp_str_05b": "qp_str_05b.mp4",
  "qp_str_09": "qp_str_09.mp4",
  "qp_str_09b": "qp_str_09b.mp4",

  // ── STR: D-Rank / C-Rank (Normal) ──
  "qp_str_02": "qp_str_02.mp4",
  "qp_str_02b": "qp_str_02b.mp4",
  "qp_str_02c": "qp_str_02c.mp4",
  "qp_str_02d": "qp_str_02d.mp4",
  "qp_str_02e": "qp_str_02e.mp4",
  "qp_str_06": "qp_str_06.mp4",
  "qp_str_06b": "qp_str_06b.mp4",
  "qp_str_06c": "qp_str_06c.mp4",
  "qp_str_06d": "qp_str_06d.mp4",
  "qp_str_10": "qp_str_10.mp4",
  "qp_str_10b": "qp_str_10b.mp4",
  "qp_str_10c": "qp_str_10c.mp4",
  "qp_str_10d": "qp_str_10d.mp4",

  // ── STR: B-Rank / A-Rank (Hard) ──
  "qp_str_03": "qp_str_03.mp4",
  "qp_str_03b": "qp_str_03b.mp4",
  "qp_str_03c": "qp_str_03c.mp4",
  "qp_str_07": "qp_str_07.mp4",
  "qp_str_07b": "qp_str_07b.mp4",
  "qp_str_07c": "qp_str_07c.mp4",
  "qp_str_07d": "qp_str_07d.mp4",
  "qp_str_11": "qp_str_11.mp4",
  "qp_str_11b": "qp_str_11b.mp4",
  "qp_str_11c": "qp_str_11c.mp4",

  // ── STR: S-Rank (Boss Trial) ──
  "qp_str_04": "qp_str_04.mp4",
  "qp_str_08": "qp_str_08.mp4",
  "qp_str_08a": "qp_str_08a.mp4",
  "qp_str_08b": "qp_str_08b.mp4",
  "qp_str_12": "qp_str_12.mp4",

  // ── VIT: Selected Vitality Quests ──
  "qp_vit_01": "qp_vit_01.mp4",
  "qp_vit_01b": "qp_vit_01b.mp4",
  "qp_vit_02b": "qp_vit_02b.mp4",
  "qp_vit_02e": "qp_vit_02e.mp4",
  "qp_vit_03": "qp_vit_03.mp4",
  "qp_vit_05b": "qp_vit_05b.mp4",
};

/**
 * Returns the video path for a given quest.
 * First checks direct template mapping, then falls back to keyword matching for custom user quests.
 * Returns null if no matching video is found.
 */
export function getQuestVideoPath(quest) {
  if (!quest) return null;

  // 1. Direct template matching
  const templateId = quest.fromTemplate || quest.templateId || quest.id;
  if (templateId && QUEST_TEMPLATE_VIDEOS[templateId]) {
    return `/videos/quests/${QUEST_TEMPLATE_VIDEOS[templateId]}`;
  }

  // 2. Keyword matching for custom user-created quests
  const title = (quest.title || "").toLowerCase();
  const desc = (quest.desc || quest.description || "").toLowerCase();
  const text = `${title} ${desc}`;
  
  if (text.includes("liegestütz") || text.includes("pushup") || text.includes("push-up") || text.includes("push up")) {
    return "/videos/quests/generic_push_ups.mp4";
  }
  if (text.includes("situp") || text.includes("sit-up") || text.includes("sit up") || text.includes("rumpfbeuge") || text.includes("crunch")) {
    return "/videos/quests/generic_sit_ups.mp4";
  }
  if (text.includes("squat") || text.includes("kniebeuge")) {
    return "/videos/quests/generic_squats.mp4";
  }
  if (text.includes("plank") || text.includes("unterarmstütz")) {
    return "/videos/quests/generic_plank.mp4";
  }
  if (text.includes("burpee")) {
    return "/videos/quests/generic_burpees.mp4";
  }
  if (text.includes("klimmzug") || text.includes("pullup") || text.includes("pull-up") || text.includes("pull up")) {
    return "/videos/quests/generic_pull_ups.mp4";
  }
  if (text.includes("lauf") || text.includes("joggen") || text.includes("running") || text.includes("sprint")) {
    return "/videos/quests/generic_running.mp4";
  }
  if (text.includes("stretch") || text.includes("dehnen") || text.includes("mobility") || text.includes("yoga")) {
    return "/videos/quests/generic_stretching.mp4";
  }

  return null;
}
