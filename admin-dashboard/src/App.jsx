import React, { useState, useEffect } from 'react';
import { 
  Users, User, Shield, Key, Search, ArrowLeft,
  Settings, RefreshCw, Trash2, Edit3, Heart, 
  Coins, Star, Activity, AlertTriangle, Save, X,
  BookOpen, Briefcase, CheckSquare, Mail, Hexagon,
  Swords, Crosshair, Sparkles
} from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [activeView, setActiveView] = useState('list'); // list, detail
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchAllUsers();
      }
    });
    return unsubscribe;
  }, []);

  const fetchAllUsers = async () => {
    try {
      setFetchError('');
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (err) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setFetchError('Zugriff verweigert! Deine UID ist noch nicht in den firestore.rules eingetragen.');
      } else {
        setFetchError('Fehler beim Laden der User: ' + err.message);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Login fehlgeschlagen. ' + err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return <div className="auth-container"><div className="glass-panel">Lade...</div></div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card animate-fade-in">
          <Shield size={48} className="text-accent" style={{ margin: '0 auto 20px' }} />
          <h1>Admin Portal</h1>
          <p className="text-muted" style={{ marginBottom: '30px' }}>Solo ToDo Management</p>
          
          {error && <div className="alert-box"><p>{error}</p></div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Admin Email</label>
              <input 
                type="email" 
                className="input-glass"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <label>Passwort</label>
              <input 
                type="password" 
                className="input-glass"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="top-header">
        <div className="header-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield className="text-accent" />
            Solo ToDo <span className="text-muted" style={{ fontWeight: 400 }}>Admin</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Angemeldet als {user.email} <span style={{userSelect: 'all', background: '#000', padding: '2px 4px', borderRadius: '4px'}}>{user.uid}</span></p>
        </div>
        <button onClick={handleLogout} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Ausloggen
        </button>
      </header>

      {fetchError && (
        <div className="glass-panel alert-box animate-fade-in" style={{ marginBottom: '30px' }}>
          <h4><AlertTriangle /> Berechtigungsfehler</h4>
          <p>{fetchError}</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            Deine UID lautet: <strong style={{color: '#fff', userSelect: 'all'}}>{user.uid}</strong><br/><br/>
            Füge in firestore.rules folgendes ein:<br/>
            <span style={{color: '#8a2be2'}}>allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.uid == '{user.uid}');</span>
          </div>
          <button onClick={fetchAllUsers} className="btn-primary" style={{ marginTop: '16px' }}>Erneut versuchen</button>
        </div>
      )}

      {!fetchError && (
        <main>
          {activeView === 'list' && (
            <UserList 
              users={users} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onUserSelect={(u) => { setSelectedUser(u); setActiveView('detail'); }} 
              onRefresh={fetchAllUsers}
            />
          )}

          {activeView === 'detail' && selectedUser && (
            <UserDetail 
              user={selectedUser} 
              onBack={() => { setActiveView('list'); setSelectedUser(null); }} 
              onUpdate={fetchAllUsers}
            />
          )}
        </main>
      )}
    </div>
  );
}

function UserList({ users, searchQuery, setSearchQuery, onUserSelect, onRefresh }) {
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.hunterName && u.hunterName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
        <h2>Spieler Übersicht ({users.length})</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#a0a0b0' }} size={20} />
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Suche..."
              style={{ paddingLeft: '40px', width: '250px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={onRefresh} className="btn-icon" title="Aktualisieren">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.map(u => {
          const stats = u.stats || {};
          return (
            <div key={u.id} className="glass-panel user-card" onClick={() => onUserSelect(u)}>
              <div className="user-card-header">
                <div className="avatar-circle">
                  {(u.displayName || u.hunterName || u.name || u.email || u.id).charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.displayName || u.hunterName || u.name || 'Account nicht synchronisiert'} 
                    <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--accent)', color: 'white' }}>Lvl {u.level || 1}</span>
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>{u.email || u.id.slice(0, 10) + '...'}</p>
                </div>
              </div>
              
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-label">Gold</span>
                  <span className="stat-val text-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={16} /> {u.gold || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">XP</span>
                  <span className="stat-val text-accent" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={16} /> {u.xp || 0}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#a0a0b0' }}>
            Keine Spieler gefunden.
          </div>
        )}
      </div>
    </div>
  );
}

