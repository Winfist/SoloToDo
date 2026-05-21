import React, { useMemo, useState } from "react";
import { STAT_ICONS, MICRO_ICONS } from "../data/icons.js";
import { CATEGORIES, DIFFICULTIES } from "../data/gameData.js";
import { getToday, getLocalDateKey } from "../data/dateUtils.js";
import QuestDetailModal from "./QuestDetailModal.jsx";

// ─── INLINE KEYFRAMES (injected once) ───
const STYLE_ID = "analytics-dash-fx";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style"); s.id = STYLE_ID;
    s.textContent = `
@keyframes adShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes adPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
@keyframes adGlow { 0%,100%{box-shadow:0 0 8px var(--glow)} 50%{box-shadow:0 0 20px var(--glow),0 0 40px var(--glow2)} }
@keyframes adBreath { 0%,100%{opacity:.12} 50%{opacity:.25} }
@keyframes adFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes adSlideUp { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes adBarGrow { 0%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
@keyframes adRingPulse { 0%,100%{filter:drop-shadow(0 0 4px var(--ring))} 50%{filter:drop-shadow(0 0 12px var(--ring))} }
`;
    document.head.appendChild(s);
}

// ─── SVG ICONS ───
const SunriseIcon = ({s=16,c="#fcd34d"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M4.93 4.93l2.12 2.12M2 12h3M4.93 19.07l2.12-2.12M12 19v3M19.07 19.07l-2.12-2.12M22 12h-3M19.07 4.93l-2.12 2.12"/><path d="M7 17a5 5 0 0 1 10 0"/><line x1="3" y1="17" x2="21" y2="17"/></svg>;
const SunIcon = ({s=16,c="#f97316"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
const SunsetIcon = ({s=16,c="#8b5cf6"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M4.93 4.93l2.12 2.12M2 12h3M22 12h-3M19.07 4.93l-2.12 2.12"/><path d="M7 17a5 5 0 0 1 10 0"/><line x1="3" y1="17" x2="21" y2="17"/><path d="M12 17v5"/></svg>;
const MoonIcon = ({s=16,c="#3b82f6"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const ClockIcon = ({s=14,c="#cbd5e1"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FlameIcon = ({s=14,c="#f59e0b"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const ShieldIcon = ({s=14,c="#cbd5e1"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const CheckIcon = ({s=14,c="#22c55e"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const SwordIcon = ({s=14,c="#cbd5e1"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>;
const ScrollIcon = ({s=14,c="#cbd5e1"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>;
const TapIcon = ({s=14,c="#06b6d4"}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/></svg>;

// ─── RADAR HELPERS ───
const pol = (cx,cy,r,deg) => { const a=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}; };
const rpoly = (d,cx,cy,mr) => d.length ? d.map((v,i)=>{const p=pol(cx,cy,v*mr,(360/d.length)*i);return `${p.x},${p.y}`;}).join(" ") : "";
const fmtMin = m => { if(!m) return "0m"; const h=Math.floor(m/60); return h>0?`${h}h ${m%60}m`:`${m}m`; };

const DEFAULT_MICRO = [
    {id:"water",iconSrc:MICRO_ICONS.water,label:"Wasser",dailyTarget:8,color:"#3b82f6"},
    {id:"posture",iconSrc:MICRO_ICONS.posture,label:"Haltung",dailyTarget:5,color:"#22c55e"},
    {id:"stretch",iconSrc:MICRO_ICONS.stretch,label:"Stretch",dailyTarget:4,color:"#f59e0b"},
    {id:"gratitude",iconSrc:MICRO_ICONS.gratitude,label:"Dankbar",dailyTarget:3,color:"#a855f7"},
    {id:"breathe",iconSrc:MICRO_ICONS.breathe,label:"Atmen",dailyTarget:3,color:"#06b6d4"},
];

export default function AnalyticsDashboard({ state, theme, gameState }) {
    const cq = state?.completedQuests || [];
    const habits = state?.habits || [];
    const [historyTime, setHistoryTime] = useState("all");
    const [historyCat, setHistoryCat] = useState("all");
    const [selectedQuest, setSelectedQuest] = useState(null);

    // ── DATA ──
    const level = state?.level||1, streak = state?.streak||0, totalQ = state?.totalQuestsCompleted||0, focusMin = state?.focus?.totalMinutes||0;
    const xp = state?.xp||0, xpNeed = level*1000, xpPct = Math.min((xp/xpNeed)*100,100);
    const getRank = l => {
        if(l>=51) return {r:"S",l:"S-Rank",c:"#f59e0b",g:"rgba(245,158,11,0.35)"};
        if(l>=41) return {r:"A",l:"A-Rank",c:"#ef4444",g:"rgba(239,68,68,0.35)"};
        if(l>=31) return {r:"B",l:"B-Rank",c:"#a855f7",g:"rgba(168,85,247,0.35)"};
        if(l>=21) return {r:"C",l:"C-Rank",c:"#3b82f6",g:"rgba(59,130,246,0.35)"};
        if(l>=11) return {r:"D",l:"D-Rank",c:"#22c55e",g:"rgba(34,197,94,0.35)"};
        return {r:"E",l:"E-Rank",c:"#64748b",g:"rgba(100,116,139,0.25)"};
    };
    const rk = getRank(level);

    const primary = theme?.primary || "#22d3ee";
    const mono = "'JetBrains Mono',monospace";

    const conData = useMemo(() => {
        const days=[]; let rec=0,prev=0;
        for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=getLocalDateKey(d);const c=cq.filter(q=>q.completedAt===k).length;days.push({k,c});if(i<7)rec+=c;else prev+=c;}
        const ad=days.reduce((a,b)=>a+(b.c>0?1:0),0), score=Math.round((ad/14)*100), mx=Math.max(...days.map(d=>d.c),1);
        let fb="System wartet auf weitere Daten.",fc="#64748b";
        if(rec>0||prev>0){if(rec<prev*0.5&&prev>2){fb="Deine Leistung sinkt rapide. Die Gefahr rückt näher.";fc="#ef4444";}else if(rec>prev*1.5&&prev>0){fb="Aura-Ausbruch! Massive Steigerung zur Vorwoche.";fc="#22c55e";}else if(score>=80){fb="Herausragende Konsistenz. Dein Rhythmus ist unaufhaltsam.";fc="#a855f7";}else{fb="Rhythmus stabil. Kontinuierliches Training ist der Weg zur Macht.";fc=primary;}}
        return {score,fb,fc,days,mx,rec,prev};
    }, [cq, theme]);

    const chrono = useMemo(() => {
        const t={m:0,a:0,e:0,n:0}; let has=false;
        cq.forEach(q=>{if(q.completedAtMs){has=true;const h=new Date(q.completedAtMs).getHours();if(h>=6&&h<12)t.m++;else if(h>=12&&h<18)t.a++;else if(h>=18&&h<24)t.e++;else t.n++;}});
        const tot=t.m+t.a+t.e+t.n;
        return {has, stats:[
            {label:"Morgen",cnt:t.m,pct:tot>0?t.m/tot:0,color:"#fcd34d",Icon:SunriseIcon},
            {label:"Mittag",cnt:t.a,pct:tot>0?t.a/tot:0,color:"#f97316",Icon:SunIcon},
            {label:"Abend",cnt:t.e,pct:tot>0?t.e/tot:0,color:"#8b5cf6",Icon:SunsetIcon},
            {label:"Nacht",cnt:t.n,pct:tot>0?t.n/tot:0,color:"#3b82f6",Icon:MoonIcon},
        ]};
    }, [cq]);
    const peak = chrono.has ? [...chrono.stats].sort((a,b)=>b.cnt-a.cnt)[0] : null;

    const catSt = useMemo(() => {
        const c={str:0,int:0,vit:0,agi:0,cha:0}; let tq=0;
        cq.forEach(q=>{if(c[q.category]!==undefined){c[q.category]++;tq++;}});
        const mx=Math.max(...Object.values(c),1);
        return {has:tq>0, stats:[
            {key:"str",val:c.str,n:c.str/mx,color:"#ef4444",icon:STAT_ICONS.str},
            {key:"int",val:c.int,n:c.int/mx,color:"#3b82f6",icon:STAT_ICONS.int},
            {key:"vit",val:c.vit,n:c.vit/mx,color:"#22c55e",icon:STAT_ICONS.vit},
            {key:"agi",val:c.agi,n:c.agi/mx,color:"#f59e0b",icon:STAT_ICONS.agi},
            {key:"cha",val:c.cha,n:c.cha/mx,color:"#a855f7",icon:STAT_ICONS.cha},
        ]};
    }, [cq]);
    const top = catSt.has ? [...catSt.stats].sort((a,b)=>b.val-a.val)[0] : null;
    const diffSt = useMemo(() => {
        const d={easy:0,normal:0,hard:0,boss:0}; cq.forEach(q=>{if(d[q.difficulty]!==undefined)d[q.difficulty]++;}); const t=cq.length||1;
        return {easy:d.easy/t,normal:d.normal/t,hard:d.hard/t,boss:d.boss/t};
    }, [cq]);

    const habSt = useMemo(() => {
        if(!habits.length) return {has:false}; const tk=getToday(); let done=0,sk=0,best=null;
        habits.forEach(h=>{if(h.history?.[tk]?.completed)done++;sk+=(h.streak||0);if(!best||(h.streak||0)>(best.streak||0))best=h;});
        return {has:true,total:habits.length,done,rate:Math.round((done/habits.length)*100),avgS:(sk/habits.length).toFixed(1),best};
    }, [habits]);

    const microSt = useMemo(() => {
        const mh=state?.microHabits?.habits||DEFAULT_MICRO, taps=state?.microHabits?.totalTaps||0, tk=getToday();
        const td=state?.microHabits?.daily?.[tk]||{}, tt=mh.reduce((s,h)=>s+h.dailyTarget,0), dn=mh.reduce((s,h)=>s+Math.min(td[h.id]||0,h.dailyTarget),0);
        return {has:taps>0||dn>0,taps,pct:tt>0?Math.round((dn/tt)*100):0,dn,tt,habits:mh,td};
    }, [state?.microHabits]);

    const wk = useMemo(() => {
        let txp=0,lxp=0; const qc=conData.prev>0?Math.round(((conData.rec-conData.prev)/conData.prev)*100):(conData.rec>0?100:0);
        cq.forEach(q=>{if(!q.completedAtMs)return;const d=(Date.now()-q.completedAtMs)/864e5;if(d<=7)txp+=(q.xpEarned||0);else if(d<=14)lxp+=(q.xpEarned||0);});
        return {q:{cur:conData.rec,prev:conData.prev,chg:qc},xp:{cur:txp,prev:lxp,chg:lxp>0?Math.round(((txp-lxp)/lxp)*100):(txp>0?100:0)}};
    }, [cq,conData]);

    const hist = useMemo(() => {
        let l=[...cq]; const td=getToday(), wa=new Date(), ma=new Date(); wa.setDate(wa.getDate()-7); ma.setDate(ma.getDate()-30);
        if(historyTime==="today") l=l.filter(q=>q.completedAt===td);
        else if(historyTime==="week") l=l.filter(q=>q.completedAt>=getLocalDateKey(wa));
        else if(historyTime==="month") l=l.filter(q=>q.completedAt>=getLocalDateKey(ma));
        if(historyCat!=="all") l=l.filter(q=>q.category===historyCat);
        l.sort((a,b)=>(b.completedAtMs||0)-(a.completedAtMs||0)); return l.slice(0,200);
    }, [cq,historyTime,historyCat]);

    // ── PREMIUM CARD STYLE ──
    const mkCard = (delay = 0) => ({
        background: "linear-gradient(168deg, rgba(15,20,35,0.92) 0%, rgba(8,12,24,0.96) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "16px", marginBottom: 12,
        backdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        animation: `adSlideUp 0.5s ${delay}ms ease both`
    });
    const secT = (icon, label, color) => (
        <div style={{ fontSize: 9, letterSpacing: 2.5, color: color || primary, fontFamily: mono, marginBottom: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
            {icon} {label}
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color || primary}33, transparent)`, marginLeft: 4 }} />
        </div>
    );
    const chgBadge = v => {
        if (v > 0) return <span style={{fontSize:9,fontWeight:800,color:"#22c55e",fontFamily:mono,background:"rgba(34,197,94,0.1)",padding:"2px 6px",borderRadius:4}}>+{v}%</span>;
        if (v < 0) return <span style={{fontSize:9,fontWeight:800,color:"#ef4444",fontFamily:mono,background:"rgba(239,68,68,0.1)",padding:"2px 6px",borderRadius:4}}>{v}%</span>;
        return <span style={{fontSize:9,fontWeight:800,color:"#475569",fontFamily:mono,background:"rgba(255,255,255,0.03)",padding:"2px 6px",borderRadius:4}}>0%</span>;
    };

    return (
        <div style={{ paddingBottom: 40 }}>

            {/* ═══════════════════════════════════════════════
                1. HUNTER PROFILE — HOLOGRAPHIC CARD
            ═══════════════════════════════════════════════ */}
            <div style={{
                background: `linear-gradient(145deg, rgba(15,20,40,0.95), rgba(8,12,28,0.98))`,
                border: `1px solid ${rk.c}44`,
                borderRadius: 20, padding: "18px", marginBottom: 14,
                backdropFilter: "blur(20px)",
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px ${rk.g}`,
                position: "relative", overflow: "hidden",
                animation: "adSlideUp 0.4s ease both"
            }}>
                {/* Holographic shimmer overlay */}
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.04,
                    background: `linear-gradient(135deg, transparent 30%, ${rk.c} 50%, transparent 70%)`,
                    backgroundSize: "200% 200%",
                    animation: "adShimmer 6s ease infinite",
                    pointerEvents: "none"
                }} />
                {/* Corner glow */}
                <div style={{ position: "absolute", top: -80, right: -80, width: 200, height: 200, background: `radial-gradient(circle, ${rk.c}18 0%, transparent 65%)`, pointerEvents: "none", animation: "adBreath 4s ease infinite" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 150, height: 150, background: `radial-gradient(circle, ${primary}10 0%, transparent 65%)`, pointerEvents: "none" }} />

                {/* Row 1: Avatar + Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative", zIndex: 1 }}>
                    {/* Avatar with animated rank badge */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${rk.c}25, ${rk.c}08)`,
                            border: `2px solid ${rk.c}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif",
                            boxShadow: `0 0 16px ${rk.g}, inset 0 0 12px ${rk.c}15`,
                            "--glow": rk.g, "--glow2": `${rk.c}22`,
                            animation: "adGlow 3s ease infinite"
                        }}>
                            {state?.hunterName ? state.hunterName.charAt(0).toUpperCase() : "H"}
                        </div>
                        <div style={{
                            position: "absolute", bottom: -3, right: -3,
                            width: 24, height: 24, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${rk.c}, ${rk.c}bb)`,
                            border: "2.5px solid rgba(8,12,24,0.98)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 900, color: "#fff", fontFamily: mono,
                            boxShadow: `0 0 10px ${rk.g}`,
                            animation: "adFloat 3s ease infinite"
                        }}>
                            {rk.r}
                        </div>
                    </div>

                    {/* Name + Level + XP */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Outfit',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                                {state?.hunterName || "Hunter"}
                            </div>
                            <div style={{ fontSize: 10, color: rk.c, fontWeight: 700, fontFamily: mono, flexShrink: 0, textShadow: `0 0 8px ${rk.g}` }}>
                                Lv.{level}
                            </div>
                        </div>
                        {/* Animated XP Bar */}
                        <div style={{ height: 7, background: "rgba(0,0,0,0.6)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 4, position: "relative" }}>
                            <div style={{
                                width: `${xpPct}%`, height: "100%",
                                background: `linear-gradient(90deg, ${primary}55, ${primary}, ${primary}cc)`,
                                borderRadius: 4,
                                boxShadow: `0 0 10px ${primary}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
                                transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                                position: "relative"
                            }}>
                                {/* Shimmer on XP bar */}
                                <div style={{
                                    position: "absolute", inset: 0,
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                                    backgroundSize: "200% 100%",
                                    animation: "adShimmer 2.5s ease infinite"
                                }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#475569", fontFamily: mono }}>
                            <span style={{ color: rk.c, fontWeight: 700 }}>{rk.l}</span>
                            <span><span style={{ color: "#94a3b8" }}>{xp}</span> / {xpNeed}</span>
                        </div>
                    </div>
                </div>

                {/* Row 2: Stats Strip */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, zIndex: 1, position: "relative" }}>
                    {[
                        { label: "STREAK", val: <><span style={{animation:streak>0?"adPulse 2s ease infinite":"none",display:"inline-flex"}}>{streak>0&&<FlameIcon s={13} c="#f59e0b"/>}</span>{streak}</>, color: streak > 0 ? "#f59e0b" : "#475569" },
                        { label: "FOCUS", val: <><ClockIcon s={11} c="#3b82f6"/>{fmtMin(focusMin)}</>, color: "#fff" },
                        { label: "QUESTS", val: totalQ, color: "#fff" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                            padding: "10px 8px", borderRadius: 12, textAlign: "center",
                            border: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.2)"
                        }}>
                            <div style={{ fontSize: 7, color: "#536078", fontFamily: mono, letterSpacing: 1.5, marginBottom: 5 }}>{s.label}</div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: s.color, fontFamily: "'Cinzel',serif", display: "flex", justifyContent: "center", alignItems: "center", gap: 4, lineHeight: 1 }}>
                                {s.val}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                2. SYSTEM INTELLIGENCE
            ═══════════════════════════════════════════════ */}
            <div style={mkCard(80)}>
                {secT(<ShieldIcon s={12} c={primary}/>, "SYSTEM INTELLIGENCE")}
                <div style={{
                    fontSize: 11, color: conData.fc, lineHeight: 1.6, fontFamily: "'Outfit',sans-serif",
                    background: `linear-gradient(135deg, ${conData.fc}0c, transparent)`,
                    padding: "10px 14px", borderRadius: 10, borderLeft: `3px solid ${conData.fc}`,
                    marginBottom: 14, boxShadow: `inset 0 0 20px ${conData.fc}08`
                }}>
                    {conData.fb}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                        <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", "--ring": conData.score > 80 ? `${primary}88` : "#ef444488", animation: "adRingPulse 3s ease infinite" }}>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
                            {(conData.rec>0||conData.prev>0)&&<circle cx="50" cy="50" r="40" fill="none"
                                stroke={conData.score>80?primary:conData.score>40?"#f59e0b":"#ef4444"}
                                strokeWidth="7" strokeLinecap="round"
                                strokeDasharray="251.2" strokeDashoffset={251.2-(251.2*conData.score)/100}
                                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />}
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Cinzel',serif" }}>{conData.score}</span>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 32 }}>
                            {conData.days.map((d,i) => {
                                const h = Math.max((d.c/conData.mx)*100,8);
                                const recent = i>=7;
                                return <div key={i} style={{
                                    flex:1, borderRadius:3, height:`${h}%`,
                                    background: d.c > 0
                                        ? (recent ? `linear-gradient(180deg, ${primary}, ${primary}88)` : `linear-gradient(180deg, #64748b, #475569)`)
                                        : "rgba(255,255,255,0.02)",
                                    opacity: recent ? 1 : 0.3,
                                    boxShadow: d.c > 0 && recent ? `0 0 6px ${primary}44` : "none",
                                    transition: "height 0.4s ease",
                                    animation: d.c > 0 ? `adBarGrow 0.6s ${i*40}ms ease both` : "none",
                                    transformOrigin: "bottom"
                                }} />;
                            })}
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:7, color:"#3e4a5e", fontFamily:mono }}>
                            <span>Letzte Woche</span><span>Diese Woche</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                3+4 GRID: CHRONO + AURA
            ═══════════════════════════════════════════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={mkCard(160)}>
                    {secT(<ClockIcon s={11} c={primary}/>, "CHRONO")}
                    {!chrono.has ? <div style={{textAlign:"center",padding:"20px 0",color:"#3e4a5e",fontSize:10,fontFamily:mono}}>Warte auf Daten</div> : (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                            {chrono.stats.map((d,i) => {
                                const isPeak = peak?.label === d.label;
                                return (
                                    <div key={i} style={{
                                        background: isPeak ? `linear-gradient(135deg, ${d.color}12, ${d.color}05)` : "rgba(255,255,255,0.015)",
                                        borderRadius:10, padding:"10px 6px", textAlign:"center",
                                        border: `1px solid ${isPeak ? d.color+"33" : "rgba(255,255,255,0.03)"}`,
                                        boxShadow: isPeak ? `inset 0 0 16px ${d.color}0c, 0 0 12px ${d.color}08` : "none",
                                        transition: "all 0.3s ease"
                                    }}>
                                        <div style={{ filter: `drop-shadow(0 0 6px ${d.color}66)` }}><d.Icon s={18} c={d.color}/></div>
                                        <div style={{ fontSize:16, fontWeight:900, color:d.color, fontFamily:"'Cinzel',serif", marginTop:4, textShadow: `0 0 8px ${d.color}44` }}>{d.cnt}</div>
                                        <div style={{ fontSize:7, color:"#3e4a5e", fontFamily:mono, letterSpacing:1, marginTop:3 }}>{d.label.toUpperCase()}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div style={mkCard(200)}>
                    {secT(<ShieldIcon s={11} c={primary}/>, "AURA")}
                    {!catSt.has ? <div style={{textAlign:"center",padding:"20px 0",color:"#3e4a5e",fontSize:10,fontFamily:mono}}>Keine Daten</div> : (
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                            <div style={{ position:"relative", width:110, height:110 }}>
                                <svg width="110" height="110" viewBox="0 0 110 110">
                                    <defs>
                                        <radialGradient id="radarGlow"><stop offset="0%" stopColor={top?.color} stopOpacity="0.25"/><stop offset="100%" stopColor={top?.color} stopOpacity="0"/></radialGradient>
                                    </defs>
                                    <circle cx="55" cy="55" r="40" fill="url(#radarGlow)" opacity="0.3" />
                                    {[0.33,0.66,1].map(sc => <polygon key={sc} points={rpoly([1,1,1,1,1],55,55,40*sc)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
                                    {[0,1,2,3,4].map(i => {const p=pol(55,55,40,(360/5)*i);return <line key={i} x1="55" y1="55" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>})}
                                    <polygon points={rpoly(catSt.stats.map(c=>c.n),55,55,40)} fill={`${top?.color}25`} stroke={top?.color} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 8px ${top?.color}99)`, transition:"all 0.6s ease"}}/>
                                </svg>
                                {catSt.stats.map((c,i) => {const p=pol(55,55,48,(360/5)*i);return <img key={i} src={c.icon} alt={c.key} style={{position:"absolute",left:p.x-7,top:p.y-7,width:14,height:14,filter:`drop-shadow(0 0 4px ${c.color}88)`}}/>;})}
                            </div>
                            <div style={{ fontSize:9, color:"#64748b", fontFamily:mono, marginTop:6 }}>
                                Dominante Aura: <span style={{color:top?.color,fontWeight:800,textShadow:`0 0 6px ${top?.color}44`}}>{top?.key.toUpperCase()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                5+6 GRID: HABITS + MICRO
            ═══════════════════════════════════════════════ */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={mkCard(240)}>
                    {secT(<CheckIcon s={11} c="#22c55e"/>, "HABITS", "#22c55e")}
                    {!habSt.has ? <div style={{textAlign:"center",padding:"14px 0",color:"#3e4a5e",fontSize:10,fontFamily:mono}}>Keine Habits</div> : (
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{ position:"relative", width:52, height:52, flexShrink:0 }}>
                                    <svg width="52" height="52" viewBox="0 0 100 100" style={{transform:"rotate(-90deg)","--ring":"rgba(34,197,94,0.5)",animation:"adRingPulse 3s ease infinite"}}>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10"/>
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
                                            strokeDasharray="251.2" strokeDashoffset={251.2-(251.2*habSt.rate)/100}
                                            style={{transition:"stroke-dashoffset 1s ease"}}/>
                                    </svg>
                                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                                        <span style={{fontSize:14,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif"}}>{habSt.rate}%</span>
                                    </div>
                                </div>
                                <div style={{flex:1,fontSize:10,fontFamily:mono}}>
                                    <div style={{color:"#94a3b8",marginBottom:4}}>{habSt.done}/{habSt.total} heute</div>
                                    <div style={{color:"#3e4a5e"}}>Ø {habSt.avgS}d Streak</div>
                                </div>
                            </div>
                            {habSt.best && <div style={{fontSize:9,color:"#94a3b8",background:"linear-gradient(135deg,rgba(34,197,94,0.06),transparent)",padding:"6px 8px",borderRadius:8,fontFamily:mono,borderLeft:"2px solid #22c55e44"}}>
                                Best: <span style={{color:"#4ade80",fontWeight:700}}>{habSt.best.title}</span> ({habSt.best.streak}d)
                            </div>}
                        </div>
                    )}
                </div>
                <div style={mkCard(280)}>
                    {secT(<TapIcon s={11} c="#06b6d4"/>, "MICRO", "#06b6d4")}
                    {!microSt.has ? <div style={{textAlign:"center",padding:"14px 0",color:"#3e4a5e",fontSize:10,fontFamily:mono}}>Noch keine Taps</div> : (
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{fontSize:24,fontWeight:900,color:"#06b6d4",fontFamily:"'Cinzel',serif",textShadow:"0 0 12px rgba(6,182,212,0.3)",lineHeight:1}}>{microSt.taps}</div>
                                <div style={{fontSize:8,color:"#3e4a5e",fontFamily:mono,lineHeight:1.4}}>LIFETIME<br/>TAPS</div>
                            </div>
                            <div style={{display:"flex",gap:4}}>
                                {microSt.habits.map(h => {
                                    const d=Math.min(microSt.td[h.id]||0,h.dailyTarget), p=(d/h.dailyTarget)*100, ok=d>=h.dailyTarget;
                                    return <div key={h.id} style={{flex:1,textAlign:"center"}}>
                                        {h.iconSrc ? <img src={h.iconSrc} alt={h.label} style={{width:14,height:14,objectFit:"contain",filter:ok?`brightness(1.3) drop-shadow(0 0 4px ${h.color}88)`:"brightness(0.4)",display:"block",margin:"0 auto 3px"}}/> :
                                        <div style={{width:14,height:14,margin:"0 auto 3px",fontSize:7,color:h.color,fontWeight:900,fontFamily:mono,display:"flex",alignItems:"center",justifyContent:"center"}}>{h.label.charAt(0)}</div>}
                                        <div style={{height:3,background:"rgba(255,255,255,0.03)",borderRadius:2,overflow:"hidden"}}>
                                            <div style={{width:`${p}%`,height:"100%",background:ok?h.color:h.color+"66",borderRadius:2,transition:"width 0.3s",boxShadow:ok?`0 0 4px ${h.color}66`:"none"}}/>
                                        </div>
                                    </div>;
                                })}
                            </div>
                            <div style={{fontSize:8,color:"#3e4a5e",fontFamily:mono,textAlign:"center"}}>
                                Heute: <span style={{color:"#06b6d4"}}>{microSt.dn}/{microSt.tt}</span> ({microSt.pct}%)
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                7. WEEKLY COMPARISON
            ═══════════════════════════════════════════════ */}
            <div style={mkCard(320)}>
                {secT(<SwordIcon s={11} c={primary}/>, "WOCHENVERGLEICH")}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                        { label: "QUESTS (7D)", val: wk.q.cur, sub: `vs ${wk.q.prev}`, chg: wk.q.chg, color: "#fff" },
                        { label: "XP GAIN (7D)", val: `+${wk.xp.cur}`, sub: `vs ${wk.xp.prev}`, chg: wk.xp.chg, color: "#a855f7" },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))",
                            padding: "12px", borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.04)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
                        }}>
                            <div style={{ fontSize:8, color:"#3e4a5e", fontFamily:mono, marginBottom:6, letterSpacing:1 }}>{item.label}</div>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                                <span style={{ fontSize:20, fontWeight:900, color:item.color, fontFamily:"'Outfit',sans-serif" }}>{item.val}</span>
                                {chgBadge(item.chg)}
                            </div>
                            <div style={{ fontSize:8, color:"#2a3444", fontFamily:mono }}>{item.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                DIFFICULTY BREAKDOWN
            ═══════════════════════════════════════════════ */}
            {cq.length > 0 && (
                <div style={mkCard(360)}>
                    {secT(<SwordIcon s={11} c={primary}/>, "SCHWIERIGKEITSGRAD")}
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {[{k:"easy",l:"EASY",c:"#a855f7"},{k:"normal",l:"NORMAL",c:"#3b82f6"},{k:"hard",l:"HARD",c:"#f59e0b"},{k:"boss",l:"BOSS",c:"#ef4444"}].map(d => (
                            <div key={d.k} style={{display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:8,color:"#3e4a5e",fontFamily:mono,width:42,fontWeight:700}}>{d.l}</span>
                                <div style={{flex:1,height:6,background:"rgba(255,255,255,0.03)",borderRadius:3,overflow:"hidden"}}>
                                    <div style={{
                                        width:`${diffSt[d.k]*100}%`, height:"100%",
                                        background:`linear-gradient(90deg, ${d.c}88, ${d.c})`,
                                        borderRadius:3, boxShadow:`0 0 6px ${d.c}44`,
                                        transition:"width 0.6s ease",
                                        animation:`adBarGrow 0.8s ease both`, transformOrigin:"left"
                                    }}/>
                                </div>
                                <span style={{fontSize:8,color:"#64748b",fontFamily:mono,width:30,textAlign:"right"}}>{Math.round(diffSt[d.k]*100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                8. HUNTER'S CHRONICLE
            ═══════════════════════════════════════════════ */}
            <div style={mkCard(400)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:9,letterSpacing:2.5,color:primary,fontFamily:mono,fontWeight:800,display:"flex",alignItems:"center",gap:6}}>
                        <ScrollIcon s={12} c={primary}/> CHRONICLE
                        <div style={{flex:0,height:1,width:20,background:`${primary}33`}}/>
                    </div>
                    <span style={{fontSize:9,color:"#3e4a5e",fontFamily:mono,padding:"3px 8px",background:"linear-gradient(135deg,rgba(255,255,255,0.04),transparent)",borderRadius:6,border:"1px solid rgba(255,255,255,0.04)"}}>{hist.length}</span>
                </div>

                {/* Filters */}
                <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
                    {[{k:"all",l:"ALLE"},{k:"today",l:"HEUTE"},{k:"week",l:"7D"},{k:"month",l:"30D"}].map(f => (
                        <button key={f.k} onClick={()=>setHistoryTime(f.k)} style={{
                            padding:"5px 12px",borderRadius:8,fontSize:8,fontWeight:800,fontFamily:mono,letterSpacing:1,cursor:"pointer",
                            background:historyTime===f.k?`linear-gradient(135deg,${primary}22,${primary}11)`:"rgba(255,255,255,0.02)",
                            color:historyTime===f.k?primary:"#3e4a5e",
                            border:`1px solid ${historyTime===f.k?primary+"55":"rgba(255,255,255,0.03)"}`,
                            boxShadow:historyTime===f.k?`0 0 8px ${primary}22`:"none",
                            whiteSpace:"nowrap",transition:"all 0.2s ease"
                        }}>{f.l}</button>
                    ))}
                </div>
                <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
                    <button onClick={()=>setHistoryCat("all")} style={{
                        padding:"3px 10px",borderRadius:6,fontSize:8,fontWeight:700,fontFamily:mono,cursor:"pointer",
                        background:historyCat==="all"?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.015)",color:historyCat==="all"?"#e2e8f0":"#3e4a5e",border:"none"
                    }}>ALLE</button>
                    {CATEGORIES.map(c => (
                        <button key={c.key} onClick={()=>setHistoryCat(c.key)} style={{
                            padding:"3px 10px",borderRadius:6,fontSize:8,fontWeight:700,fontFamily:mono,cursor:"pointer",
                            background:historyCat===c.key?`${c.color}1a`:"rgba(255,255,255,0.015)",color:historyCat===c.key?c.color:"#3e4a5e",
                            border:`1px solid ${historyCat===c.key?c.color+"44":"transparent"}`,
                            boxShadow:historyCat===c.key?`0 0 6px ${c.color}22`:"none"
                        }}>{c.stat}</button>
                    ))}
                </div>

                <div style={{maxHeight:400,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,WebkitOverflowScrolling:"touch"}}>
                    {hist.length===0 ? (
                        <div style={{textAlign:"center",padding:"40px 12px",fontSize:10,color:"#2a3444",fontFamily:mono}}>Keine Einträge gefunden.</div>
                    ) : hist.map((q,i) => {
                        const cat=CATEGORIES.find(c=>c.key===q.category)||CATEGORIES[0];
                        const diff=DIFFICULTIES.find(d=>d.key===q.difficulty)||DIFFICULTIES[1];
                        const ts=q.completedAtMs?new Date(q.completedAtMs).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):"";
                        return (
                            <div key={q.id+"-"+i} onClick={()=>setSelectedQuest(q)} style={{
                                padding:"12px 14px",borderRadius:12,
                                background:"linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))",
                                border:"1px solid rgba(255,255,255,0.04)",
                                borderLeft:`3px solid ${cat.color}`,
                                cursor:"pointer",transition:"all 0.2s ease",
                                boxShadow:`inset 0 0 0 0 ${cat.color}00`,
                                animation:`adSlideUp 0.3s ${Math.min(i*30,300)}ms ease both`
                            }}
                            onPointerDown={e=>{e.currentTarget.style.transform="scale(0.98)";e.currentTarget.style.background=`linear-gradient(135deg,${cat.color}0a,rgba(255,255,255,0.02))`;}}
                            onPointerUp={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background="linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))";}}
                            onPointerLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background="linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))";}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                                    <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{q.title}</div>
                                    <span style={{fontSize:7,color:diff.color,fontFamily:mono,fontWeight:800,padding:"2px 6px",background:`${diff.color}12`,borderRadius:4,border:`1px solid ${diff.color}33`,flexShrink:0}}>{diff.label}</span>
                                </div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                        <img src={cat.iconSrc} alt={cat.stat} style={{width:12,height:12,filter:`drop-shadow(0 0 4px ${cat.color}88)`}}/>
                                        <span style={{fontSize:8,color:"#3e4a5e",fontFamily:mono}}>{q.completedAt}{ts&&` ${ts}`}</span>
                                    </div>
                                    <div style={{display:"flex",gap:8,fontSize:9,fontFamily:mono,fontWeight:800}}>
                                        {q.xpEarned>0&&<span style={{color:"#a855f7",textShadow:"0 0 6px rgba(168,85,247,0.4)"}}>+{q.xpEarned}XP</span>}
                                        {q.goldEarned>0&&<span style={{color:"#fbbf24",textShadow:"0 0 6px rgba(251,191,36,0.4)"}}>+{q.goldEarned}G</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedQuest && <QuestDetailModal quest={selectedQuest} theme={theme} onClose={()=>setSelectedQuest(null)} gameState={gameState} readOnly={true}/>}
        </div>
    );
}
