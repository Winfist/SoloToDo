const DB_NAME = "solo-todo-quest-attachments";
const DB_VERSION = 1;
const STORE_NAME = "attachments";

export const MAX_QUEST_ATTACHMENTS = 3;

let dbPromise = null;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function openAttachmentDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open attachment database"));
  });

  return dbPromise;
}

async function getStore(mode = "readonly") {
  const db = await openAttachmentDb();
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

function safeFileName(name, mimeType) {
  const fallback = `quest-image.${extensionForMimeType(mimeType)}`;
  const value = String(name || fallback).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
  return value || fallback;
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.72) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image thumbnail"));
    }, type, quality);
  });
}

async function createThumbnailBlob(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Image could not be loaded"));
    });
    image.src = objectUrl;
    await loaded;

    const maxEdge = 360;
    const ratio = Math.min(1, maxEdge / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * ratio));
    const height = Math.max(1, Math.round((image.height || 1) * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function putQuestAttachmentBlob(key, blob) {
  const store = await getStore("readwrite");
  await requestToPromise(store.put({ key, blob, savedAtMs: Date.now() }));
}

export async function getQuestAttachmentBlob(key) {
  if (!key) return null;
  const store = await getStore("readonly");
  const record = await requestToPromise(store.get(key));
  return record?.blob || null;
}

export async function deleteQuestAttachmentKey(key) {
  if (!key) return;
  const store = await getStore("readwrite");
  await requestToPromise(store.delete(key));
}

export async function deleteQuestAttachmentBlobs(attachment) {
  await Promise.all([
    deleteQuestAttachmentKey(attachment?.localKey),
    deleteQuestAttachmentKey(attachment?.thumbnailKey),
  ]);
}

export async function saveQuestAttachmentFile(questId, file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const id = randomId();
  const createdAtMs = Date.now();
  const localKey = `quest:${questId}:${id}:full`;
  const thumbnailKey = `quest:${questId}:${id}:thumb`;
  let thumbnailBlob = file;

  try {
    thumbnailBlob = await createThumbnailBlob(file);
  } catch (error) {
    console.warn("[SoloToDo] Could not create quest image thumbnail.", error);
  }

  await Promise.all([
    putQuestAttachmentBlob(localKey, file),
    putQuestAttachmentBlob(thumbnailKey, thumbnailBlob),
  ]);

  return {
    id,
    name: safeFileName(file.name, file.type),
    mimeType: file.type || "image/jpeg",
    size: file.size || 0,
    createdAtMs,
    localKey,
    thumbnailKey,
  };
}

function collectAttachmentKeysFromQuest(quest, keep) {
  (quest?.attachments || []).forEach(attachment => {
    if (attachment?.localKey) keep.add(attachment.localKey);
    if (attachment?.thumbnailKey) keep.add(attachment.thumbnailKey);
  });
}

function getCompletedQuestTimestamp(quest) {
  return Math.max(
    Number(quest?.completedAtMs || 0),
    Date.parse(quest?.completedAt || "") || 0,
    Number(quest?.createdAtMs || 0)
  );
}

export function getQuestAttachmentReferenceSignature(state) {
  const keys = new Set();
  (state?.quests || []).forEach(quest => collectAttachmentKeysFromQuest(quest, keys));
  [...(state?.completedQuests || [])]
    .sort((a, b) => getCompletedQuestTimestamp(b) - getCompletedQuestTimestamp(a))
    .slice(0, 50)
    .forEach(quest => collectAttachmentKeysFromQuest(quest, keys));
  return [...keys].sort().join("|");
}

export async function cleanupQuestAttachmentBlobsForState(state) {
  const keep = new Set();
  (state?.quests || []).forEach(quest => collectAttachmentKeysFromQuest(quest, keep));
  [...(state?.completedQuests || [])]
    .sort((a, b) => getCompletedQuestTimestamp(b) - getCompletedQuestTimestamp(a))
    .slice(0, 50)
    .forEach(quest => collectAttachmentKeysFromQuest(quest, keep));

  const store = await getStore("readonly");
  const keys = await requestToPromise(store.getAllKeys());
  const staleKeys = keys.filter(key => !keep.has(key));
  await Promise.all(staleKeys.map(deleteQuestAttachmentKey));
  return staleKeys.length;
}
