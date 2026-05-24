import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

// Replace with your real Google Ad Unit IDs
const REWARDED_AD_ID_ANDROID = 'YOUR_ADMOB_ANDROID_ID';
const REWARDED_AD_ID_IOS = 'YOUR_ADMOB_IOS_ID';

export const AdService = {
  async initialize() {
    if (isInitialized || Capacitor.getPlatform() === 'web') return;
    try {
      await AdMob.initialize();
      isInitialized = true;
      console.log('AdMob initialized successfully.');
    } catch (err) {
      console.error('AdMob initialization error:', err);
    }
  },

  async showRewardedAd() {
    if (Capacitor.getPlatform() === 'web') {
      // Fallback for Web/Browser Testing
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ type: 'Reward', amount: 3 });
        }, 15000);
      });
    }

    if (!isInitialized) {
      await this.initialize();
    }

    const adId = Capacitor.getPlatform() === 'ios' ? REWARDED_AD_ID_IOS : REWARDED_AD_ID_ANDROID;

    try {
      console.log('Preparing rewarded video ad...');
      await AdMob.prepareRewardVideoAd({
        adId,
        isTesting: false, // Set to true only during development
        margin: 0,
      });

      console.log('Showing rewarded video ad...');
      const rewardItem = await AdMob.showRewardVideoAd();
      
      console.log('Ad finished, reward:', rewardItem);
      return rewardItem; // Typically { type: string, amount: number }
    } catch (error) {
      console.error('Error showing rewarded ad', error);
      throw error;
    }
  }
};
