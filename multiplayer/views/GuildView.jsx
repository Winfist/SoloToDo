import React, { useState, useEffect } from 'react';
import { MP_THEME, GUILD_TIERS, GUILD_ROLES } from '../data/mpConstants';
import { createGuild, joinGuild, leaveGuild, subscribeToGuild, subscribeToGuildChat, sendGuildMessage } from '../mpFirebase';
import CreateGuildModal from '../components/CreateGuildModal';
import GuildBrowser from '../components/GuildBrowser';
import ChatPanel from '../components/ChatPanel';
import { auth } from '../../firebase';

export default function GuildView({ playerState }) {
  const myGuild = playerState?.multiplayer?.guild;
  const [guildData, setGuildData] = useState(null);
  const [guildMembers, setGuildMembers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [subView, setSubView] = useState("info"); // info | chat | browse | create
  const [loading, setLoading] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  const myUid = auth.currentUser?.uid;
  if (myUid) window.__currentUid = myUid;

  // Subscribe to guild data if in a guild
  useEffect(() => {
    if (!myGuild?.id) { setGuildData(null); return; }
    const unsub = subscribeToGuild(myGuild.id, (data) => {
      setGuildData(data);
    });
    return unsub;
  }, [myGuild?.id]);

  // Subscribe to guild chat
  useEffect(() => {
    if (!myGuild?.id) { setChatMessages([]); return; }
    const unsub = subscribeToGuildChat(myGuild.id, (msgs) => {
      setChatMessages(msgs);
    });
    return unsub;
  }, [myGuild?.id]);

  // Load member details
  useEffect(() => {
    if (!guildData?.memberIds?.length) { setGuildMembers([]); return; }
    // We'll load member data from Firestore
    const loadMembers = async () => {
      const { fetchGuildLeaderboard } = await import('../mpFirebase');
      const members = await fetchGuildLeaderboard(guildData.memberIds);
      setGuildMembers(members.map(m => ({
        ...m,
        role: guildData.masterId === m.id ? "master" : guildData.officerIds?.includes(m.id) ? "officer" : "member",
        online: Math.random() > 0.5, // Simulated for now
      })));
    };
    loadMembers();
  }, [guildData?.memberIds?.length]);

  const handleCreate = async (name, tag, icon) => {
    await createGuild(name, tag, icon);
    // state will update via onSnapshot
  };

  const handleJoin = async (guildId) => {
    await joinGuild(guildId);
  };

  const handleLeave = async () => {
    if (!myGuild?.id) return;
    setLoading(true);
    try {
      await leaveGuild(myGuild.id);
      setLeaveConfirm(false);
    } catch (e) {
      console.error("Error leaving guild:", e);
    }
    setLoading(false);
  };

  const handleSendChat = async (text) => {
    if (!myGuild?.id) return;
    const rank = getRankName(playerState?.level || 1);
    await sendGuildMessage(myGuild.id, text, playerState?.hunterName || "Hunter", playerState?.level || 1, rank);
  };

  // ───── NO GUILD VIEW ─────
  if (!myGuild?.id) {
    if (subView === "create") {
      return <CreateGuildModal onClose={() => setSubView("info")} onCreate={handleCreate} />;
    }
    if (subView === "browse") {
      return <GuildBrowser onJoin={handleJoin} onBack={() => setSubView("info")} myUid={myUid} />;
    }

    return (
      <div style={{ animation: "mpFadeIn 0.3s ease" }}>
        {/* No Guild Hero */}
        <div style={{
          background: `linear-gradient(180deg, ${MP_THEME.primary}10, transparent)`,
          border: `1px solid ${MP_THEME.primary}22`,
          borderRadius: 20, padding: "40px 24px", textAlign: "center",
          marginBottom: 20, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${MP_THEME.primary}12, transparent 70%)`,
            animation: "mpBreathe 4s ease-in-out infinite",
          }} />
          <div style={{ fontSize: 56, marginBottom: 16, animation: "mpFloat 3s ease-in-out infinite", position: "relative" }}>🏰</div>
          <div style={{ fontSize: 9, letterSpacing: 5, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, position: "relative" }}>
            HUNTER ASSOCIATION
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", marginBottom: 8, position: "relative" }}>
            Keine Gilde
          </div>
          <div style={{ fontSize: 12, color: MP_THEME.textMuted, lineHeight: 1.6, maxWidth: 280, margin: "0 auto", position: "relative" }}>
            Tritt einer Gilde bei oder gründe deine eigene, um gemeinsam stärker zu werden.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setSubView("browse")} style={{
            flex: 1, padding: 16, borderRadius: 16, fontSize: 13, fontWeight: 800,
            background: `linear-gradient(135deg, ${MP_THEME.primary}22, ${MP_THEME.primary}08)`,
            border: `1px solid ${MP_THEME.primary}44`, color: MP_THEME.accent,
            fontFamily: "'Cinzel',serif", letterSpacing: 1, cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${MP_THEME.primary}33, ${MP_THEME.primary}15)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${MP_THEME.primary}22, ${MP_THEME.primary}08)`; e.currentTarget.style.transform = "none"; }}
          >
            🔍 Gilde suchen
          </button>
          <button onClick={() => setSubView("create")} style={{
            flex: 1, padding: 16, borderRadius: 16, fontSize: 13, fontWeight: 900,
            background: `linear-gradient(135deg, ${MP_THEME.primary}, ${MP_THEME.secondary})`,
            color: "#fff", border: "none",
            fontFamily: "'Cinzel',serif", letterSpacing: 1, cursor: "pointer",
            boxShadow: `0 4px 20px ${MP_THEME.glow}`,
            transition: "all 0.3s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}
          >
            ⚔️ Gilde gründen
          </button>
        </div>
      </div>
    );
  }

  // ───── IN GUILD VIEW ─────
  const tier = GUILD_TIERS[guildData?.tier] || GUILD_TIERS.E;
  const memberCount = guildData?.memberIds?.length || 0;
  const isMaster = guildData?.masterId === myUid;

  return (
    <div style={{ animation: "mpFadeIn 0.3s ease" }}>
      {/* Guild Info Card */}
      <div style={{
        background: MP_THEME.card,
        border: `1px solid ${MP_THEME.glow}`,
        borderRadius: 16, padding: 20, marginBottom: 16,
        position: "relative", overflow: "hidden",
      }}>
        {/* Shimmer effect */}
        <div style={{
          position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
          background: `linear-gradient(90deg, transparent, ${MP_THEME.primary}08, transparent)`,
          animation: "mpShimmer 6s infinite",
        }} />

        <div style={{ fontSize: 9, letterSpacing: 3, color: MP_THEME.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, position: "relative" }}>
          YOUR GUILD
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, position: "relative" }}>
          <div style={{
            fontSize: 48, filter: `drop-shadow(0 0 12px ${MP_THEME.glow})`,
          }}>
            {guildData?.icon || "🏰"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif", textShadow: `0 0 10px ${MP_THEME.glow}` }}>
              {guildData?.name || myGuild.name}
              <span style={{ fontSize: 13, color: MP_THEME.primary, marginLeft: 8 }}>{guildData?.tag}</span>
            </div>
            <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ color: tier.color }}>{tier.name}</span> · {memberCount}/{guildData?.maxMembers || 10} Members
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#cbd5e1", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
            <span>Guild XP</span>
            <span>{(guildData?.totalXp || 0).toLocaleString()}</span>
          </div>
          <div style={{ height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(100, ((guildData?.totalXp || 0) / (GUILD_TIERS[getNextTier(guildData?.tier)]?.xpRequired || 5000)) * 100)}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${MP_THEME.primary}, ${MP_THEME.accent})`,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "info", label: "Members", icon: "👥" },
          { id: "chat", label: "Chat", icon: "💬" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSubView(tab.id)} style={{
            flex: 1, padding: "10px", borderRadius: 12, fontSize: 11,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: subView === tab.id ? `${MP_THEME.primary}22` : "rgba(255,255,255,0.03)",
            color: subView === tab.id ? MP_THEME.accent : "#64748b",
            border: `1px solid ${subView === tab.id ? MP_THEME.primary + "44" : "rgba(255,255,255,0.06)"}`,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {subView === "info" && (
        <div style={{
          background: MP_THEME.card, border: `1px solid rgba(255,255,255,0.05)`,
          borderRadius: 16, padding: 20,
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#cbd5e1", fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>
            MITGLIEDER ({memberCount})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {guildMembers.sort((a, b) => {
              const roles = { master: 0, officer: 1, member: 2 };
              return (roles[a.role] || 2) - (roles[b.role] || 2);
            }).map((member) => {
              const roleInfo = GUILD_ROLES[member.role] || GUILD_ROLES.member;
              return (
                <div key={member.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 10,
                  border: member.id === myUid ? `1px solid ${MP_THEME.primary}33` : "1px solid rgba(255,255,255,0.02)",
                }}>
                  <div style={{ fontSize: 18 }}>{roleInfo.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: member.id === myUid ? MP_THEME.accent : "#fff",
                      fontFamily: "'Cinzel',serif",
                    }}>
                      {member.displayName} {member.id === myUid && <span style={{ fontSize: 9, color: "#64748b" }}>(Du)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>
                      Lv.{member.level} · {roleInfo.label}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 9, color: member.online ? MP_THEME.guildGreen : "#64748b",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    {member.online ? "🟢" : "🟡"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {subView === "chat" && (
        <ChatPanel
          messages={chatMessages}
          onSend={handleSendChat}
          playerName={playerState?.hunterName}
          playerLevel={playerState?.level}
          playerRank={getRankName(playerState?.level)}
          placeholder="Guild Chat..."
        />
      )}

      {/* Leave Guild Button */}
      <div style={{ marginTop: 16 }}>
        {!leaveConfirm ? (
          <button onClick={() => setLeaveConfirm(true)} style={{
            width: "100%", padding: 12, borderRadius: 12,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef4444", fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
            cursor: "pointer", transition: "all 0.2s", letterSpacing: 1,
          }}>
            {isMaster ? "🗑️ GILDE AUFLÖSEN" : "🚪 GILDE VERLASSEN"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setLeaveConfirm(false)} style={{
              flex: 1, padding: 12, borderRadius: 12,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
            }}>
              Abbrechen
            </button>
            <button onClick={handleLeave} disabled={loading} style={{
              flex: 1, padding: 12, borderRadius: 12,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer",
            }}>
              {loading ? "..." : "✓ Bestätigen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers
function getRankName(level) {
  if (level >= 91) return "SSS";
  if (level >= 71) return "S";
  if (level >= 51) return "A";
  if (level >= 36) return "B";
  if (level >= 21) return "C";
  if (level >= 11) return "D";
  return "E";
}

function getNextTier(currentTier) {
  const order = ["E", "D", "C", "B", "A", "S"];
  const idx = order.indexOf(currentTier || "E");
  return order[Math.min(idx + 1, order.length - 1)];
}
