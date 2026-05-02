import { Health } from '@capgo/capacitor-health';

export const healthService = {
  /**
   * Request permissions for Step Count and Sleep Analysis
   */
  async requestPermissions() {
    try {
      await Health.requestAuthorization([
        {
          read: ['steps', 'sleepAnalysis'],
        }
      ]);
      return true;
    } catch (error) {
      console.error("Error requesting health permissions:", error);
      return false;
    }
  },

  /**
   * Get steps for today
   */
  async getTodaySteps() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const result = await Health.query({
        sampleType: 'steps',
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      });

      // Sum up the steps
      let totalSteps = 0;
      if (result && result.resultData) {
         result.resultData.forEach(entry => {
             totalSteps += entry.value;
         });
      }
      return totalSteps;
    } catch (error) {
      console.error("Error fetching steps:", error);
      return 0;
    }
  },

  /**
   * Get sleep data for the previous night
   */
  async getLastNightSleep() {
    try {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(18, 0, 0, 0); // Check from 6 PM yesterday

      const result = await Health.query({
        sampleType: 'sleepAnalysis',
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
      });
      
      // Basic sleep calculation (could be enhanced based on phases)
      let totalSleepMinutes = 0;
      if (result && result.resultData) {
         result.resultData.forEach(entry => {
             // Apple Health often returns inBed and asleep phases
             if (entry.value === 'asleep') {
                 const start = new Date(entry.startDate);
                 const end = new Date(entry.endDate);
                 totalSleepMinutes += (end - start) / (1000 * 60);
             }
         });
      }
      
      return {
        minutes: totalSleepMinutes,
        hours: (totalSleepMinutes / 60).toFixed(1)
      };
    } catch (error) {
      console.error("Error fetching sleep data:", error);
      return { minutes: 0, hours: 0 };
    }
  }
};
