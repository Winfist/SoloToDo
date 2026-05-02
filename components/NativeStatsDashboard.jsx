import React, { useState, useEffect } from 'react';
import { healthService } from '../services/healthService';
import { locationService } from '../services/locationService';
import ScreenTimeUpload from './ScreenTimeUpload';

export default function NativeStatsDashboard({ state, persist }) {
  const [steps, setSteps] = useState(0);
  const [sleep, setSleep] = useState({ hours: 0, minutes: 0 });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // We intentionally do NOT call loadNativeData on mount anymore,
  // to prevent immediate permission popups or crashes on iOS.

  const loadNativeData = async () => {
    setLoading(true);
    try {
      // 1. Health Data
      const healthGranted = await healthService.requestPermissions();
      if (healthGranted) {
        const todaySteps = await healthService.getTodaySteps();
        const lastNightSleep = await healthService.getLastNightSleep();
        setSteps(todaySteps);
        setSleep(lastNightSleep);
      }

      // 2. Location Data
      const locationGranted = await locationService.requestPermissions();
      if (locationGranted) {
        const currentLoc = await locationService.getCurrentPosition();
        setLocation(currentLoc);
      }
    } catch (error) {
      console.error("Error loading native data:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncAndReward = async () => {
    await loadNativeData();
    if (steps > 1000 && state && persist) {
      const rewardStamina = Math.floor(steps / 1000);
      const currentStamina = state.stats?.vit || 10;
      
      alert(`Native Sync erfolgreich! Du hast heute ${steps} Schritte gemacht und ${rewardStamina} Ausdauer-Punkte regeneriert.`);
      // Hier würde idealerweise ein echter State-Update stattfinden
      // persist({ ...state, stats: { ...state.stats, vit: currentStamina + rewardStamina } });
    } else {
      alert("Sensordaten wurden aktualisiert.");
    }
  };

  const handleScreenTimeParsed = (minutes) => {
    // Hier können wir später XP/Rewards berechnen
    console.log("Bildschirmzeit erfasst:", minutes, "Minuten");
    if (minutes < 240 && state && persist) {
      alert("Bildschirmzeit-Ziel erreicht! +50 XP (Simuliert)");
    } else {
      alert(`Bildschirmzeit erfasst: ${minutes} Min. (Zu hoch für Belohnung)`);
    }
  };

  if (loading) {
    return <div style={{ color: '#00ffcc', padding: '1rem' }}>Lade Sensordaten...</div>;
  }

  return (
    <div style={{ padding: '1rem', background: '#0a0a0a', borderRadius: '12px', color: '#fff', border: '1px solid #333' }}>
      <h2 style={{ color: '#00ffcc', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: 0 }}>
        Vital-Werte (Native Sync)
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
        {/* Steps Card */}
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#888' }}>Schritte Heute</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ffcc' }}>
            {steps.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            Belohnung: {Math.floor(steps / 1000)} Ausdauerpunkte
          </div>
        </div>

        {/* Sleep Card */}
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#888' }}>Schlaf (Letzte Nacht)</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffb347' }}>
            {sleep.hours}h
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            Buff: +{(sleep.hours >= 7 ? 10 : 0)}% HP Regen
          </div>
        </div>
      </div>

      {/* Location Card */}
      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #444', marginTop: '10px' }}>
         <h4 style={{ margin: '0 0 5px 0', color: '#888' }}>Letzter Standort</h4>
         <div style={{ fontSize: '1rem', color: '#00ffcc' }}>
           {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Standort nicht verfügbar'}
         </div>
         <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            (Wird für Erkundungs-Quests genutzt)
         </div>
      </div>

      {/* Screen Time Upload */}
      <ScreenTimeUpload onTimeParsed={handleScreenTimeParsed} />
      
      <button 
        onClick={syncAndReward}
        style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Daten manuell synchronisieren & Belohnung abholen
      </button>
    </div>
  );
}
