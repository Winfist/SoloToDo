// ─── SOUL LINK FIREBASE HELPERS ───────────────────────────────
import { db } from "../firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, deleteField,
  onSnapshot, serverTimestamp
} from "firebase/firestore";

// Generate a random 6-char alphanumeric code
function generateLinkCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Create a new soul link and return the linkCode
export async function createSoulLink(userState, currentUser) {
  if (!currentUser) throw new Error("Not authenticated");
  let linkCode = generateLinkCode();
  // Ensure uniqueness (retry once on collision)
  const ref = doc(db, "soulLinks", linkCode);
  const existing = await getDoc(ref);
  if (existing.exists()) linkCode = generateLinkCode();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await setDoc(doc(db, "soulLinks", linkCode), {
    linkCode,
    users: {
      [currentUser.uid]: {
        uid: currentUser.uid,
        hunterName: userState.hunterName || "Hunter",
        streak: userState.streak || 0,
        level: userState.level || 1,
        questsCompletedToday: userState.dailyUserQuestsCreated || 0,
        lastActiveDate: userState.lastActiveDate || null,
        lastUpdated: serverTimestamp()
      }
    },
    createdAt: serverTimestamp(),
    expiresAt: expiresAt.toISOString()
  });

  return { linkCode };
}

// Join an existing soul link by code, returns partner data
export async function joinSoulLink(linkCode, userState, currentUser) {
  if (!currentUser) throw new Error("Not authenticated");
  const ref = doc(db, "soulLinks", linkCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const users = data.users || {};

  // Find the partner (the other user)
  const partnerEntry = Object.values(users).find(u => u.uid !== currentUser.uid);
  if (!partnerEntry && Object.keys(users).length >= 2) return null; // full

  // Add self to the link
  await updateDoc(ref, {
    [`users.${currentUser.uid}`]: {
      uid: currentUser.uid,
      hunterName: userState.hunterName || "Hunter",
      streak: userState.streak || 0,
      level: userState.level || 1,
      questsCompletedToday: userState.dailyUserQuestsCreated || 0,
      lastActiveDate: userState.lastActiveDate || null,
      lastUpdated: serverTimestamp()
    }
  });

  if (!partnerEntry) return { partnerUid: null, partnerName: null, partnerStreak: 0, partnerLevel: 0, partnerQuestsToday: 0, partnerLastActive: null };
  return {
    partnerUid: partnerEntry.uid,
    partnerName: partnerEntry.hunterName,
    partnerStreak: partnerEntry.streak || 0,
    partnerLevel: partnerEntry.level || 1,
    partnerQuestsToday: partnerEntry.questsCompletedToday || 0,
    partnerLastActive: partnerEntry.lastActiveDate || null
  };
}

// Push your own live data into the soul link doc (called on every persist)
export async function updateSoulLinkStatus(linkCode, uid, publicData) {
  if (!linkCode || !uid) return;
  try {
    const ref = doc(db, "soulLinks", linkCode);
    await updateDoc(ref, {
      [`users.${uid}.streak`]: publicData.streak || 0,
      [`users.${uid}.questsCompletedToday`]: publicData.questsCompletedToday || 0,
      [`users.${uid}.lastActiveDate`]: publicData.lastActiveDate || null,
      [`users.${uid}.hunterName`]: publicData.hunterName || "Hunter",
      [`users.${uid}.level`]: publicData.level || 1,
      [`users.${uid}.lastUpdated`]: serverTimestamp()
    });
  } catch (_) { /* Fail silently — link may have been broken */ }
}

// Real-time listener for partner changes — calls callback with partner data
export function subscribeSoulLink(linkCode, myUid, callback) {
  if (!linkCode || !myUid) return () => {};
  const ref = doc(db, "soulLinks", linkCode);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const users = data.users || {};
    const partner = Object.values(users).find(u => u.uid !== myUid);
    if (!partner) return;
    callback({
      partnerUid: partner.uid,
      partnerName: partner.hunterName,
      partnerStreak: partner.streak || 0,
      partnerLevel: partner.level || 1,
      partnerQuestsToday: partner.questsCompletedToday || 0,
      partnerLastActive: partner.lastActiveDate || null
    });
  });
}

// Partner spends a revive on you: increments your streak by 1 in Firestore
export async function sendRevive(linkCode, fromUid, toUid) {
  if (!linkCode || !fromUid || !toUid) return;
  const ref = doc(db, "soulLinks", linkCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const target = data.users?.[toUid];
  if (!target) return;
  await updateDoc(ref, {
    [`users.${toUid}.streak`]: (target.streak || 0) + 1,
    [`users.${toUid}.lastUpdated`]: serverTimestamp(),
    [`reviveSentBy`]: fromUid,
    [`reviveSentAt`]: serverTimestamp()
  });
}

// Remove yourself from the soul link
export async function breakSoulLink(linkCode, uid) {
  if (!linkCode || !uid) return;
  try {
    const ref = doc(db, "soulLinks", linkCode);
    await updateDoc(ref, { [`users.${uid}`]: deleteField() });
  } catch (_) {}
}
