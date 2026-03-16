# GSD Assessment Server

Node.js/Express backend for the GSD Organizational Efficiency Assessment. Serves the HTML assessment and forwards completed lead submissions as formatted HTML emails to `bstevens@gsdsol.com` via Outlook/Office 365 SMTP.

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env` and fill in your Outlook credentials:

```
EMAIL_USER=bstevens@gsdsol.com
EMAIL_PASS=your-outlook-password
PORT=3000
```

### 3. Start the server

```bash
node server.js
# or
npm start
```

Open [http://localhost:3000](http://localhost:3000) — the assessment loads directly. When a user completes the form, a POST to `/submit-lead` fires and the email is sent.

---

## If SMTP AUTH is blocked by IT

Office 365 tenants often have SMTP AUTH disabled at the org level. If emails fail to send, the full lead payload is always logged to the server console (no data is lost). To fix delivery:

**Option A — Enable SMTP AUTH in Microsoft 365 Admin Center**

1. Go to **Microsoft 365 Admin Center → Settings → Org Settings → Modern Authentication**
2. Enable "Authenticated SMTP" (also listed under Exchange Admin → Mobile → Mobile Device Access or under Users → Active Users → the specific mailbox → Mail → Manage email apps → enable "Authenticated SMTP")

**Option B — Switch to Microsoft Graph API**
If your IT policy disallows SMTP AUTH entirely, the recommended alternative is the Microsoft Graph API (`/v1.0/me/sendMail`), which uses OAuth2 and bypasses SMTP restrictions. Let me know if you'd like the server updated to use Graph instead.

---

## Deploying for Free

All three platforms below support the `.env` variables natively — no code changes needed.

### Railway

1. Push this directory to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add environment variables: `EMAIL_USER`, `EMAIL_PASS` (PORT is set automatically)
4. Railway auto-detects Node.js and runs `npm start`

### Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → connect repo
3. Build Command: `npm install`  |  Start Command: `node server.js`
4. Add `EMAIL_USER` and `EMAIL_PASS` under **Environment**
5. Free tier sleeps after 15 min of inactivity (first request after sleep is slow)

### Fly.io

```bash
# Install flyctl, then:
fly launch          # detects Node, creates fly.toml
fly secrets set EMAIL_USER=bstevens@gsdsol.com EMAIL_PASS=your-password
fly deploy
```

Fly.io free tier stays awake and gives you a persistent URL.

---

## Project Structure

```
gsd-assessment/
├── server.js            # Express server + Nodemailer email sender
├── gsd-assessment.html  # Assessment UI (served at /)
├── package.json
├── .env.example         # Copy to .env and fill in credentials
└── README.md
```

## How it works

1. User completes the multi-step assessment in the browser
2. On final form submission, `submitLead()` fires a `POST /submit-lead` with the full JSON payload
3. `server.js` logs the payload to console (always), then attempts to send an HTML email via Office 365 SMTP
4. If SMTP fails, the server responds with `{ ok: true }` anyway so the user sees the success screen — the lead is preserved in server logs
