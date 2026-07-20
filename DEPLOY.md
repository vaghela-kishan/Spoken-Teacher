# 🚀 Deployment Guide — Railway (backend) + Netlify (frontend)

આ project બે ભાગમાં deploy થાય છે:

| Part      | Platform | શું run થાય |
|-----------|----------|-------------|
| `backend/`  | **Railway** | FastAPI API + PostgreSQL |
| `frontend/` | **Netlify** | React (Vite) static site |

> તમારા build fail થતા હતા કારણ કે (1) Netlify ને ખબર ન હતી કે code `frontend/`
> subfolder માં છે, અને (2) Railway ના Docker image માં `faster-whisper` +
> `piper-tts` (ભારે native packages) build થતાં નહોતાં. બંને હવે fix થઈ ગયા છે —
> speech હવે browser (Web Speech API) વાપરે છે, એટલે image નાનું અને build ઝડપી.

---

## 1️⃣ Backend → Railway

1. Railway → **New Project → Deploy from GitHub repo** → `Spoken-Teacher` select કરો.
2. Service ના **Settings → Root Directory** = **`backend`** રાખો. *(બહુ જ અગત્યનું —
   આનાથી Railway `backend/Dockerfile` અને `backend/railway.json` વાપરશે.)*
3. એ જ project માં **New → Database → Add PostgreSQL** કરો.
4. Backend service ના **Variables** માં નીચેના add કરો:

   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ENVIRONMENT  = production
   SECRET_KEY   = <32+ અક્ષરની random string>
   GROQ_API_KEY = <https://console.groq.com/keys પરથી free key>
   GEMINI_API_KEY = <optional fallback>
   TTS_ENGINE   = browser
   REDIS_URL    =            (ખાલી રાખો — Redis optional છે)
   BACKEND_CORS_ORIGINS = https://<તમારી-netlify-site>.netlify.app
   FRONTEND_URL         = https://<તમારી-netlify-site>.netlify.app
   ```

   > `SECRET_KEY` બનાવવા: PowerShell માં `[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()`
   > `DATABASE_URL` ને `postgresql+asyncpg://` માં code પોતે convert કરી લે છે — તમારે કંઈ કરવાનું નથી.

5. **Settings → Networking → Generate Domain** કરો. મળેલો URL, દા.ત.
   `https://spoken-teacher-production.up.railway.app`, note કરી લો — Netlify માં જોઈશે.
6. Deploy થાય પછી `https://<railway-domain>/health` ખોલો → `{"status":"ok"}` દેખાવું જોઈએ. ✅

---

## 2️⃣ Frontend → Netlify

1. Netlify → **Add new site → Import from GitHub** → `Spoken-Teacher` select કરો.
2. Build settings **જાતે ભરવાની જરૂર નથી** — root માં `netlify.toml` બધું set કરે છે
   (base = `frontend`, publish = `frontend/dist`, SPA redirect, Node 20).
3. **Site settings → Environment variables** માં add કરો (Railway domain વાપરીને):

   ```
   VITE_API_URL = https://<railway-domain>.up.railway.app
   VITE_WS_URL  = wss://<railway-domain>.up.railway.app
   ```

   > ⚠️ આ values **build-time** માં bundle માં bake થાય છે. બદલો પછી Netlify પર
   > **Clear cache and deploy site** કરવું જરૂરી છે, નહીંતર જૂનું URL રહી જશે.

4. **Deploy** કરો. તમારી site `https://<something>.netlify.app` પર live થશે.

---

## 3️⃣ છેલ્લે — બે ને જોડો (CORS)

Netlify URL મળી ગયા પછી, Railway ના `BACKEND_CORS_ORIGINS` અને `FRONTEND_URL`
માં **એ જ exact URL** (છેલ્લે `/` વગર) ભરેલો છે તેની ખાતરી કરો → Railway redeploy કરો.
આ ન કરો તો browser console માં CORS error આવશે અને login/API calls fail થશે.

---

## ⚠️ Screenshot માં દેખાતી બે failed Railway deployments

તમારી પાસે 2 Railway services હતી (`protective-creativity`, `amusing-clarity`) — બંને fail.
એક જ **backend** service રાખો (ઉપર પ્રમાણે root dir = `backend`), બાકીની delete કરી દો.
Frontend Railway પર **નથી** જોઈતું — એ Netlify પર જાય છે.

---

## 🎤 Server-side speech (optional, જરૂરી નથી)

Browser પોતે speech-to-text અને text-to-speech કરે છે, એટલે server પર કંઈ install
કરવાની જરૂર નથી. જો ભવિષ્યમાં server-side neural voices જોઈએ તો
`backend/requirements-optional.txt` જુઓ (ffmpeg + મોટા packages જોઈશે).

---

## ✅ ટૂંકી checklist

- [ ] Railway service root dir = `backend`
- [ ] Railway માં PostgreSQL add + `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- [ ] Railway env: `ENVIRONMENT=production`, `SECRET_KEY` (32+), `GROQ_API_KEY`, `TTS_ENGINE=browser`
- [ ] Railway domain generate + `/health` OK
- [ ] Netlify import (netlify.toml auto) + `VITE_API_URL` / `VITE_WS_URL` set
- [ ] `BACKEND_CORS_ORIGINS` = Netlify URL, પછી Railway redeploy
- [ ] બિનજરૂરી બીજી Railway service delete
</content>
