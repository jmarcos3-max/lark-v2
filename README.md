**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

# Audiotool Nexus (register at https://developer.audiotool.com/applications)
VITE_AUDIOTOOL_CLIENT_ID=your_audiotool_client_id
VITE_AUDIOTOOL_REDIRECT_URL=http://127.0.0.1:5173/

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

**Audiotool login** ([docs](https://developer.audiotool.com/js-package-documentation/documents/Authentication.html)):

| Requirement | Lark setup |
|-------------|------------|
| Dev server host | `vite.config.js` → `host: '127.0.0.1'`, `port: 5173` |
| Open in browser | `http://127.0.0.1:5173/` (not `localhost`) |
| Redirect URI (portal + `.env.local`) | `http://127.0.0.1:5173/` (trailing slash required) |
| Scope (portal + app) | `project:write` |
| Login button | Calls `at.login()` from `audiotool()` per docs |

**Delete project:** Requires `project:write` on your [developer app](https://developer.audiotool.com/applications) and a fresh login after changing scopes. If you see `permission_denied` / gRPC code 7, delete the project at [audiotool.com/projects](https://www.audiotool.com/projects) instead (published tracks must be removed on Audiotool first).

**Humming → instrument flow:**

1. Record humming in **Audio Capture**
2. Sign in to **Audiotool** and pick a **Connected project** (dropdown in Parameter Matrix), or **New Project**
3. Pick **instrument** + **mood**
4. Click **Transform humming → instrument** — Lark detects rhythm from your hum and writes MIDI notes on the chosen instrument in that project
5. Open the project in **Audiotool Studio** and press play from bar 1; use **Save Project** to persist metadata

**Nexus SDK map (what Lark writes)**

| Step | SDK call | Studio result |
|------|----------|---------------|
| Open project | `at.open(studioUrl)` + `doc.start()` | Project synced |
| Rhythm | Web Audio onset detection (local) | — |
| Device | `gakki` (Piano/Guitar), `bassline`, `beatbox8` | Instrument on desktop |
| Timeline | `noteTrack` → `noteRegion` → `note` × N | Green MIDI clip (e.g. "Lark · Piano · Calm") |
| Hear it | `desktopAudioCable` device → `mixerChannel` on **Master** | Cable on stagebox |

Code: `src/lib/nexus-rhythm-notes.js`, `src/lib/nexus-mixer-routing.js`

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
