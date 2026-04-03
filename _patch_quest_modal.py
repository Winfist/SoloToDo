import re

with open(r'c:\Users\jwuck\OneDrive\Dokumente\SoloToDo\solo-leveling-v5.jsx', 'rb') as f:
    content = f.read()

START_MARKER  = b'      {/* QUEST CREATE MODAL */}\r\n      {showCreate&&('
END_MARKER    = b'      )}\r\n    </div>\r\n  );\r\n}'

start_idx = content.find(START_MARKER)
if start_idx == -1:
    print("START MARKER NOT FOUND"); exit(1)
print(f"Found start at byte {start_idx}")

end_idx = content.find(END_MARKER, start_idx)
if end_idx == -1:
    print("END MARKER NOT FOUND"); exit(1)
print(f"Found end at byte {end_idx}")

old_block = content[start_idx:end_idx]
print(f"Replacing block of {len(old_block)} bytes")

NEW_BLOCK = b"""      {/* QUEST CREATE MODAL */}\r
      {showCreate&&(\r
        <div onClick={()=>setShowCreate(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(2,2,10,0.9)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",padding:"16px 12px"}}>\r
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,maxHeight:"92vh",background:`linear-gradient(180deg,${theme.card},rgba(6,6,16,0.99))`,border:`1px solid ${theme.primary}44`,borderTop:`2px solid ${theme.primary}`,borderRadius:24,display:"flex",flexDirection:"column",animation:"slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",boxShadow:`0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px ${theme.glow}`}}>\r
            {/* Header */}\r
            <div style={{padding:"20px 24px 16px",flexShrink:0}}>\r
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>\r
                <div>\r
                  <div style={{fontSize:10,letterSpacing:4,color:theme.primary,fontFamily:"'JetBrains Mono',monospace",marginBottom:4,textShadow:`0 0 12px ${theme.glow}`}}>SYSTEM: NEUE QUEST</div>\r
                  <div style={{fontSize:18,fontWeight:900,color:"#fff",fontFamily:"'Cinzel',serif",letterSpacing:2}}>Quest erstellen</div>\r
                </div>\r
                <button onClick={()=>setShowCreate(false)} style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#64748b",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",cursor:"pointer"}}\r
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.15)";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#ef444444";}}\r
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#64748b";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}>&#x2715;</button>\r
              </div>\r
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${theme.primary}55,transparent)`}}/>\r
            </div>\r
\r
            {/* Scrollable Content */}\r
            <div style={{overflowY:"auto",padding:"0 24px",flex:1}}>\r
\r
              {/* Quest Title */}\r
              <div style={{marginTop:16,marginBottom:18}}>\r
                <label style={{fontSize:10,color:"#64748b",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:8}}>QUEST TITEL</label>\r
                <input value={qTitle} onChange={e=>setQTitle(e.target.value)} placeholder="Quest-Titel eingeben..." autoFocus\r
                  style={{width:"100%",padding:"14px 18px",borderRadius:14,fontSize:15,background:"rgba(4,4,12,0.9)",border:`1px solid ${theme.primary}44`,color:"#fff",outline:"none",fontFamily:"'Outfit',sans-serif",letterSpacing:0.5,transition:"all 0.3s",boxShadow:`inset 0 2px 10px rgba(0,0,0,0.5)`,boxSizing:"border-box"}}\r
                  onFocus={e=>{e.target.style.borderColor=theme.primary;e.target.style.boxShadow=`inset 0 2px 10px rgba(0,0,0,0.5), 0 0 20px ${theme.glow}, 0 0 0 1px ${theme.primary}`;e.target.style.outline="none";}}\r
                  onBlur={e=>{e.target.style.borderColor=`${theme.primary}44`;e.target.style.boxShadow=`inset 0 2px 10px rgba(0,0,0,0.5)`;e.target.style.outline="none";}}\r
                  onKeyDown={e=>e.key==="Enter"&&qTitle.trim()&&createQuest()}/>\r
              </div>\r
\r
              {/* Quest Type */}\r
              <div style={{marginBottom:18}}>\r
                <label style={{fontSize:10,color:"#64748b",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:10}}>QUEST TYP</label>\r
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>\r
                  {[\r
                    {key:"side",   icon:"\xf0\x9f\x93\x8b",label:"Side Quest",   color:"#a78bfa",desc:"Kein Zeitlimit"},\r
                    {key:"daily",  icon:"\xf0\x9f\x93\x85",label:"Daily Quest",  color:"#22d3ee",desc:"T\xc3\xa4glich zur\xc3\xbcckgesetzt"},\r
                    {key:"weekly", icon:"\xf0\x9f\x93\x86",label:"Weekly Quest", color:"#8b5cf6",desc:"2\xc3\x97 XP & Gold"},\r
                    {key:"chained",icon:"\xe2\x9b\x93\xef\xb8\x8f",label:"Chained Quest",color:"#f59e0b",desc:"3 Schritte \xc2\xb7 +25% je"},\r
                  ].map(t=>{\r
                    const active=qType===t.key;\r
                    return(\r
                      <button key={t.key} onClick={()=>setQType(t.key)} style={{\r
                        padding:"11px 12px",borderRadius:14,fontSize:12,fontWeight:700,\r
                        background:active?`linear-gradient(135deg,${t.color}22,${t.color}0d)`:"rgba(12,12,26,0.6)",\r
                        color:active?t.color:"#475569",\r
                        border:`1px solid ${active?t.color+"55":"#1e2940"}`,\r
                        transition:"all 0.25s",fontFamily:"'Outfit',sans-serif",\r
                        display:"flex",flexDirection:"column",alignItems:"flex-start",gap:3,\r
                        boxShadow:active?`0 4px 16px ${t.color}22, inset 0 1px 0 rgba(255,255,255,0.05)`:"none",\r
                        cursor:"pointer",textAlign:"left"\r
                      }}\r
                      onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=t.color+"33";e.currentTarget.style.color=t.color+"cc";}}}\r
                      onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="#1e2940";e.currentTarget.style.color="#475569";}}}\r
                      >\r
                        <span style={{fontSize:13}}>{t.icon} {t.label}</span>\r
                        <span style={{fontSize:9,opacity:active?0.8:0.45,fontWeight:400,fontFamily:"'JetBrains Mono',monospace"}}>{t.desc}</span>\r
                      </button>\r
                    );\r
                  })}\r
                </div>\r
              </div>\r
\r
              {/* Difficulty */}\r
              <div style={{marginBottom:18}}>\r
                <label style={{fontSize:10,color:"#64748b",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:10}}>SCHWIERIGKEIT</label>\r
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>\r
                  {DIFFICULTIES.map(d=>{\r
                    const active=qDiff===d.key;\r
                    const typeCfg=QUEST_TYPES_CONFIG[qType]||QUEST_TYPES_CONFIG.side;\r
                    const xpVal=Math.round(d.xp*(typeCfg.xpMult||1));\r
                    return(\r
                      <button key={d.key} onClick={()=>setQDiff(d.key)} style={{\r
                        padding:"12px 4px",borderRadius:14,fontSize:13,\r
                        background:active?`linear-gradient(135deg,${d.color}22,${d.color}0d)`:"rgba(12,12,26,0.6)",\r
                        color:active?d.color:"#475569",\r
                        border:`1px solid ${active?d.color+"55":"#1e2940"}`,\r
                        transition:"all 0.25s",display:"flex",flexDirection:"column",alignItems:"center",gap:3,\r
                        boxShadow:active?`0 4px 12px ${d.color}33, inset 0 1px 0 rgba(255,255,255,0.05)`:"none",\r
                        cursor:"pointer"\r
                      }}\r
                      onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=d.color+"44";e.currentTarget.style.color=d.color+"cc";}}}\r
                      onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="#1e2940";e.currentTarget.style.color="#475569";}}}\r
                      >\r
                        <span style={{fontSize:18,lineHeight:1}}>{d.icon}</span>\r
                        <span style={{fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5}}>{d.label.toUpperCase()}</span>\r
                        <span style={{fontSize:9,opacity:0.75,fontFamily:"'JetBrains Mono',monospace"}}>+{xpVal} XP</span>\r
                        <span style={{fontSize:8,opacity:0.5,fontFamily:"'JetBrains Mono',monospace"}}>{d.waitHours}h Timer</span>\r
                      </button>\r
                    );\r
                  })}\r
                </div>\r
              </div>\r
\r
              {/* Category */}\r
              <div style={{marginBottom:18}}>\r
                <label style={{fontSize:10,color:"#64748b",letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",display:"block",marginBottom:10}}>STATS KATEGORIE</label>\r
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>\r
                  {CATEGORIES.map(c=>{\r
                    const active=qCat===c.key;\r
                    return(\r
                      <button key={c.key} onClick={()=>setQCat(c.key)} style={{\r
                        padding:"11px 6px",borderRadius:14,fontSize:12,\r
                        background:active?`linear-gradient(135deg,${c.color}22,${c.color}0d)`:"rgba(12,12,26,0.6)",\r
                        color:active?c.color:"#475569",\r
                        border:`1px solid ${active?c.color+"55":"#1e2940"}`,\r
                        transition:"all 0.25s",display:"flex",flexDirection:"column",alignItems:"center",gap:4,\r
                        boxShadow:active?`0 4px 12px ${c.color}33, inset 0 1px 0 rgba(255,255,255,0.05)`:"none",\r
                        cursor:"pointer"\r
                      }}\r
                      onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=c.color+"44";e.currentTarget.style.color=c.color+"cc";}}}\r
                      onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="#1e2940";e.currentTarget.style.color="#475569";}}}\r
                      >\r
                        <span style={{fontSize:18,lineHeight:1}}>{c.icon}</span>\r
                        <span style={{fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5}}>{c.stat}</span>\r
                        <span style={{fontSize:9,opacity:active?0.8:0.4,fontFamily:"'Outfit',sans-serif",textAlign:"center",lineHeight:1.2}}>{c.label}</span>\r
                      </button>\r
                    );\r
                  })}\r
                </div>\r
              </div>\r
\r
              {/* Reward Preview - always shown */}\r
              {(()=>{\r
                const typeCfg=QUEST_TYPES_CONFIG[qType]||QUEST_TYPES_CONFIG.side;\r
                const diff=DIFFICULTIES.find(d=>d.key===qDiff);\r
                const cat=CATEGORIES.find(c=>c.key===qCat);\r
                const baseXp=Math.round(diff.xp*(typeCfg.xpMult||1));\r
                const baseGold=Math.round(diff.gold*(typeCfg.goldMult||1));\r
                return(\r
                  <div style={{background:"rgba(8,8,20,0.95)",borderRadius:16,padding:"14px 16px",marginBottom:16,border:`1px solid ${theme.primary}1a`,borderLeft:`3px solid ${diff.color}`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.03)`}}>\r
                    <div style={{fontSize:9,letterSpacing:3,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>VORSCHAU BELOHNUNG</div>\r
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",gap:0,alignItems:"center"}}>\r
                      <div style={{textAlign:"center"}}>\r
                        <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>SCHWIERIG</div>\r
                        <div style={{fontSize:12,color:diff.color,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{diff.icon} {diff.label}</div>\r
                      </div>\r
                      <div style={{width:1,height:28,background:"#1e2940",margin:"0 8px"}}/>\r
                      <div style={{textAlign:"center"}}>\r
                        <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>BELOHNUNG</div>\r
                        <div style={{fontSize:12,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",display:"flex",gap:6,justifyContent:"center"}}>\r
                          <span style={{color:"#67e8f9"}}>+{baseXp} XP</span>\r
                          <span style={{color:"#fbbf24"}}>+{baseGold}G</span>\r
                        </div>\r
                      </div>\r
                      <div style={{width:1,height:28,background:"#1e2940",margin:"0 8px"}}/>\r
                      <div style={{textAlign:"center"}}>\r
                        <div style={{fontSize:9,color:"#334155",fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>KATEGORIE</div>\r
                        <div style={{fontSize:12,color:cat.color,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{cat.icon} {cat.stat}</div>\r
                      </div>\r
                    </div>\r
                    {qDiff==="boss"&&<div style={{marginTop:10,padding:"5px 10px",background:"rgba(239,68,68,0.08)",borderRadius:8,border:"1px solid #ef444433",fontSize:10,color:"#ef4444",fontFamily:"'JetBrains Mono',monospace",textAlign:"center",animation:"pulse 2s infinite"}}>\xe2\x9a\xa0 \xf0\x9f\x8c\x91 SCHATTEN BESCHW\xc3\x96RUNGSCHANCE</div>}\r
                    {qType==="chained"&&<div style={{marginTop:6,padding:"5px 10px",background:"rgba(245,158,11,0.06)",borderRadius:8,border:"1px solid #f59e0b22",fontSize:10,color:"#f59e0b",fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}>\xe2\x9b\x93\xef\xb8\x8f 3-Schritte Kette \xc2\xb7 +25% XP pro Schritt</div>}\r
                  </div>\r
                );\r
              })()}\r
\r
            </div>\r
\r
            {/* Footer */}\r
            <div style={{padding:"14px 24px 20px",flexShrink:0,borderTop:`1px solid ${theme.primary}1a`}}>\r
              <button onClick={()=>{\r
                if(qType==="chained") addChainedQuest(qTitle,qCat,qDiff);\r
                else createQuest();\r
                setQTitle(""); setShowCreate(false);\r
              }} disabled={!qTitle.trim()} style={{width:"100%",padding:"15px",borderRadius:16,fontSize:14,fontWeight:900,background:qTitle.trim()?`linear-gradient(135deg,${theme.primary},${theme.secondary})`:"rgba(15,15,30,0.6)",color:qTitle.trim()?"#fff":"#334155",letterSpacing:3,fontFamily:"'Cinzel',serif",boxShadow:qTitle.trim()?`0 8px 32px ${theme.glow}, inset 0 2px 0 rgba(255,255,255,0.2)`:"none",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",cursor:qTitle.trim()?"pointer":"not-allowed",border:qTitle.trim()?"none":"1px solid #1e2940"}}\r
              onMouseEnter={e=>{if(qTitle.trim()){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.filter="brightness(1.1)";}}}\r
              onMouseLeave={e=>{if(qTitle.trim()){e.currentTarget.style.transform="none";e.currentTarget.style.filter="none";}}}\r
              >{qTitle.trim()?"\\u2746 QUEST ANNEHMEN \\u2746":"Quest-Titel eingeben..."}</button>\r
            </div>\r
\r
          </div>\r
        </div>\r
      )}"""

new_content = content[:start_idx] + NEW_BLOCK + b'\r\n' + content[end_idx:]

with open(r'c:\Users\jwuck\OneDrive\Dokumente\SoloToDo\solo-leveling-v5.jsx', 'wb') as f:
    f.write(new_content)

print("SUCCESS!")
print(f"New file size: {len(new_content)} bytes")
