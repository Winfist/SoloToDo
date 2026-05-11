import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Zap, BookOpen, Shield, Flame, Users, Swords, Clock, AlertTriangle, Heart, Target, List } from 'lucide-react';
import QuestCatalog from './QuestCatalog';

const CAT_COLORS = { str: '#ef4444', int: '#3b82f6', vit: '#22c55e', agi: '#f59e0b', cha: '#a855f7' };
const CAT_LABELS = { str: 'Strength', int: 'Intelligence', vit: 'Vitality', agi: 'Agility', cha: 'Charisma' };
const CAT_ICONS = { str: '⚔️', int: '📖', vit: '🛡️', agi: '⚡', cha: '👥' };
const DIFF_COLORS = { easy: '#6b7280', normal: '#22d3ee', hard: '#a78bfa', boss: '#ef4444' };

export default function QuestOverview({ users = [] }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});
  const [subTab, setSubTab] = useState('pool');

  const toggle = (id) => setExpandedCards(p => ({ ...p, [id]: !p[id] }));

  // All active quests across all users from Firestore
  const liveQuests = useMemo(() => {
    const result = [];
    users.forEach(u => {
      (u.quests || []).forEach(q => {
        result.push({ ...q, _userName: u.displayName || u.hunterName || u.name || u.id?.slice(0, 8), _userLevel: u.level || 1, _userId: u.id });
      });
    });
    return result;
  }, [users]);

  // Categorize live quests by source
  const questsBySource = useMemo(() => {
    const sources = { system_daily: [], user_created: [], emergency: [], redemption: [], seasonal: [], charisma: [], chained: [], hidden: [] };
    liveQuests.forEach(q => {
      if (q.isRedemption) sources.redemption.push(q);
      else if (q.isSeasonal) sources.seasonal.push(q);
      else if (q.isCharismaQuest) sources.charisma.push(q);
      else if (q.type === 'chained') sources.chained.push(q);
      else if (q.type === 'hidden') sources.hidden.push(q);
      else if (q.type === 'emergency') sources.emergency.push(q);
      else if (q.isSystem) sources.system_daily.push(q);
      else sources.user_created.push(q);
    });
    return sources;
  }, [liveQuests]);

  // Stats
  const stats = useMemo(() => {
    const cats = { str: 0, int: 0, vit: 0, agi: 0, cha: 0 };
    const diffs = { easy: 0, normal: 0, hard: 0, boss: 0 };
    let sysCount = 0, userCount = 0;
    liveQuests.forEach(q => {
      if (q.category && cats[q.category] !== undefined) cats[q.category]++;
      if (q.difficulty && diffs[q.difficulty] !== undefined) diffs[q.difficulty]++;
      if (q.isSystem) sysCount++; else userCount++;
    });
    return { total: liveQuests.length, cats, diffs, sysCount, userCount, usersWithQuests: users.filter(u => u.quests?.length > 0).length };
  }, [liveQuests, users]);

  // Filtered live quests
  const filtered = useMemo(() => {
    let list = liveQuests;
    if (catFilter !== 'all') list = list.filter(q => q.category === catFilter);
    if (diffFilter !== 'all') list = list.filter(q => q.difficulty === diffFilter);
    if (sourceFilter === 'system') list = list.filter(q => q.isSystem);
    else if (sourceFilter === 'user') list = list.filter(q => !q.isSystem);
    else if (sourceFilter === 'redemption') list = list.filter(q => q.isRedemption);
    else if (sourceFilter === 'seasonal') list = list.filter(q => q.isSeasonal);
    else if (sourceFilter === 'charisma') list = list.filter(q => q.isCharismaQuest);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q => q.title?.toLowerCase().includes(s) || q.desc?.toLowerCase().includes(s) || q._userName?.toLowerCase().includes(s));
    }
    return list;
  }, [liveQuests, catFilter, diffFilter, sourceFilter, search]);

  // Group filtered by user
  const byUser = useMemo(() => {
    const map = {};
    filtered.forEach(q => {
      if (!map[q._userId]) map[q._userId] = { name: q._userName, level: q._userLevel, quests: [] };
      map[q._userId].quests.push(q);
    });
    return Object.entries(map).sort((a, b) => b[1].quests.length - a[1].quests.length);
  }, [filtered]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Quest-Übersicht</h2>
        <div className="nav-tabs" style={{ fontSize: '0.85rem' }}>
          <button className={`nav-tab ${subTab === 'pool' ? 'active' : ''}`} onClick={() => setSubTab('pool')}>
            <Target size={16} /> Live Quests
          </button>
          <button className={`nav-tab ${subTab === 'sources' ? 'active' : ''}`} onClick={() => setSubTab('sources')}>
            <BookOpen size={16} /> Nach Quelle
          </button>
          <button className={`nav-tab ${subTab === 'catalog' ? 'active' : ''}`} onClick={() => setSubTab('catalog')}>
            <List size={16} /> Quest Katalog
          </button>
        </div>
      </div>

      {subTab === 'catalog' ? (
        <QuestCatalog />
      ) : (
        <>
          {/* Stats */}
      <div className="quest-stats-grid">
        <div className="quest-stat-card">
          <span className="stat-number" style={{ color: 'var(--accent)' }}>{stats.total}</span>
          <span className="stat-desc">Aktive Quests</span>
        </div>
        <div className="quest-stat-card">
          <span className="stat-number" style={{ color: '#22c55e' }}>{stats.sysCount}</span>
          <span className="stat-desc">System-Quests</span>
        </div>
        <div className="quest-stat-card">
          <span className="stat-number" style={{ color: '#f59e0b' }}>{stats.userCount}</span>
          <span className="stat-desc">User-Quests</span>
        </div>
        <div className="quest-stat-card">
          <span className="stat-number" style={{ color: '#3b82f6' }}>{stats.usersWithQuests}</span>
          <span className="stat-desc">User mit Quests</span>
        </div>
        {Object.entries(stats.cats).map(([cat, count]) => (
          <div className="quest-stat-card" key={cat}>
            <span className="stat-number" style={{ color: CAT_COLORS[cat] }}>{count}</span>
            <span className="stat-desc">{CAT_ICONS[cat]} {cat.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 12, top: 11, color: '#a0a0b0' }} size={18} />
          <input type="text" placeholder="Quest oder User suchen..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38, width: '100%' }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">Alle Kategorien</option>
          {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{CAT_ICONS[k]} {v}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="all">Alle Schwierigkeiten</option>
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="boss">Boss</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="all">Alle Quellen</option>
          <option value="system">System-Quests</option>
          <option value="user">User-Quests</option>
          <option value="redemption">Redemption</option>
          <option value="seasonal">Seasonal</option>
          <option value="charisma">Charisma-Dungeon</option>
        </select>
      </div>

      {subTab === 'pool' && (
        <>
          <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
            {filtered.length} Quest{filtered.length !== 1 ? 's' : ''} gefunden — über {byUser.length} User verteilt
          </p>
          {byUser.length === 0 && <div className="no-results-box">Keine Quests gefunden.</div>}
          <div className="live-quest-grid">
            {byUser.map(([uid, data]) => (
              <div key={uid} className="live-user-card glass-panel" style={{ padding: 16 }}>
                <div className="live-user-header">
                  <div className="avatar-circle" style={{ width: 36, height: 36, fontSize: '1rem' }}>
                    {data.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="live-user-name">{data.name}</span>
                    <span className="live-user-level" style={{ marginLeft: 8 }}>Lvl {data.level}</span>
                  </div>
                  <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>{data.quests.length} Quests</span>
                </div>
                {data.quests.map((q, i) => (
                  <div key={i} className="live-quest-item" style={{ borderLeftColor: CAT_COLORS[q.category] || '#64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                        {CAT_ICONS[q.category] || '📋'} {q.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                      <span className="quest-meta-tag">{q.type || 'side'}</span>
                      {q.isSystem && <span className="quest-meta-tag" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>System</span>}
                      {q.isRedemption && <span className="quest-meta-tag" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Redemption</span>}
                      {q.isSeasonal && <span className="quest-meta-tag" style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }}>Seasonal</span>}
                      {q.isCharismaQuest && <span className="quest-meta-tag" style={{ color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)' }}>Charisma</span>}
                      {q.isScreenTime && <span className="quest-meta-tag" style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}>Screen-Time</span>}
                    </div>
                    {q.desc && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{q.desc}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'sources' && (
        <>
          {[
            { key: 'system_daily', label: 'System Daily Quests', icon: <Zap size={18} />, color: '#22c55e', desc: 'Automatisch generierte Tages-Quests (Defizit, Screen-Time, Random)' },
            { key: 'user_created', label: 'User-erstellte Quests', icon: <Users size={18} />, color: '#3b82f6', desc: 'Vom Spieler manuell erstellte Quests' },
            { key: 'redemption', label: 'Redemption Quests', icon: <AlertTriangle size={18} />, color: '#ef4444', desc: 'Shadow Regression – erscheinen bei Streak-Verlust' },
            { key: 'seasonal', label: 'Seasonal Quests', icon: <Flame size={18} />, color: '#f97316', desc: 'Saisonale Quests (ab Level 20)' },
            { key: 'charisma', label: 'Charisma-Dungeon', icon: <Heart size={18} />, color: '#a855f7', desc: 'Kettenquests aus Charisma-Dungeons' },
            { key: 'chained', label: 'Chained Quests', icon: <Swords size={18} />, color: '#f59e0b', desc: 'Verkettete Multi-Step Quests' },
            { key: 'hidden', label: 'Hidden Quests', icon: <Shield size={18} />, color: '#6366f1', desc: 'Verborgene Quests (entdeckt durch Trigger)' },
            { key: 'emergency', label: 'Emergency Quests', icon: <AlertTriangle size={18} />, color: '#dc2626', desc: 'Tägliche Notfall-Quests (ab Level 3)' },
          ].map(src => {
            const quests = questsBySource[src.key] || [];
            if (quests.length === 0) return null;
            return (
              <div key={src.key} className="quest-source-section">
                <div className="quest-source-header">
                  <span style={{ color: src.color }}>{src.icon}</span>
                  <h3>{src.label}</h3>
                  <span className="quest-source-badge" style={{ background: `${src.color}22`, color: src.color, border: `1px solid ${src.color}44` }}>
                    {quests.length} aktiv
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: 8 }}>{src.desc}</span>
                </div>
                <div className="quest-cards-grid">
                  {quests.map((q, i) => (
                    <div key={i} className={`quest-card cat-${q.category || 'str'}`} onClick={() => toggle(`${src.key}_${i}`)}>
                      <div className="quest-card-title">
                        {CAT_ICONS[q.category] || '📋'} {q.title}
                      </div>
                      {q.desc && <div className="quest-card-desc">{q.desc}</div>}
                      <div className="quest-card-meta">
                        <span className={`quest-meta-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                        <span className="quest-meta-tag">{q.type}</span>
                        <span className="quest-meta-tag">👤 {q._userName}</span>
                        <span className="quest-meta-tag">Lvl {q._userLevel}</span>
                        {q.xpMult && q.xpMult !== 1 && <span className="quest-meta-tag" style={{ color: '#fbbf24' }}>×{q.xpMult} XP</span>}
                      </div>
                      {expandedCards[`${src.key}_${i}`] && q.subQuests?.length > 0 && (
                        <div className="quest-subquests">
                          {q.subQuests.map((sq, si) => (
                            <div key={si} className="quest-subquest-item">{sq.title}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(questsBySource).every(arr => arr.length === 0) && (
            <div className="no-results-box">Keine aktiven Quests bei Usern gefunden.</div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}
