import React, { useState, useEffect } from 'react';
import { MP_THEME, RANK_COLORS } from '../data/mpConstants';
import { fetchLeaderboard, fetchGuildLeaderboard } from '../mpFirebase';
import { auth } from '../../firebase';

const LB_RANK_ICONS = { 1: "👑", 2: "🥈", 3: "🥉" };

export default function LeaderboardView({ playerState }) {
  const [tab, setTab] = useState("Global");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const tabs = ["Global", "Guild", "Weekly"];

  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    loadLeaderboard();
  }, [tab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let data = [];
      if (tab === "Global" || tab === "Weekly") {
        try {
          data = await fetchLeaderboard("totalXpEarned", 25);
        } catch (queryErr) {
          console.warn("Leaderboard query failed (index may be needed):", queryErr);
          // Fallback: try without orderBy
          try {
            const { collection, getDocs, query, limit } = await import("firebase/firestore");
            const { db } = await import("../../firebase");
            const q = query(collection(db, "users"), limit(25));
            const snap = await getDocs(q);
            data = snap.docs.map((d, idx) => {
              const uData = d.data();
              return {
                id: d.id,
                displayName: uData.displayName || uData.hunterName || "Unknown",
                level: uData.level || 1,
                totalXpEarned: uData.totalXpEarned || 0,
                rank: getRankName(uData.level || 1),
                place: idx + 1,
              };
            }).sort((a, b) => b.totalXpEarned - a.totalXpEarned)
              .map((r, i) => ({ ...r, place: i + 1 }));
          } catch (fallbackErr) {
            console.error("Fallback query also failed:", fallbackErr);
          }
        }
      } else if (tab === "Guild") {
        const guildId = playerState?.multiplayer?.guild?.id;
        if (guildId) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("../../firebase");
            const guildSnap = await getDoc(doc(db, "guilds", guildId));
            if (guildSnap.exists()) {
              data = await fetchGuildLeaderboard(guildSnap.data().memberIds);
            }
          } catch (guildErr) {
            console.warn("Guild leaderboard failed:", guildErr);
          }
        }
      }

      setEntries(data);

      // Find my rank
      const myIdx = data.findIndex(e => e.id === myUid);
      if (myIdx >= 0) {
        setMyRank({ ...data[myIdx] });
      } else {
        setMyRank({
          displayName: playerState?.hunterName || "Du",
          level: playerState?.level || 1,
          totalXpEarned: playerState?.totalXpEarned || 0,
          rank: getRankName(playerState?.level || 1),
          place: data.length > 0 ? ">" + data.length : "—",
        });
      }
    } catch (e) {
      console.error("Leaderboard error:", e);
      // Still show user's own rank in case of total failure
      setMyRank({
        displayName: playerState?.hunterName || "Du",
        level: playerState?.level || 1,
        totalXpEarned: playerState?.totalXpEarned || 0,
        rank: getRankName(playerState?.level || 1),
        place: "—",
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ animation: "mpFadeIn 0.3s ease", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
          GLOBAL RANKINGS
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 20px ${MP_THEME.glow}` }}>
          🏆 Hunter Rankings
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 4px", fontSize: 11, borderRadius: 10,
            background: tab === t ? `linear-gradient(135deg, ${MP_THEME.primary}33, ${MP_THEME.primary}11)` : "transparent",
            color: tab === t ? MP_THEME.accent : "#64748b",
            border: `1px solid ${tab === t ? MP_THEME.primary + "55" : "transparent"}`,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            transition: "all 0.2s", cursor: "pointer",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "mpSpin 2s linear infinite" }}>🌀</div>
          <div style={{ fontSize: 11, color: MP_THEME.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
            Rankings laden...
          </div>
        </div>
      ) : (
        <>
          {/* No guild message */}
          {tab === "Guild" && !playerState?.multiplayer?.guild?.id && (
            <div style={{
              textAlign: "center", padding: 40,
              background: MP_THEME.card, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏰</div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 6 }}>Keine Gilde</div>
              <div style={{ fontSize: 11, color: MP_THEME.textMuted }}>Tritt einer Gilde bei, um Guild Rankings zu sehen.</div>
            </div>
          )}

          {/* Empty state */}
          {entries.length === 0 && !(tab === "Guild" && !playerState?.multiplayer?.guild?.id) && (
            <div style={{
              textAlign: "center", padding: 40,
              background: MP_THEME.card, borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 6 }}>Noch keine Rankings</div>
              <div style={{ fontSize: 11, color: MP_THEME.textMuted, lineHeight: 1.5 }}>
                Rankings werden aus den Daten aller Hunter generiert. Schließe Quests ab, um in den Rankings zu erscheinen!
              </div>
            </div>
          )}

          {/* Entries */}
          {entries.length > 0 && (
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map((user, idx) => {
                const isMe = user.id === myUid;
                const rankColor = RANK_COLORS[user.rank] || "#6b7280";
                const isTop3 = idx < 3;

                return (
                  <div
                    key={user.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: isMe ? `${MP_THEME.primary}12` : MP_THEME.card,
                      borderRadius: 14, padding: "14px 18px",
                      border: `1px solid ${isMe ? MP_THEME.primary + "44" : isTop3 ? MP_THEME.glow : "rgba(255,255,255,0.03)"}`,
                      boxShadow: idx === 0 ? `0 0 20px ${MP_THEME.glow}` : "none",
                      transform: idx === 0 ? "scale(1.02)" : "scale(1)",
                      position: "relative", overflow: "hidden",
                      animation: `mpFadeIn 0.3s ease ${idx * 0.03}s both`,
                    }}
                  >
                    {/* Top bar for the #1 player */}
                    {idx === 0 && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${MP_THEME.accent}, transparent)` }} />
                    )}

                    {/* Rank number */}
                    <div style={{
                      fontSize: idx < 3 ? 20 : 14, fontWeight: 900,
                      color: idx === 0 ? MP_THEME.accent : idx === 1 ? "#cbd5e1" : idx === 2 ? "#d97706" : "#475569",
                      fontFamily: "'Cinzel',serif", width: 30, textAlign: "center", flexShrink: 0,
                    }}>
                      {LB_RANK_ICONS[user.place] || `#${user.place}`}
                    </div>

                    {/* Rank Badge */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${rankColor}18`, border: `1px solid ${rankColor}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: rankColor,
                      fontFamily: "'JetBrains Mono',monospace",
                      filter: idx === 0 ? `drop-shadow(0 0 6px ${rankColor})` : "none",
                    }}>
                      {user.rank}
                    </div>

                    {/* User info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 800,
                        color: isMe ? MP_THEME.accent : idx === 0 ? "#fff" : "#e2e8f0",
                        fontFamily: "'Cinzel',serif",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {user.displayName} {isMe && <span style={{ fontSize: 9, color: "#64748b" }}>(Du)</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>
                        Level {user.level} • {user.rank}-Rank
                      </div>
                      {/* XP Bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                        <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.5)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            width: `${entries.length > 0 ? Math.max(5, (user.totalXpEarned / (entries[0]?.totalXpEarned || 1)) * 100) : 0}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${MP_THEME.primary}, ${MP_THEME.accent})`,
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                        <div style={{ fontSize: 9, color: MP_THEME.primary, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, flexShrink: 0 }}>
                          {formatXp(user.totalXpEarned)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* My Rank - always show */}
          {myRank && (
            <div style={{
              marginTop: 16,
              background: `linear-gradient(135deg, rgba(34,211,238,0.08), rgba(0,0,0,0))`,
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 14, padding: "14px 18px",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
                DEIN RANG
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>
                    #{myRank.place}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>
                    Level {myRank.level} • {myRank.rank}-Rank
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#22d3ee", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                  {formatXp(myRank.totalXpEarned)} XP
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getRankName(level) {
  if (level >= 91) return "SSS";
  if (level >= 71) return "S";
  if (level >= 51) return "A";
  if (level >= 36) return "B";
  if (level >= 21) return "C";
  if (level >= 11) return "D";
  return "E";
}

function formatXp(xp) {
  if (!xp) return "0";
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toLocaleString();
}
