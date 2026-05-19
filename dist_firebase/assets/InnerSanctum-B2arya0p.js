import{r as T,g as B,S as A,N as J,H as P,j as e,c as b,a as U,b as H,h as C,e as V}from"./index-B4kPcKCz.js";const _=["Ich bin der Architekt meines eigenen Schicksals. Niemand wird die Arbeit fuer mich erledigen.","Jeder Widerstand formt meinen Charakter. Ich begruesse den Schmerz des Wachstums.","Meine Zeit ist mein wertvollstes Asset. Ich investiere sie in meine ultimative Vision.","Disziplin wiegt Unzen, Bedauern wiegt Tonnen. Ich waehle die Disziplin.","Ich fokussiere mich nur auf das, was ich kontrollieren kann. Der Rest ist Illusion.","Ich vergleiche mich nicht mit anderen, sondern nur damit, wer ich gestern war.","Motivation ist fluechtig. Wahre Macht liegt in der unerschuetterlichen Konsistenz.","Es gibt kein Limit. Mein Potenzial waechst mit jeder Herausforderung, die ich meistere.","Erfolg mietet man, und die Miete ist jeden Tag faellig. Ich gebe heute 100%.","Jede Ablenkung ist ein Feind meiner Zukunft. Mein Fokus ist absolute Prioritaet."],v={pomodoro:{label:"Pomodoro",color:"#ef4444",icon:P.timer},deepWork:{label:"Deep Work",color:"#8b5cf6",icon:A.blackheart},sprint:{label:"Sprint",color:"#06b6d4",icon:J.timer},sanctum:{label:"Sanctum",color:"#22c55e",icon:A.arise}};function G(i=7){return Array.from({length:i},(r,a)=>{const u=new Date;return u.setDate(u.getDate()-(i-1-a)),V(u)})}function L(i){var r,a,u,s,l,o,d,c,g;return{totalMinutes:((r=i==null?void 0:i.focus)==null?void 0:r.totalMinutes)||0,totalSessions:((a=i==null?void 0:i.focus)==null?void 0:a.totalSessions)||0,streak:((u=i==null?void 0:i.focus)==null?void 0:u.streak)||0,bestStreak:((s=i==null?void 0:i.focus)==null?void 0:s.bestStreak)||0,bestDayMinutes:((l=i==null?void 0:i.focus)==null?void 0:l.bestDayMinutes)||0,longestSessionMinutes:((o=i==null?void 0:i.focus)==null?void 0:o.longestSessionMinutes)||0,daily:((d=i==null?void 0:i.focus)==null?void 0:d.daily)||{},modes:((c=i==null?void 0:i.focus)==null?void 0:c.modes)||{},recentSessions:Array.isArray((g=i==null?void 0:i.focus)==null?void 0:g.recentSessions)?i.focus.recentSessions:[]}}function K(i){if(!i)return"";const r=new Date(i);return Number.isNaN(r.getTime())?"":r.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}function Z({state:i,persist:r,notify:a,theme:u}){var S,M,N;const s=u||{primary:"#22d3ee",secondary:"#8b5cf6",accent:"#67e8f9",glow:"rgba(124,58,237,0.35)"},l={level:1,willpower:0,totalMeditationMinutes:0,...i.sanctum||{}},o=L(i),d=i.manifestations||[],[c,g]=T.useState(""),y=T.useMemo(()=>G(7),[]),j=B(),p=((S=o.daily)==null?void 0:S[j])||{totalMinutes:0,sessions:0,xpEarned:0,modes:{}},O=((N=(M=p.modes)==null?void 0:M.sanctum)==null?void 0:N.minutes)||0,R=Math.max(45,...y.map(n=>{var t,m;return((m=(t=o.daily)==null?void 0:t[n])==null?void 0:m.totalMinutes)||0})),w=Math.max(1,l.level*10),D=Math.min(100,Math.round(l.willpower/w*100)),f=_.filter(n=>!d.some(t=>t.text===n)),E=Object.entries(v).map(([n,t])=>{var m,h,x,k,I,z;return{key:n,...t,totalMinutes:((h=(m=o.modes)==null?void 0:m[n])==null?void 0:h.totalMinutes)||0,sessions:((k=(x=o.modes)==null?void 0:x[n])==null?void 0:k.sessions)||0,todayMinutes:((z=(I=p.modes)==null?void 0:I[n])==null?void 0:z.minutes)||0}}),F=n=>{n.preventDefault();const t=c.trim();if(!t)return;const m={id:C(),text:t,createdAt:new Date().toISOString()};r({...i,manifestations:[m,...d]}),g(""),a==null||a("Vision ins Sanctum aufgenommen","success")},W=()=>{if((i.gold||0)<20){a==null||a("Nicht genug Gold. 20G benoetigt.","error");return}if(f.length===0)return;const n=f[Math.floor(Math.random()*f.length)],t={id:C(),text:n,createdAt:new Date().toISOString()};r({...i,gold:i.gold-20,manifestations:[t,...d]}),a==null||a("Einsicht des Monarchen erlangt. -20G","success")},$=n=>{r({...i,manifestations:d.filter(t=>t.id!==n)})};return e.jsxs("div",{className:"inner-sanctum-view",children:[e.jsx("style",{children:`
        .inner-sanctum-view {
          animation: fadeIn 0.35s ease;
          color: #f8fafc;
        }
        .sanctum-panel {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.14);
          background: linear-gradient(180deg, rgba(8,12,24,0.9), rgba(4,6,14,0.96));
          box-shadow: 0 18px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
        }
        .sanctum-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 78% 18%, rgba(139,92,246,0.22), transparent 34%),
            linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px);
          background-size: auto, 32px 32px, 32px 32px;
          pointer-events: none;
        }
        .sanctum-kicker {
          color: ${s.accent||"#67e8f9"};
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .sanctum-title {
          margin-top: 5px;
          color: #fff;
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          font-family: 'Cinzel', serif;
          text-shadow: 0 0 24px ${s.glow||"rgba(124,58,237,0.35)"};
        }
        .sanctum-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }
        .sanctum-stat {
          position: relative;
          min-width: 0;
          border-radius: 8px;
          padding: 11px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .sanctum-label {
          color: #64748b;
          font-size: 9px;
          letter-spacing: 1.4px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
        }
        .sanctum-value {
          margin-top: 6px;
          color: #f8fafc;
          font-size: 24px;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
        }
        .sanctum-note {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.32;
        }
        .sanctum-mode-row {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.026);
          border: 1px solid rgba(255,255,255,0.065);
        }
        .sanctum-bars {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          align-items: end;
          gap: 7px;
          height: 104px;
          margin-top: 14px;
        }
        .sanctum-bar {
          border-radius: 5px 5px 2px 2px;
          background: linear-gradient(180deg, ${s.primary||"#22d3ee"}, rgba(255,255,255,0.08));
          box-shadow: 0 0 18px ${s.glow||"rgba(34,211,238,0.3)"};
        }
        .sanctum-form {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto auto;
          gap: 8px;
          margin-top: 16px;
        }
        @media (max-width: 620px) {
          .sanctum-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sanctum-form { grid-template-columns: minmax(0,1fr) auto; }
          .sanctum-form button[type="button"] { grid-column: 2; }
          .sanctum-title { font-size: 24px; }
        }
      `}),e.jsxs("section",{className:"sanctum-panel",style:{padding:18,marginBottom:14},children:[e.jsxs("div",{style:{position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:14,alignItems:"start"},children:[e.jsxs("div",{style:{minWidth:0},children:[e.jsx("div",{className:"sanctum-kicker",children:"INNER SANCTUM"}),e.jsxs("div",{className:"sanctum-title",children:["Monarch Core Lv. ",l.level]}),e.jsx("div",{style:{color:"#94a3b8",fontSize:12,marginTop:7,lineHeight:1.4},children:"Willpower, Manifestationen und Focus-Verlauf"})]}),e.jsx(b,{src:U.bellion,fallback:"M",size:58,glow:!0,glowColor:s.glow,animate:"float"})]}),e.jsxs("div",{style:{position:"relative",zIndex:1,marginTop:17},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,alignItems:"center",marginBottom:8},children:[e.jsx("div",{className:"sanctum-label",children:"WILLPOWER MATRIX"}),e.jsxs("div",{style:{color:s.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:900},children:[l.willpower,"/",w]})]}),e.jsx("div",{style:{height:8,borderRadius:999,background:"rgba(255,255,255,0.07)",overflow:"hidden"},children:e.jsx("div",{style:{height:"100%",width:`${D}%`,borderRadius:999,background:`linear-gradient(90deg, ${s.secondary||"#8b5cf6"}, ${s.accent||"#67e8f9"})`,boxShadow:`0 0 18px ${s.glow||"rgba(124,58,237,0.35)"}`}})})]}),e.jsxs("div",{className:"sanctum-grid",style:{position:"relative",zIndex:1,marginTop:14},children:[e.jsxs("div",{className:"sanctum-stat",children:[e.jsx("div",{className:"sanctum-label",children:"FOCUS XP"}),e.jsxs("div",{className:"sanctum-value",children:["+",l.level,"%"]}),e.jsx("div",{className:"sanctum-note",children:"Sanctum Rang Bonus"})]}),e.jsxs("div",{className:"sanctum-stat",children:[e.jsx("div",{className:"sanctum-label",children:"MEDITATION"}),e.jsxs("div",{className:"sanctum-value",children:[l.totalMeditationMinutes,"m"]}),e.jsxs("div",{className:"sanctum-note",children:[O,"m heute"]})]}),e.jsxs("div",{className:"sanctum-stat",children:[e.jsx("div",{className:"sanctum-label",children:"FOCUS HEUTE"}),e.jsxs("div",{className:"sanctum-value",children:[p.totalMinutes||0,"m"]}),e.jsxs("div",{className:"sanctum-note",children:[p.sessions||0," Sessions / ",p.xpEarned||0," XP"]})]}),e.jsxs("div",{className:"sanctum-stat",children:[e.jsx("div",{className:"sanctum-label",children:"FOCUS-STREAK"}),e.jsxs("div",{className:"sanctum-value",children:[o.streak,"d"]}),e.jsxs("div",{className:"sanctum-note",children:["Best ",o.bestStreak,"d"]})]})]})]}),e.jsx("section",{className:"sanctum-panel",style:{padding:14,marginBottom:14},children:e.jsxs("div",{style:{position:"relative",zIndex:1},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sanctum-kicker",children:"FOCUS PROCESSING"}),e.jsx("div",{style:{color:"#f8fafc",fontSize:17,fontWeight:900,fontFamily:"'Outfit',sans-serif",marginTop:4},children:"Taegliche Minuten"})]}),e.jsx(b,{src:H.int,fallback:"I",size:30,glow:!0,glowColor:s.glow})]}),e.jsx("div",{className:"sanctum-bars",children:y.map(n=>{var h,x;const t=((x=(h=o.daily)==null?void 0:h[n])==null?void 0:x.totalMinutes)||0,m=Math.max(8,Math.round(t/R*98));return e.jsxs("div",{title:`${n}: ${t}m`,style:{minHeight:104,display:"flex",flexDirection:"column",justifyContent:"flex-end"},children:[e.jsx("div",{className:"sanctum-bar",style:{height:m}}),e.jsx("div",{style:{marginTop:6,textAlign:"center",color:n===j?s.accent:"#475569",fontSize:8,fontFamily:"'JetBrains Mono',monospace",fontWeight:900},children:n.slice(5).replace("-","/")})]},n)})}),e.jsx("div",{style:{display:"grid",gap:8,marginTop:14},children:E.map(n=>e.jsxs("div",{className:"sanctum-mode-row",children:[e.jsx("div",{style:{width:34,height:34,borderRadius:8,display:"grid",placeItems:"center",background:`${n.color}14`,border:`1px solid ${n.color}30`},children:e.jsx(b,{src:n.icon,fallback:n.label.slice(0,1),size:21,glow:n.totalMinutes>0,glowColor:`${n.color}88`})}),e.jsxs("div",{style:{minWidth:0},children:[e.jsx("div",{style:{color:"#f8fafc",fontSize:13,fontWeight:900,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:n.label}),e.jsxs("div",{style:{color:"#64748b",fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginTop:3},children:[n.sessions," Sessions / ",n.todayMinutes,"m heute"]})]}),e.jsxs("div",{style:{color:n.color,fontSize:13,fontWeight:900,fontFamily:"'JetBrains Mono',monospace"},children:[n.totalMinutes,"m"]})]},n.key))})]})}),e.jsx("section",{className:"sanctum-panel",style:{padding:14,marginBottom:14},children:e.jsxs("div",{style:{position:"relative",zIndex:1},children:[e.jsx("div",{className:"sanctum-kicker",children:"RECENT RUNES"}),e.jsx("div",{style:{display:"grid",gap:8,marginTop:10},children:o.recentSessions.length===0?e.jsx("div",{style:{padding:14,borderRadius:8,color:"#64748b",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",fontSize:12},children:"Noch keine Focus-Sessions verarbeitet."}):o.recentSessions.slice(0,4).map(n=>{const t=v[n.modeId]||v.pomodoro;return e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:8,alignItems:"center",padding:10,borderRadius:8,background:"rgba(255,255,255,0.026)",border:`1px solid ${t.color}22`},children:[e.jsxs("div",{style:{minWidth:0},children:[e.jsx("div",{style:{color:"#e2e8f0",fontSize:12,fontWeight:900,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:n.modeName}),e.jsxs("div",{style:{color:"#64748b",fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginTop:3},children:[n.date," / ",K(n.endedAt)]})]}),e.jsxs("div",{style:{color:t.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:900,fontSize:11},children:["+",n.minutes,"m"]})]},n.id)})})]})}),e.jsx("section",{className:"sanctum-panel",style:{padding:14},children:e.jsxs("div",{style:{position:"relative",zIndex:1},children:[e.jsx("div",{className:"sanctum-kicker",children:"MANIFESTATION BOARD"}),e.jsxs("form",{onSubmit:F,className:"sanctum-form",children:[e.jsx("input",{value:c,onChange:n=>g(n.target.value),placeholder:"Neue Manifestation oder Ziel...",style:{minWidth:0,background:"rgba(2,6,23,0.82)",border:`1px solid ${s.primary||"#22d3ee"}33`,color:"#fff",padding:"13px 14px",borderRadius:8,fontSize:13,outline:"none"}}),f.length>0&&e.jsx("button",{type:"button",onClick:W,title:"Premium Manifestation (20G)",disabled:(i.gold||0)<20,style:{width:48,height:45,borderRadius:8,background:(i.gold||0)>=20?"rgba(245,158,11,0.14)":"rgba(255,255,255,0.035)",border:`1px solid ${(i.gold||0)>=20?"rgba(245,158,11,0.35)":"rgba(255,255,255,0.06)"}`,color:(i.gold||0)>=20?"#f59e0b":"#475569",cursor:(i.gold||0)>=20?"pointer":"not-allowed",fontFamily:"'JetBrains Mono',monospace",fontWeight:900,fontSize:9},children:"20G"}),e.jsx("button",{type:"submit",disabled:!c.trim(),style:{width:48,height:45,borderRadius:8,background:c.trim()?`linear-gradient(135deg, ${s.secondary}, ${s.primary})`:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:c.trim()?"#fff":"#475569",fontWeight:900,cursor:c.trim()?"pointer":"not-allowed",fontSize:18},children:"+"})]}),e.jsx("div",{style:{display:"grid",gap:8,marginTop:12},children:d.length===0?e.jsx("div",{style:{textAlign:"center",padding:"28px 16px",color:"#64748b",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8},children:"Die Zukunft ist ungeschrieben."}):d.map(n=>e.jsxs("div",{style:{padding:"14px 40px 14px 14px",background:"rgba(255,255,255,0.026)",border:`1px solid ${s.secondary||"#8b5cf6"}24`,borderRadius:8,borderLeft:`3px solid ${s.secondary||"#8b5cf6"}`,position:"relative"},children:[e.jsxs("div",{style:{fontSize:15,color:"#e2e8f0",fontFamily:"'Cinzel',serif",lineHeight:1.4},children:['"',n.text,'"']}),e.jsx("button",{onClick:()=>$(n.id),style:{position:"absolute",top:10,right:10,width:26,height:26,borderRadius:8,background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.07)",color:"#64748b",fontSize:11,cursor:"pointer"},children:"X"})]},n.id))})]})})]})}export{Z as default};
