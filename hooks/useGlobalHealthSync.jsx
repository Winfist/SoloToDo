import { useEffect, useCallback, useRef } from 'react';
import { healthService } from '../services/healthService';
import { Capacitor } from '@capacitor/core';

const isNativeSafe = () => {
    try {
        return Capacitor.isNativePlatform();
    } catch {
        return false;
    }
};

function getHistorySignature(stepsData = [], sleepData = []) {
    const stepSig = (stepsData || []).map(row => `${row.date}:${Math.max(0, Math.floor(Number(row.value) || 0))}`).join(',');
    const sleepSig = (sleepData || []).map(row => `${row.date}:${Math.max(0, Number((row.hours ?? row.value) || 0)).toFixed(1)}`).join(',');
    return `${stepSig}|${sleepSig}`;
}

export function useGlobalHealthSync(state, updateHealthData, claimHealthReward) {
    const lastPersistKey = useRef('');

    const fetchHealthQuietly = useCallback(async () => {
        if (!isNativeSafe()) return;
        try {
            const silentLog = () => { };
            
            const sleepMode = state?.healthPreferences?.sleepMode || 'auto';
            const manualSleepToday = state?.healthPreferences?.manualSleepToday || 0;
            
            let fetchedSteps = 0;
            let fetchedSleepHours = 0;
            let stepsHistory = [];
            let sleepHistory = [];

            try {
                const s = await healthService.getTodaySteps(silentLog);
                fetchedSteps = Math.max(0, Math.floor(Number(s) || 0));
            } catch (e) { }

            try {
                const sl = await healthService.getLastNightSleep(silentLog);
                fetchedSleepHours = Math.max(0, Number(sl?.hours) || 0);
            } catch (e) { }

            try {
                stepsHistory = await healthService.getStepsHistory(7, silentLog);
                sleepHistory = await healthService.getSleepHistory(7, silentLog);
            } catch (e) { }

            const sleepForPersist = sleepMode === 'manual' ? manualSleepToday : fetchedSleepHours;
            const persistKey = `${fetchedSteps}:${sleepForPersist}:${getHistorySignature(stepsHistory, sleepHistory)}`;
            
            if (
                updateHealthData &&
                (fetchedSteps > 0 || sleepForPersist > 0 || stepsHistory?.length || sleepHistory?.length) &&
                lastPersistKey.current !== persistKey
            ) {
                lastPersistKey.current = persistKey;
                updateHealthData(fetchedSteps, sleepMode === 'off' ? 0 : sleepForPersist, {
                    stepsHistory,
                    sleepHistory: sleepMode === 'off' ? [] : sleepHistory
                });
            }

            // Also auto-claim rewards if reached
            if (claimHealthReward) {
                if (fetchedSteps >= 5000 && !state?.healthRewardsClaimed?.steps_5000) {
                    claimHealthReward("steps_5000", 15, 50, "5.000 Schritte", "Schritt-Meilenstein");
                }
                if (fetchedSteps >= 10000 && !state?.healthRewardsClaimed?.steps_10000) {
                    claimHealthReward("steps_10000", 30, 100, "10.000 Schritte", "Schritt-Meilenstein");
                }
                if (sleepMode !== 'off' && sleepForPersist >= 7 && !state?.healthRewardsClaimed?.sleep_7h) {
                    claimHealthReward("sleep_7h", 20, 60, "7+ Stunden Schlaf", "Erholungs-Bonus");
                }
            }

        } catch (err) {
            console.warn("[GlobalHealthSync] Quiet fetch failed:", err);
        }
    }, [state?.healthPreferences?.sleepMode, state?.healthPreferences?.manualSleepToday, state?.healthRewardsClaimed, updateHealthData, claimHealthReward]);

    useEffect(() => {
        if (!isNativeSafe()) return;
        
        const timeoutId = setTimeout(() => fetchHealthQuietly(), 1500);

        const intervalId = setInterval(() => {
            fetchHealthQuietly();
        }, 30000);

        const onFocus = () => fetchHealthQuietly();
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') onFocus();
        };
        
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [fetchHealthQuietly]);
}
