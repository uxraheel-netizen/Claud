# Pilot: Raheel's offline day bot

A personal productivity and health bot that you install on your phone as an app.

- **Free to run.** It doesn't use an AI API, so it never spends credits. The "bot" is a set of local rules.
- **Fully independent.** There's no server, no account and no sign-up. It works offline after the first load.
- **Private.** It reads nothing from your phone: no contacts, location, photos or sensors. Your data stays in the app's own storage on your device, and you can export a backup file whenever you want.

## What it does

| Tab | For |
|---|---|
| **Today** | A "Right now" card based on your real routine (wake 8:30, office 9:40, lunch 1:15–2:00, off 6, sleep 12). It also holds your top 3, today's meetings with notes, your tasks and a tickable schedule. |
| **Team** | Assign tasks to Mridul, Agha, Ahmad, Abdullah, Wajahat or yourself. **Daily brief** builds a WhatsApp-ready message for each person (Wajahat is excluded by default). There's a QA queue and a client checklist for the Notion sweep. It also suggests a better owner, e.g. "Ahmad doesn't do Framer". |
| **Bot** | A chat that understands commands, for example `mridul: fix navbar for Acme !`, `brief`, `now`, `qa 4`, `water`, `cig`, `focus` and `week`. Type `help` to see them all. |
| **Health** | Water glasses, a smoking tracker (the daily limit drops by 1 each week), a 50/10 focus timer, fiancée time vs your 2–3h goal, a cap on personal-client work, a sleep log and a 2-minute desk reset. |
| **More** | Edit routine times, workdays, goals and team, export/import a backup, and install help. |

**QA gate:** a team task can't be marked "Ready for client" until all 12 items on the web/Framer QA checklist are ticked. Anything that fails turns into feedback you can copy and send to the person.

**Reminders:** tap 🔔 to allow notifications. You'll get a reminder at the start of each block, water nudges and hourly stretch reminders during office time. They fire while the app is open or recently used, because there's no server to push them.

## Android app (APK)

**Download `android/Pilot.apk`** and open it on your phone. Android will ask you to allow installing from this source; allow it once, then tap Install.

- On first open, allow notifications. Reminders are real Android alarms: they fire at every routine block, for water and stretch nudges, and when the focus timer ends, **even when the app is closed**. They also survive a reboot.
- If a reminder doesn't arrive, go to Settings → Apps → Pilot → Battery and set it to *Unrestricted*. Some phones, like Xiaomi, Oppo and Vivo, kill background alarms otherwise.
- The APK has **no internet permission**. It only uses notifications, alarms and vibration.
- Backup uses the share sheet; send the file to yourself on WhatsApp or Drive.

To rebuild it after changing the web app: `android/build.sh`. It uses Ubuntu's Android tools, and the command at the top of the script lists them. Keep `android/pilot-release.keystore`: every update must be signed with the same key, or Android makes you uninstall first, which deletes your data.

## Put it on your phone (web version, any phone incl. iPhone)

The app is plain static files (HTML, CSS and JS) with no build step. Host this folder anywhere that serves HTTPS:

1. **Netlify Drop (easiest, free):** go to app.netlify.com/drop and drag the `raheel-bot` folder in. You'll get a link.
2. Or use **GitHub Pages**, Vercel or Cloudflare Pages, pointed at this folder.

Then open the link on your phone:
- **Android (Chrome):** ⋮ menu → *Install app* / *Add to Home screen*
- **iPhone (Safari):** Share → *Add to Home Screen*, open it from the icon, then tap 🔔 (needs iOS 16.4+)

Once it's installed, it runs from the home-screen icon and works offline.

To try it locally: `cd raheel-bot && python3 -m http.server`, then open http://localhost:8000.
