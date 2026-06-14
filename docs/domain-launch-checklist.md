# SoloToDo Domain- & E-Mail-Checkliste

Stand: 11. Juni 2026 (überarbeitet)

## Aktueller Plan

- **Haupt-URL bleibt `https://solo-todo.web.app`** — kein Hosting-Umzug, keine Subdomain-Anbindung vorerst.
- **Business-E-Mail vorerst: `jwuckert2+STD@gmail.com`** (Gmail-Plus-Alias, 0 €) — steht in Impressum, Datenschutz, Nutzungsbedingungen, Support und AppStore_Metadata. Domainkauf ist komplett zurückgestellt, bis Geld fließt.
- Wenn später gekauft wird: `solotodo.de` (~5 €/Jahr, netcup oder Cloudflare). Kein iCloud+ vorhanden! Günstigste Mail-Optionen dann: Cloudflare Email Routing → Gmail (0 €), Zoho Free (0 €, nur Zoho-App), iCloud+ 50 GB (0,99 €/Monat, native Apple Mail).
- **Impressum:** vorerst echte Privatanschrift (Amalienweg 5, 70794 Filderstadt) — Anschrift.net (~80 €/Jahr) wird erst gebucht, wenn die App Umsatz macht.
- Die frühere Deploy-Sperre (`validate-domain-release`) wurde entfernt; `npm run predeploy && npm run deploy` funktioniert wieder normal — **es gibt keine Deploy-Blocker mehr**, alle hinterlegten Kontaktdaten funktionieren sofort.

`solotodo.de` hatte am 11. Juni 2026 weder DNS-Einträge noch einen DENIC-RDAP-Eintrag und erschien registrierbar. Eine schnelle exakte Websuche ergab keinen offensichtlichen DPMA-/EUIPO-Treffer. Das ist keine rechtliche Markenfreigabe.

Alles ab hier ist **zurückgestellt** und wird erst relevant, wenn die Domain tatsächlich gekauft wird:

## 1. Domain kaufen (nur für E-Mail)

1. Unmittelbar vor dem Kauf `solotodo.de` bei netcup erneut auf Verfügbarkeit prüfen.
2. Optional: in [DPMAregister](https://register.dpma.de/DPMAregister/marke/einsteiger) und [EUIPO eSearch](https://euipo.europa.eu/eSearch/) nach `SoloToDo` / `Solo Todo` suchen.
3. `solotodo.de` bei netcup registrieren (Domain only, kein Webhosting-Paket nötig). Für die Inhaberangaben die echte Anschrift verwenden.
4. Kein DNS für Web nötig — A/AAAA/CNAME bleiben leer bzw. unverändert; es werden nur die Mail-Einträge aus Schritt 2 gesetzt.

## 2. iCloud Custom Email Domain (0 € extra)

1. Auf dem iPhone oder unter [icloud.com/icloudplus](https://www.icloud.com/icloudplus) → „Eigene E-Mail-Domain" → `solotodo.de` hinzufügen.
2. Folgende Adressen anlegen:
   - `support@solotodo.de`
   - `privacy@solotodo.de`
   - `kontakt@solotodo.de`
3. Bei netcup exakt die von Apple angezeigten MX-, TXT-, SPF- und DKIM-Einträge anlegen. Apples individuelle Verifizierungswerte nicht aus Beispielen übernehmen.
4. Nach erfolgreicher Apple-Verifizierung bei netcup einen DMARC-TXT-Eintrag für `_dmarc.solotodo.de` ergänzen:

   ```text
   v=DMARC1; p=none; rua=mailto:privacy@solotodo.de; adkim=s; aspf=s
   ```

5. Versand und Empfang aller drei Adressen extern testen (z. B. an/von Gmail). Erst nach stabiler Zustellung DMARC schrittweise auf `quarantine` und später gegebenenfalls `reject` verschärfen.
6. Erst wenn die Postfächer funktionieren: die Übergangsadresse `jwuckert2+STD@gmail.com` in Impressum, Datenschutz, Nutzungsbedingungen, Support und AppStore_Metadata durch die `@solotodo.de`-Adressen ersetzen und neu deployen.

   Hinweis: Schritt 2 gilt für die iCloud+-Variante. Ohne iCloud+ stattdessen Cloudflare Email Routing (Empfang → Gmail, kostenlos) plus Brevo-SMTP fürs Senden, oder Zoho Mail Free.

## 3. Später (zurückgestellt)

- **`app.solotodo.de` als Web-App-Domain:** Firebase Console → Hosting → Custom Domain; Auth Authorized Domains, OAuth-Redirects (`/__/auth/handler`), Apple-Domain-Verifizierung, App-Check-Allowlist. `firebase.js` enthält `app.solotodo.de` bereits in `FIRST_PARTY_AUTH_HOSTS` — dort ist nichts mehr zu tun.
- **Anschrift.net Basic (~80,40 €/Jahr):** buchen, sobald Umsatz fließt; dann die Privatanschrift in `public/impressum.html`, `public/datenschutz.html` und `AppStore_Metadata.txt` ersetzen.
- **Anwaltliche Prüfung der Rechtstexte** vor bezahlten Abonnements / größerem kommerziellem Launch.
- `capacitor.config.json` behält dauerhaft den lokalen nativen Ursprung `app.solotodo.com` — das ist kein öffentlicher DNS-Host und darf nicht geändert werden (sonst verlieren native Nutzer ihre lokalen Daten).

## Kostenrahmen (aktueller Plan)

- netcup `.de`-Domain: ungefähr 5,04 €/Jahr
- iCloud-E-Mail-Domain: 0 € zusätzlich (in iCloud+ enthalten)
- **Gesamt: ungefähr 5 €/Jahr**
