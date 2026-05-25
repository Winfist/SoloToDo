import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;

// Google AdMob Rewarded Ad Unit IDs
const REWARDED_AD_ID_ANDROID = 'ca-app-pub-2350642592248441/2131783438';
const REWARDED_AD_ID_IOS = 'ca-app-pub-2350642592248441/3444865106';

export const AdService = {
  async initialize() {
    if (isInitialized || Capacitor.getPlatform() === 'web') return;
    try {
      // GDPR/UMP consent (EU/EEA). Requires a GDPR message configured in the AdMob
      // console (Privacy & messaging); without it status comes back NOT_REQUIRED.
      // The Mobile Ads SDK then serves personalized vs. non-personalized ads based
      // on the gathered consent.
      try {
        const consentInfo = await AdMob.requestConsentInfo();
        if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
      } catch (consentErr) {
        console.warn('AdMob consent flow skipped:', consentErr);
      }

      // iOS: show the App Tracking Transparency prompt before initializing ads.
      // Without this the NSUserTrackingUsageDescription prompt never appears and
      // personalized ads cannot be served (App Store / iOS 14.5+ requirement).
      if (Capacitor.getPlatform() === 'ios') {
        try {
          const { status } = await AdMob.trackingAuthorizationStatus();
          if (status === 'notDetermined') {
            await AdMob.requestTrackingAuthorization();
          }
        } catch (attErr) {
          console.warn('ATT authorization request skipped:', attErr);
        }
      }

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
  },

  // True only where a "manage consent" entry point must be offered (EU/EEA).
  // Web, or no GDPR message configured in the AdMob console, returns false.
  async getPrivacyOptionsRequired() {
    if (Capacitor.getPlatform() === 'web') return false;
    try {
      const info = await AdMob.requestConsentInfo();
      return info.privacyOptionsRequirementStatus === 'REQUIRED';
    } catch (err) {
      console.warn('Could not read AdMob consent info:', err);
      return false;
    }
  },

  // Re-opens the GDPR privacy options form so the user can change/withdraw consent.
  async showPrivacyOptions() {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch (err) {
      console.error('Error showing privacy options form:', err);
    }
  }
};
