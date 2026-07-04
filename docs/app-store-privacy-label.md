# App Store Privacy Nutrition Label — SoloToDo

Stand: 2026-07-04 · abgeleitet aus dem Code (firebase.js, services/adService.js,
services/errorReporting.js, services/iapService.js, data/storage.js,
services/questAttachmentStore.js). Auszufüllen in App Store Connect →
App → **App-Datenschutz**.

## Frage 1: „Erfasst du Daten von dieser App?" → **JA**

## Frage 2: Tracking

**JA, diese App trackt** — AdMob zeigt personalisierte Werbung und nutzt die
Werbekennung; der ATT-Prompt (`requestTrackingAuthorization`) und der
UMP/GDPR-Consent-Flow sind bereits implementiert (adService.js). ✓

> Unter „Tracking" deklarieren: **Gerätekennung** (Device ID / Advertising ID).

## Frage 3: Datenkategorien (die Matrix)

| ASC-Kategorie | Was konkret | Zweck | Mit Identität verknüpft | Tracking |
|---|---|---|---|---|
| **Kontaktinformationen → E-Mail-Adresse** | Firebase Auth Login | App-Funktionalität | JA | Nein |
| **Kontaktinformationen → Name** | Hunter-Name / displayName | App-Funktionalität | JA | Nein |
| **Gesundheit & Fitness → Gesundheit** | Schritte & Schlaf via HealthKit (Pro-Feature), synchronisiert als healthDailyHistory nach Firestore | App-Funktionalität | JA | Nein |
| **Käufe → Kaufverlauf** | Abo-Status via RevenueCat + Gem-Käufe | App-Funktionalität | JA | Nein |
| **Nutzerinhalte → Sonstige Nutzerinhalte** | Quests, Ziele, Habits, Notizen (Firestore-Spielstand) | App-Funktionalität | JA | Nein |
| **Kennungen → Nutzer-ID** | Firebase uid | App-Funktionalität, Analyse | JA | Nein |
| **Kennungen → Gerätekennung** | Advertising ID (AdMob) | Werbung durch Dritte | NEIN (Werbenetzwerk) | **JA** |
| **Nutzungsdaten → Produktinteraktion** | Firebase-Analytics-Events (quest_completed, system_mark_*, regression_*, day_goal_reached, level_up, shop_purchase …) | Analyse | JA (konservativ, Account vorhanden) | Nein |
| **Diagnose → Absturzdaten** | Eigenes Error-Reporting nach Firestore, enthält uid (errorReporting.js) | App-Funktionalität | JA | Nein |
| **Sonstige Daten** | Bildschirmzeit-Zusammenfassung (screenTimeDailyHistory, nur wenn Feature aktiviert) | App-Funktionalität | JA | Nein |

## Bewusst NICHT deklariert (mit Begründung)

- **Standort:** `services/locationService.js` existiert, wird aber nirgends
  importiert — es werden keine Standortdaten erhoben. ⚠️ Vor dem Review:
  prüfen, ob `@capacitor/geolocation` im iOS-Build steckt und ob die
  Info.plist Location-Purpose-Strings enthält; wenn ja, Plugin entfernen,
  sonst fragt der Review nach.
- **Fotos:** Quest-Verifikationsfotos liegen in IndexedDB **auf dem Gerät**
  (questAttachmentStore.js). Bei KI-Verifikation wird das Bild zur
  Echtzeit-Analyse an die Cloud Function übergeben, aber nicht gespeichert →
  fällt unter Apples Ephemeral-Ausnahme. ⚠️ Bedingung: Die Function darf das
  Bild nicht loggen/persistieren — bei Gelegenheit in functions/ verifizieren.
- **Browserverlauf, Kontakte, Finanzinfo, präziser Standort:** nicht erhoben.

## Zugehörige Pflichten (gleiche ASC-Seite / Review)

1. **ATT ✓** — Prompt implementiert, Pflicht wegen Tracking-Deklaration.
2. **UMP/GDPR-Consent ✓** — implementiert; GDPR-Nachricht muss im
   AdMob-Dashboard konfiguriert sein.
3. **RevenueCat: noch TEST-Store-Key** (iapService.js Zeile 5) — vor dem
   Launch durch den echten `appl_…`-Key ersetzen. **Launch-Blocker.**
4. **DSA-Händlerstatus, Bankkonto, Steuerformulare** (die drei ASC-Banner):
   nötig für den **Verkauf** (Pro-Abo/IAP) in der EU — blockieren TestFlight
   nicht, aber den bezahlten Launch. Händlerstatus: mit IAP giltst du als
   Händler („Trader") → Kontaktdaten werden im EU-Store angezeigt
   (Impressums-Adresse, siehe Domain/Business-Mail-Plan).
5. **Datenschutzerklärung-URL** muss die obigen Kategorien abdecken
   (Firebase, AdMob, RevenueCat, HealthKit, Screen Time erwähnen).
