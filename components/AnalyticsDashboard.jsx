import React, { useMemo, useState } from "react";
import { STAT_ICONS, MICRO_ICONS, HEALTH_ICONS, NAV_ICONS } from "../data/icons.js";
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

const HEALTH_STEP_GOAL = 10000;
const HEALTH_SLEEP_GOAL = 7;
const SCREEN_LIMIT_DEFAULT = 180;
const INSIGHT_RANGES = [
    { key: "7d", label: "7D", days: 7 },
    { key: "14d", label: "14D", days: 14 },
    { key: "30d", label: "30D", days: 30 },
];
const DAY_LABELS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

const getInsightRange = key => INSIGHT_RANGES.find(r => r.key === key) || INSIGHT_RANGES[0];
const fmtNum = value => Math.max(0, Math.round(Number(value) || 0)).toLocaleString("de-DE");
const fmtHours = value => `${Math.max(0, Number(value) || 0).toFixed(1)}h`;
const fmtTrend = (current, previous, suffix = "%") => {
    if (!previous) return current > 0 ? "NEU" : `0${suffix}`;
    const delta = ((current - previous) / previous) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}${suffix}`;
};
const fmtHourTrend = (current, previous) => {
    if (!previous) return current > 0 ? "NEU" : "0.0h";
    const delta = current - previous;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}h`;
};
const formatInsightLabel = (date, daysBack, rangeDays) => {
    if (daysBack === 0) return "HEUTE";
    if (rangeDays <= 14) return DAY_LABELS[date.getDay()];
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.`;
};
const getScreenLimit = state => Math.max(1, Math.floor(Number(state?.screenTimePreferences?.dailyLimitMinutes) || SCREEN_LIMIT_DEFAULT));

function buildHealthRows(state, rangeDays, offsetDays = 0) {
    const history = { ...(state?.healthDailyHistory || {}) };
    const todayKey = getToday();
    const today = { ...(history[todayKey] || {}) };
    if (today.steps === undefined && Number(state?.dailySteps) > 0) today.steps = state.dailySteps;
    if (today.sleepHours === undefined && Number(state?.dailySleepHours) > 0) today.sleepHours = state.dailySleepHours;
    if (today.steps !== undefined || today.sleepHours !== undefined) history[todayKey] = today;

    const sleepMode = state?.healthPreferences?.sleepMode || "auto";
    const manualSleepLog = state?.healthPreferences?.manualSleepLog || {};
    const manualSleepToday = state?.healthPreferences?.manualSleepToday || 0;
    const rows = [];

    for (let i = rangeDays - 1 + offsetDays; i >= offsetDays; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = getLocalDateKey(date);
        const saved = history[dateKey] || {};
        let sleepHours = Math.max(0, Number(saved.sleepHours) || 0);
        if (sleepMode === "manual") {
            const manualValue = manualSleepLog[dateKey] ?? (dateKey === todayKey ? manualSleepToday : null);
            if (manualValue !== null && manualValue !== undefined) sleepHours = Math.max(0, Number(manualValue) || 0);
        }
        if (sleepMode === "off") sleepHours = 0;
        rows.push({
            date: dateKey,
            label: formatInsightLabel(date, i - offsetDays, rangeDays),
            steps: Math.max(0, Math.floor(Number(saved.steps) || 0)),
            sleepHours,
        });
    }

    return rows;
}

function summarizeHealthRows(rows = []) {
    const totalSteps = rows.reduce((sum, row) => sum + row.steps, 0);
    const avgSteps = rows.length ? Math.round(totalSteps / rows.length) : 0;
    const stepGoalDays = rows.filter(row => row.steps >= HEALTH_STEP_GOAL).length;
    const sleepRows = rows.filter(row => row.sleepHours > 0);
    const avgSleep = sleepRows.length ? sleepRows.reduce((sum, row) => sum + row.sleepHours, 0) / sleepRows.length : 0;
    const sleepGoalDays = rows.filter(row => row.sleepHours >= HEALTH_SLEEP_GOAL).length;
    const bestSteps = rows.reduce((best, row) => row.steps > (best?.steps || 0) ? row : best, null);
    const bestSleep = rows.reduce((best, row) => row.sleepHours > (best?.sleepHours || 0) ? row : best, null);
    return { totalSteps, avgSteps, stepGoalDays, avgSleep, sleepGoalDays, bestSteps, bestSleep, hasData: totalSteps > 0 || sleepRows.length > 0 };
}

function buildScreenRows(state, rangeDays, offsetDays = 0) {
    const history = state?.screenTimeDailyHistory || {};
    const limit = getScreenLimit(state);
    const todayKey = getToday();
    const rows = [];

    for (let i = rangeDays - 1 + offsetDays; i >= offsetDays; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = getLocalDateKey(date);
        const saved = history[dateKey] || {};
        const fallbackToday = dateKey === todayKey ? state?.dailyScreenTimeMinutes : 0;
        const hasData = saved.totalMinutes !== undefined || (dateKey === todayKey && state?.dailyScreenTimeMinutes !== undefined);
        const totalMinutes = Math.max(0, Math.floor(Number(saved.totalMinutes ?? fallbackToday) || 0));
        const limitMinutes = Math.max(1, Math.floor(Number(saved.limitMinutes) || limit));
        rows.push({
            date: dateKey,
            label: formatInsightLabel(date, i - offsetDays, rangeDays),
            totalMinutes,
            limitMinutes,
            underLimit: hasData ? (saved.underLimit ?? totalMinutes <= limitMinutes) : false,
            hasData,
        });
    }

    return rows;
}

function summarizeScreenRows(rows = []) {
    const totalMinutes = rows.reduce((sum, row) => sum + row.totalMinutes, 0);
    const avgMinutes = rows.length ? Math.round(totalMinutes / rows.length) : 0;
    const underLimitDays = rows.filter(row => row.hasData && row.underLimit).length;
    const limitAvg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.limitMinutes, 0) / rows.length) : SCREEN_LIMIT_DEFAULT;
    const worstDay = rows.reduce((worst, row) => row.totalMinutes > (worst?.totalMinutes || 0) ? row : worst, null);
    return { totalMinutes, avgMinutes, underLimitDays, limitAvg, worstDay, hasData: rows.some(row => row.hasData) };
}

function MiniInsightBars({ rows = [], valueKey, goal = 1, color = "#38bdf8", formatter = value => value }) {
    const max = Math.max(goal, ...rows.map(row => Number(row[valueKey]) || 0), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 58, padding: "8px 2px 0" }}>
            {rows.map((row, index) => {
                const value = Number(row[valueKey]) || 0;
                const height = Math.max(5, Math.round((value / max) * 100));
                const showLabel = rows.length <= 14 || index === 0 || index === rows.length - 1 || index % 5 === 0;
                return (
                    <div key={`${row.date}-${index}`} title={`${row.label}: ${formatter(value)}`} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", minWidth: 4, maxWidth: 14, height: `${height}%`, borderRadius: "6px 6px 2px 2px", background: value > 0 ? `linear-gradient(180deg, ${color}, ${color}77)` : "rgba(255,255,255,0.04)", boxShadow: value > 0 ? `0 0 10px ${color}33` : "none", transition: "height .45s ease" }} />
                        {showLabel && <span style={{ color: "#334155", fontSize: 7, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{row.label}</span>}
                    </div>
                );
            })}
        </div>
    );
}

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
    const [insightRange, setInsightRange] = useState(state?.healthPreferences?.healthHistoryRange || state?.screenTimePreferences?.screenTimeHistoryRange || "7d");

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

    const healthUsage = useMemo(() => {
        const range = getInsightRange(insightRange);
        const healthRows = buildHealthRows(state, range.days, 0);
        const previousHealthRows = buildHealthRows(state, range.days, range.days);
        const screenRows = buildScreenRows(state, range.days, 0);
        const previousScreenRows = buildScreenRows(state, range.days, range.days);
        const health = summarizeHealthRows(healthRows);
        const previousHealth = summarizeHealthRows(previousHealthRows);
        const screen = summarizeScreenRows(screenRows);
        const previousScreen = summarizeScreenRows(previousScreenRows);
        const focusScore = Math.round(
            ((health.stepGoalDays / range.days) * 32) +
            ((health.sleepGoalDays / range.days) * 34) +
            ((screen.underLimitDays / range.days) * 34)
        );
        let signal = "Noch zu wenig Health- und Fokusdaten fuer ein klares Muster.";
        let signalColor = "#64748b";
        if (health.hasData || screen.hasData) {
            if (focusScore >= 78) { signal = "Regeneration und Fokus sind im Gleichgewicht. Der Tagesrhythmus traegt."; signalColor = "#22c55e"; }
            else if (health.avgSleep > 0 && health.avgSleep < 6) { signal = "Schlaf ist der Engpass. Mehr Erholung wuerde deine Quest-Leistung stabilisieren."; signalColor = "#a78bfa"; }
            else if (screen.hasData && screen.avgMinutes > screen.limitAvg) { signal = "Bildschirmzeit drueckt auf den Fokus. Setze den Limit-Streak als Tagesziel."; signalColor = "#f59e0b"; }
            else if (health.avgSteps < 5500 && health.hasData) { signal = "Bewegung ist niedrig. Ein kurzer Spaziergang hebt deine Grundenergie."; signalColor = "#38bdf8"; }
            else { signal = "Basis stabil. Kleine Verbesserungen bei Schlaf, Schritten oder Screen-Time bringen jetzt Wirkung."; signalColor = primary; }
        }
        return {
            range,
            healthRows,
            screenRows,
            health,
            screen,
            focusScore: Math.min(100, focusScore),
            signal,
            signalColor,
            stepsTrend: fmtTrend(health.totalSteps, previousHealth.totalSteps),
            sleepTrend: fmtHourTrend(health.avgSleep, previousHealth.avgSleep),
            screenTrend: fmtTrend(screen.totalMinutes, previousScreen.totalMinutes),
        };
    }, [state, insightRange, primary]);

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

            {/* Profile card removed — identity lives in TopBar, analysis starts directly below */}

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
            <div style={mkCard(340)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{marginBottom:0,flex:"1 1 220px"}}>
                        {secT(<img src={HEALTH_ICONS.steps} alt="" style={{width:13,height:13,objectFit:"contain",filter:"drop-shadow(0 0 5px rgba(56,189,248,.55))"}}/>, "HEALTH + USAGE", "#38bdf8")}
                    </div>
                    <div style={{display:"flex",gap:5,padding:3,borderRadius:10,background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.06)"}}>
                        {INSIGHT_RANGES.map(range => (
                            <button key={range.key} type="button" onClick={()=>setInsightRange(range.key)} style={{
                                minWidth:38,minHeight:28,borderRadius:8,border:`1px solid ${insightRange===range.key?"rgba(56,189,248,.44)":"transparent"}`,
                                background:insightRange===range.key?"rgba(56,189,248,.13)":"transparent",
                                color:insightRange===range.key?"#7dd3fc":"#64748b",
                                fontSize:8,fontWeight:900,fontFamily:mono,letterSpacing:1,cursor:"pointer"
                            }}>{range.label}</button>
                        ))}
                    </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(128px, 1fr))",gap:8,marginBottom:12}}>
                    {[
                        { label:"AVG SCHRITTE", value:fmtNum(healthUsage.health.avgSteps), detail:`${healthUsage.health.stepGoalDays}/${healthUsage.range.days} Zieltage`, color:"#38bdf8", icon:HEALTH_ICONS.steps },
                        { label:"AVG SCHLAF", value:fmtHours(healthUsage.health.avgSleep), detail:`Trend ${healthUsage.sleepTrend}`, color:"#a78bfa", icon:HEALTH_ICONS.sleep },
                        { label:"SCREEN AVG", value:fmtMin(healthUsage.screen.avgMinutes), detail:`Limit ${fmtMin(healthUsage.screen.limitAvg)}`, color:"#f59e0b", icon:NAV_ICONS.timer },
                        { label:"FOKUS-TAGE", value:`${healthUsage.screen.underLimitDays}/${healthUsage.range.days}`, detail:`Trend ${healthUsage.screenTrend}`, color:"#22c55e", icon:NAV_ICONS.analytics },
                    ].map(item => (
                        <div key={item.label} style={{padding:"12px 10px",borderRadius:12,background:"linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.01))",border:`1px solid ${item.color}1f`,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                                <img src={item.icon} alt="" style={{width:16,height:16,objectFit:"contain",filter:`drop-shadow(0 0 5px ${item.color}66)`}}/>
                                <div style={{fontSize:8,color:"#64748b",fontFamily:mono,fontWeight:900,letterSpacing:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>
                            </div>
                            <div style={{fontSize:19,fontWeight:900,color:item.color,fontFamily:"'Cinzel',serif",lineHeight:1,marginBottom:5,textShadow:`0 0 12px ${item.color}33`}}>{item.value}</div>
                            <div style={{fontSize:8,color:"#475569",fontFamily:mono,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.detail}</div>
                        </div>
                    ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(230px, 1fr))",gap:10}}>
                    <div style={{padding:"13px",borderRadius:14,background:"rgba(56,189,248,0.045)",border:"1px solid rgba(56,189,248,0.12)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:9}}>
                            <div style={{fontSize:9,color:"#7dd3fc",fontFamily:mono,fontWeight:900,letterSpacing:2}}>BODY SIGNALS</div>
                            <span style={{fontSize:8,color:"#475569",fontFamily:mono}}>{healthUsage.stepsTrend}</span>
                        </div>
                        <MiniInsightBars rows={healthUsage.healthRows} valueKey="steps" goal={HEALTH_STEP_GOAL} color="#38bdf8" formatter={fmtNum}/>
                        <div style={{height:1,background:"rgba(255,255,255,.05)",margin:"10px 0"}}/>
                        <MiniInsightBars rows={healthUsage.healthRows} valueKey="sleepHours" goal={HEALTH_SLEEP_GOAL} color="#a78bfa" formatter={fmtHours}/>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#475569",fontFamily:mono,marginTop:8}}>
                            <span>Best steps {fmtNum(healthUsage.health.bestSteps?.steps || 0)}</span>
                            <span>Best sleep {fmtHours(healthUsage.health.bestSleep?.sleepHours || 0)}</span>
                        </div>
                    </div>

                    <div style={{padding:"13px",borderRadius:14,background:"rgba(245,158,11,0.045)",border:"1px solid rgba(245,158,11,0.12)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:9}}>
                            <div style={{fontSize:9,color:"#fbbf24",fontFamily:mono,fontWeight:900,letterSpacing:2}}>FOCUS GUARD</div>
                            <span style={{fontSize:8,color:healthUsage.screen.avgMinutes>healthUsage.screen.limitAvg?"#f59e0b":"#22c55e",fontFamily:mono}}>{healthUsage.screen.avgMinutes>healthUsage.screen.limitAvg?"OVER LIMIT":"UNDER LIMIT"}</span>
                        </div>
                        <MiniInsightBars rows={healthUsage.screenRows} valueKey="totalMinutes" goal={healthUsage.screen.limitAvg} color="#f59e0b" formatter={fmtMin}/>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                            <div style={{padding:"9px",borderRadius:10,background:"rgba(0,0,0,.18)",border:"1px solid rgba(255,255,255,.04)"}}>
                                <div style={{fontSize:8,color:"#475569",fontFamily:mono,marginBottom:4}}>TOTAL</div>
                                <div style={{fontSize:15,color:"#fbbf24",fontWeight:900,fontFamily:"'Cinzel',serif"}}>{fmtMin(healthUsage.screen.totalMinutes)}</div>
                            </div>
                            <div style={{padding:"9px",borderRadius:10,background:"rgba(0,0,0,.18)",border:"1px solid rgba(255,255,255,.04)"}}>
                                <div style={{fontSize:8,color:"#475569",fontFamily:mono,marginBottom:4}}>PEAK</div>
                                <div style={{fontSize:15,color:"#fbbf24",fontWeight:900,fontFamily:"'Cinzel',serif"}}>{fmtMin(healthUsage.screen.worstDay?.totalMinutes || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{marginTop:10,padding:"12px 13px",borderRadius:14,background:`linear-gradient(135deg, ${healthUsage.signalColor}12, rgba(255,255,255,.025))`,border:`1px solid ${healthUsage.signalColor}24`,display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:48,height:48,borderRadius:"50%",display:"grid",placeItems:"center",background:`${healthUsage.signalColor}16`,border:`1px solid ${healthUsage.signalColor}35`,flexShrink:0}}>
                        <span style={{fontSize:16,fontWeight:900,color:healthUsage.signalColor,fontFamily:"'Cinzel',serif"}}>{healthUsage.focusScore}</span>
                    </div>
                    <div style={{minWidth:0}}>
                        <div style={{fontSize:9,color:healthUsage.signalColor,fontFamily:mono,fontWeight:900,letterSpacing:2,marginBottom:4}}>RECOVERY / FOCUS SIGNAL</div>
                        <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.45}}>{healthUsage.signal}</div>
                    </div>
                </div>
            </div>

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