function UserDetail({ user, onBack, onUpdate }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const stats = user.stats || {str: 0, vit: 0, agi: 0, int: 0, cha: 0};
  
  const [editData, setEditData] = useState({ 
    gold: user.gold || 0, 
    level: user.level || 1, 
    statPoints: user.statPoints || 0,
    str: stats.str || 0,
    agi: stats.agi || 0,
    vit: stats.vit || 0,
    int: stats.int || 0,
    cha: stats.cha || 0
  });

  const handleReset = async (wipeQuests) => {
    try {
      const userRef = doc(db, 'users', user.id);
      let payload = {
        level: 1,
        gold: 0,
        xp: 0,
        totalXpEarned: 0,
        totalGoldEarned: 0,
        totalQuestsCompleted: 0,
        streak: 0,
        statPoints: 0,
        stats: {
          str: 0,
          agi: 0,
          vit: 0,
          int: 0,
          cha: 0
        },
        // Reset skills & achievements
        skills: { unlocked: [] },
        achievements: { unlocked: [], notified: [] },
        dungeonHistory: [],
        hiddenQuests: { discovered: [], completed: [] },
        penaltyZone: { active: false, redemptionLeft: 0, questsCompletedInPenalty: 0 },
        // Reset emergency quest
        emergencyQuest: null,
        emergencyDone: false,
        emergencyFailed: false,
        // Reset Gates/Dungeons
        dungeons: [],
        lastDungeonRefresh: null,
        todayModifier: null,
        // Reset Times & Daily Limits
        lastActiveDate: null,
        dailyUserQuestsCreated: 0,
        extraDailySlots: 0,
        weeklyQuestReset: null,
        lastSystemTaskTime: null,
        // Reset Job Cooldowns (Base level)
        "jobs.activeAbilityCooldowns": {},
      };

      if (wipeQuests) {
        payload.tutorialCompleted = false;
        payload.hunterName = ""; // Important to trigger SetupScreen
        payload.story = { completedChapters: [], completedArcs: [], totalStoryXp: 0 };
        payload.quests = [];
        payload.completedQuests = [];
        payload.equipment = { slots:{ weapon:null, armor:null, ring1:null, ring2:null }, inventory:[] };
        payload.shadowArmy = { shadows:[], capacity:20, formations:{ vanguard:[], core:[], rearguard:[] }, totalShadowXp:0 };
        payload.jobs = { current: null, levels: { berserker: 0, archmage: 0, guardian: 0, assassin: 0, monarch: 0, necromancer: 0 }, xp: {}, activeAbilityCooldowns: {} };
        payload.achievements = { unlocked: [], notified: [] };
        payload.dungeonHistory = [];
        payload.hiddenQuests = { discovered: [], completed: [] };
        payload.analytics = {};
        payload.multiplayer = { activeRaid: null, guild: null, social: null, publicStats: { totalXp: 0, dungeonsCleared: 0 } };
      }

      await updateDoc(userRef, payload);
      alert('Spieler erfolgreich zurückgesetzt!');
      setShowResetModal(false);
      onUpdate();
      onBack();
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        gold: Number(editData.gold),
        level: Number(editData.level),
        statPoints: Number(editData.statPoints),
        "stats.str": Number(editData.str),
        "stats.agi": Number(editData.agi),
        "stats.vit": Number(editData.vit),
        "stats.int": Number(editData.int),
        "stats.cha": Number(editData.cha)
      });
      setShowEditModal(false);
      onUpdate();
      onBack();
    } catch (e) {
      alert('Fehler beim Speichern: ' + e.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="detail-header">
        <button onClick={onBack} className="btn-icon"><ArrowLeft size={20} /></button>
        <div>
          <h2 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.displayName || user.hunterName || user.name || 'Account nicht synchronisiert'}
            <span className="badge-level" style={{ fontSize: '0.9rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--accent)', color: 'white' }}>Level {user.level || 1}</span>
            {user.title && <span style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.2)', color: '#ffd700', border: '1px solid rgba(255, 215, 0, 0.4)' }}>{user.title}</span>}
          </h2>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> ID: <span style={{ userSelect: 'all', color: '#fff' }}>{user.id}</span></span>
            {user.email ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {user.email}</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}><Mail size={14} /> Keine Email</span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel">
            <h3 className="section-title"><Activity className="text-accent" /> Hauptwerte</h3>
            <div className="attr-grid">
              <div className="attr-card">
                <span className="attr-icon-label"><Star size={18} /> Level</span>
                <span className="attr-val">{user.level || 1}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label"><Coins size={18} className="text-warning"/> Gold</span>
                <span className="attr-val">{user.gold || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label"><Activity size={18} className="text-accent"/> XP</span>
                <span className="attr-val" style={{ color: '#f8f8f8' }}>{user.xp || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label"><Heart size={18} className="text-danger"/> Streak</span>
                <span className="attr-val" style={{ color: '#f8f8f8' }}>{user.streak || 0} d</span>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><Shield className="text-accent" /> Attribute</h3>
            <div className="attr-grid">
              <div className="attr-card">
                <span className="attr-icon-label">Stärke (STR)</span>
                <span className="attr-val">{stats.str || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label">Agilität (AGI)</span>
                <span className="attr-val">{stats.agi || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label">Vitalität (VIT)</span>
                <span className="attr-val">{stats.vit || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label">Intelligenz (INT)</span>
                <span className="attr-val">{stats.int || 0}</span>
              </div>
              <div className="attr-card">
                <span className="attr-icon-label">Charisma (CHA)</span>
                <span className="attr-val">{stats.cha || 0}</span>
              </div>
              <div className="attr-card" style={{ borderColor: 'var(--accent)' }}>
                <span className="attr-icon-label text-accent">Freie Stat-Punkte</span>
                <span className="attr-val">{user.statPoints || 0}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><Briefcase className="text-warning" style={{ color: '#f59e0b' }}/> Equipment (Ausrüstung)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {["weapon", "armor", "ring1", "ring2"].map(slot => {
                const eq = user.equipment?.slots?.[slot];
                return (
                  <div key={slot} style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#a0a0b0', textTransform: 'uppercase', marginBottom: '4px' }}>{slot}</div>
                    {eq ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{eq.icon || '📦'}</span>
                        <span style={{ color: '#fff', fontSize: '0.9rem' }}>{eq.name}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Leer</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><Hexagon className="text-info" style={{ color: '#3b82f6' }}/> Job Klassen</h3>
            {user.jobs?.levels && Object.keys(user.jobs.levels).length > 0 ? (
              <div className="attr-grid">
                {Object.entries(user.jobs.levels).map(([job, lvl]) => (
                  <div key={job} className="attr-card" style={{ opacity: job === user.jobs.current ? 1 : 0.6, borderColor: job === user.jobs.current ? 'var(--info)' : 'rgba(255,255,255,0.05)' }}>
                    <span className="attr-icon-label" style={{ textTransform: 'capitalize' }}>
                      {job} {job === user.jobs.current && <span style={{ color: '#3b82f6', fontSize: '0.75rem' }}>(Aktiv)</span>}
                    </span>
                    <span className="attr-val">Lvl {lvl || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Keine Jobs vorhanden.</p>
            )}
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><Crosshair className="text-danger" style={{ color: '#ef4444' }}/> Shadow Army</h3>
            <div style={{ marginBottom: '12px' }}>
              <span className="badge" style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', fontSize: '0.85rem' }}>
                {user.shadowArmy?.shadows?.length || 0} / {user.shadowArmy?.capacity || 20} Shadows im Besitz
              </span>
            </div>
            
            {user.shadowArmy?.shadows && user.shadowArmy.shadows.length > 0 ? (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                 {user.shadowArmy.shadows.map(s => (
                   <div key={s.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', borderLeft: `3px solid ${s.glowColor || '#64748b'}`, fontSize: '0.85rem' }}>
                     <div style={{ fontWeight: 'bold', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                       <span>{s.class === 'named' ? '👑' : ''} {s.name || s.class}</span>
                       <span style={{ color: '#a0a0b0' }}>Lvl {s.level}</span>
                     </div>
                     <div style={{ color: '#64748b', marginTop: '4px', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                       {s.class} (Tier {s.tier}) {s.isDeployed && <span style={{ color: '#22c55e' }}>• Aufgestellt</span>}
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Keine Schatten erweckt.</p>
            )}
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><CheckSquare className="text-success" style={{ color: '#22c55e' }}/> Aktive Quests ({user.quests?.length || 0})</h3>
            {user.quests && user.quests.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {user.quests.map((q, i) => (
                   <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', borderLeft: `3px solid ${q.category === 'str' ? '#ef4444' : q.category === 'int' ? '#3b82f6' : q.category === 'vit' ? '#22c55e' : q.category === 'agi' ? '#f59e0b' : '#a855f7'}` }}>
                     <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{q.title}</div>
                     <div style={{ color: '#a0a0b0', fontSize: '0.85rem', marginTop: '2px' }}>{q.desc || "Keine Beschreibung"}</div>
                     <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>Diff: <span style={{ color: '#e2e8f0' }}>{q.difficulty}</span></span>
                        <span>Type: <span style={{ color: '#e2e8f0' }}>{q.type}</span></span>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Keine aktiven Quests.</p>
            )}
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><BookOpen className="text-info" /> Story Fortschritt</h3>
            {user.story?.completedChapters && user.story.completedChapters.length > 0 ? (
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.story.completedChapters.map(chap => (
                     <span key={chap} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                       {chap}
                     </span>
                  ))}
               </div>
            ) : (
               <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Keine Story-Kapitel abgeschlossen.</p>
            )}
          </div>

        </div>

        <div className="action-card">
          <div className="glass-panel">
            <h3 className="section-title"><Settings className="text-accent" /> Admin Aktionen</h3>
            
            <button onClick={() => setShowEditModal(true)} className="btn-primary" style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Edit3 size={18} /> Stats bearbeiten
            </button>

            <button onClick={() => setShowResetModal(true)} className="btn-danger" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={18} /> Spieler Reset
            </button>

            <div className="alert-box" style={{ marginTop: '30px' }}>
              <h4><AlertTriangle size={18} /> Warnung</h4>
              <p>Bearbeitungen werden direkt in die Live-Datenbank geschrieben und verändern das Spiel für den Nutzer sofort.</p>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Spieler zurücksetzen</h3>
              <button onClick={() => setShowResetModal(false)} className="btn-icon" style={{ border: 'none' }}><X size={20}/></button>
            </div>
            <p>Möchtest du wirklich die Stats dieses Spielers auf Level 1 zurücksetzen?</p>
            <div className="modal-footer">
              <button className="btn-danger" onClick={() => handleReset(false)}>Nur Stats Reset</button>
              <button className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 4px 15px var(--danger-glow)' }} onClick={() => handleReset(true)}>Hard Reset (+ Story Wipe)</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Stats bearbeiten</h3>
              <button onClick={() => setShowEditModal(false)} className="btn-icon" style={{ border: 'none' }}><X size={20}/></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Level</label>
                  <input 
                    type="number" 
                    className="input-glass" 
                    value={editData.level} 
                    onChange={e => setEditData({...editData, level: e.target.value})} 
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Gold</label>
                  <input 
                    type="number" 
                    className="input-glass" 
                    value={editData.gold} 
                    onChange={e => setEditData({...editData, gold: e.target.value})} 
                  />
                </div>
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Freie Stat Punkte</label>
                <input 
                  type="number" 
                  className="input-glass" 
                  value={editData.statPoints} 
                  onChange={e => setEditData({...editData, statPoints: e.target.value})} 
                />
              </div>

              <div style={{ marginTop: '10px', pt: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
              <h4 style={{ margin: '0', color: '#e2e8f0' }}>Attribute</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>STR</label>
                  <input type="number" className="input-glass" value={editData.str} onChange={e => setEditData({...editData, str: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>AGI</label>
                  <input type="number" className="input-glass" value={editData.agi} onChange={e => setEditData({...editData, agi: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>VIT</label>
                  <input type="number" className="input-glass" value={editData.vit} onChange={e => setEditData({...editData, vit: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>INT</label>
                  <input type="number" className="input-glass" value={editData.int} onChange={e => setEditData({...editData, int: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>CHA</label>
                  <input type="number" className="input-glass" value={editData.cha} onChange={e => setEditData({...editData, cha: e.target.value})} />
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn-danger" onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'transparent' }}>Abbrechen</button>
              <button className="btn-primary" onClick={handleSaveEdit}><Save size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
