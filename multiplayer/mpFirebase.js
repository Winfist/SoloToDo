// ─── MULTIPLAYER FIREBASE HELPERS ─────────────────────────────
import { db, auth } from "../firebase.js";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion, arrayRemove, deleteField, documentId
} from "firebase/firestore";

// ─── GUILD FUNCTIONS ──────────────────────────────────────────

export async function createGuild(name, tag, icon) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const guildRef = doc(collection(db, "guilds"));
  const guildData = {
    name,
    tag: `[${tag}]`,
    icon,
    tier: "E",
    masterId: user.uid,
    officerIds: [],
    memberIds: [user.uid],
    maxMembers: 10,
    totalXp: 0,
    createdAt: serverTimestamp(),
  };

  await setDoc(guildRef, guildData);

  // Update user's multiplayer state
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    "multiplayer.guild": {
      id: guildRef.id,
      name,
      role: "master",
      joinedAt: new Date().toISOString(),
    },
  });

  return { id: guildRef.id, ...guildData };
}

export async function joinGuild(guildId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const guildRef = doc(db, "guilds", guildId);
  const guildSnap = await getDoc(guildRef);
  if (!guildSnap.exists()) throw new Error("Guild not found");

  const guildData = guildSnap.data();
  if (guildData.memberIds.length >= guildData.maxMembers) throw new Error("Guild is full");
  if (guildData.memberIds.includes(user.uid)) throw new Error("Already in guild");

  await updateDoc(guildRef, {
    memberIds: arrayUnion(user.uid),
  });

  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    "multiplayer.guild": {
      id: guildId,
      name: guildData.name,
      role: "member",
      joinedAt: new Date().toISOString(),
    },
  });

  return guildData;
}

export async function leaveGuild(guildId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const guildRef = doc(db, "guilds", guildId);
  const guildSnap = await getDoc(guildRef);
  if (!guildSnap.exists()) return;

  const guildData = guildSnap.data();

  // If master leaves, disband or transfer
  if (guildData.masterId === user.uid) {
    const remaining = guildData.memberIds.filter(id => id !== user.uid);
    if (remaining.length === 0) {
      // Disband guild
      await deleteDoc(guildRef);
    } else {
      // Transfer to first officer or first member
      const newMaster = guildData.officerIds?.find(id => id !== user.uid) || remaining[0];
      await updateDoc(guildRef, {
        masterId: newMaster,
        memberIds: arrayRemove(user.uid),
        officerIds: arrayRemove(user.uid),
      });
    }
  } else {
    await updateDoc(guildRef, {
      memberIds: arrayRemove(user.uid),
      officerIds: arrayRemove(user.uid),
    });
  }

  // Clear user's guild
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    "multiplayer.guild": null,
  });
}

export function subscribeToGuild(guildId, callback) {
  if (!guildId) return () => {};
  const guildRef = doc(db, "guilds", guildId);
  return onSnapshot(guildRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}

export async function fetchAvailableGuilds() {
  const q = query(collection(db, "guilds"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── GUILD CHAT ───────────────────────────────────────────────

export async function sendGuildMessage(guildId, text, displayName, level, rank) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const msgRef = collection(db, "guilds", guildId, "messages");
  await addDoc(msgRef, {
    userId: user.uid,
    displayName: displayName || "Hunter",
    level: level || 1,
    rank: rank || "E",
    text: text.slice(0, 200),
    timestamp: serverTimestamp(),
  });
}

export function subscribeToGuildChat(guildId, callback) {
  if (!guildId) return () => {};
  const q = query(
    collection(db, "guilds", guildId, "messages"),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .reverse();
    callback(messages);
  });
}

// ─── GLOBAL CHAT ──────────────────────────────────────────────

export async function sendGlobalMessage(text, displayName, level, rank) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await addDoc(collection(db, "globalChat"), {
    userId: user.uid,
    displayName: displayName || "Hunter",
    level: level || 1,
    rank: rank || "E",
    text: text.slice(0, 200),
    timestamp: serverTimestamp(),
  });
}

export function subscribeToGlobalChat(callback) {
  const q = query(
    collection(db, "globalChat"),
    orderBy("timestamp", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .reverse();
    callback(messages);
  });
}

// ─── LEADERBOARD ──────────────────────────────────────────────

export async function fetchLeaderboard(sortField = "totalXpEarned", maxResults = 20) {
  const q = query(
    collection(db, "users"),
    orderBy(sortField, "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, idx) => {
    const data = d.data();
    return {
      id: d.id,
      displayName: data.displayName || data.hunterName || "Unknown",
      level: data.level || 1,
      totalXpEarned: data.totalXpEarned || 0,
      totalQuestsCompleted: data.totalQuestsCompleted || 0,
      streak: data.streak || 0,
      shadowCount: data.shadowArmy?.shadows?.length || 0,
      dungeonsCleared: (data.dungeonHistory || []).filter(d => d.won).length,
      rank: getRankForLevel(data.level || 1),
      place: idx + 1,
    };
  });
}

export async function fetchGuildLeaderboard(memberIds) {
  if (!memberIds?.length) return [];
  // Fetch each member (Firestore "in" queries limited to 10)
  const results = [];
  const chunks = [];
  for (let i = 0; i < memberIds.length; i += 10) {
    chunks.push(memberIds.slice(i, i + 10));
  }
  for (const chunk of chunks) {
    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      const data = d.data();
      results.push({
        id: d.id,
        displayName: data.displayName || data.hunterName || "Unknown",
        level: data.level || 1,
        totalXpEarned: data.totalXpEarned || 0,
        rank: getRankForLevel(data.level || 1),
      });
    });
  }
  return results.sort((a, b) => b.totalXpEarned - a.totalXpEarned).map((r, i) => ({ ...r, place: i + 1 }));
}

// ─── HELPERS ──────────────────────────────────────────────────

const RANK_TABLE = [
  { name: "E",   minLv: 1,  maxLv: 10 },
  { name: "D",   minLv: 11, maxLv: 20 },
  { name: "C",   minLv: 21, maxLv: 35 },
  { name: "B",   minLv: 36, maxLv: 50 },
  { name: "A",   minLv: 51, maxLv: 70 },
  { name: "S",   minLv: 71, maxLv: 90 },
  { name: "SSS", minLv: 91, maxLv: 100 },
];

function getRankForLevel(level) {
  const r = RANK_TABLE.find(r => level >= r.minLv && level <= r.maxLv);
  return r ? r.name : "E";
}
