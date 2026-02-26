# Shuangyi Hu — Portfolio

A high-performance static portfolio with an AI Research Agent pipeline animation, digital twin chatbot, and modular architecture.

---

## 📁 Project Structure

```
portfolio/
├── index.html              ← Main HTML (links all modules)
│
├── css/
│   ├── tokens.css          ← Design system: CSS variables, reset, shared utilities
│   ├── nav.css             ← Fixed navigation bar
│   ├── hero.css            ← Full-screen pipeline animation hero
│   ├── profile.css         ← Photo card (square), bio, digital twin widget
│   ├── projects.css        ← Project cards grid
│   └── about-contact.css   ← About/skills band + contact section
│
├── js/
│   ├── pipeline.js         ← Deep Research Agent animation (self-contained module)
│   ├── widget.js           ← Digital Twin chat widget (self-contained module)
│   └── main.js             ← App init, scroll reveal, DOMContentLoaded
│
├── images/
│   ├── profile.jpg         ← ✦ YOUR SQUARE PHOTO HERE (e.g. 800×800px)
│   └── resume.pdf          ← ✦ YOUR RESUME PDF HERE
│
└── backend/
    ├── main.py             ← FastAPI server (HuggingFace proxy + resume API)
    ├── requirements.txt    ← Python dependencies
    └── .env.example        ← Environment variable template
```

---

## 🎨 Frontend Tech Stack

| Layer        | Technology        | Why                                                           |
|--------------|-------------------|---------------------------------------------------------------|
| Markup       | **HTML5**         | No build step needed; fast to deploy anywhere                 |
| Styling      | **CSS3** (modular)| CSS custom properties, Grid, Flexbox, keyframe animations     |
| Animation    | **Vanilla JS**    | SVG particle system + async/await pipeline sequence           |
| Fonts        | **Google Fonts**  | Syne (display), Lora (body), JetBrains Mono, Space Mono      |
| Hosting      | **GitHub Pages**  | Free, zero-config for static sites; just push to `gh-pages`  |

**Why no framework?** This is a portfolio — no state management, no routing, no build pipeline needed. Vanilla JS loads instantly and impresses recruiters who look at source code.

**If you later want to add a blog / CMS:**
- Migrate to **Astro** (keeps the HTML/CSS, adds MDX blog support)
- Or **Next.js** if you want React components

---

## ⚙️ Backend Tech Stack

| Layer        | Technology          | Why                                                          |
|--------------|---------------------|--------------------------------------------------------------|
| Runtime      | **Python 3.11+**    | HuggingFace ecosystem is Python-first                        |
| Framework    | **FastAPI**         | Async, auto-docs, Pydantic validation, 10× faster than Flask |
| HF Bridge    | **gradio-client**   | Official client for calling your HF Gradio Space             |
| ASGI server  | **uvicorn**         | Production-grade, used by FastAPI docs                       |
| Deployment   | **Railway / Render**| Free tier, auto-deploys from GitHub, handles HTTPS           |

### Why FastAPI over Node/Express?
Your Career Conversation app is already Python on HuggingFace. Keeping the backend Python means:
- Same `gradio-client` library you already know
- Easy to share utilities / prompts between the HF space and the API
- Native async support for concurrent chat requests

---

## 🚀 Setup

### Frontend (static — no install needed)
```bash
# Just open in browser:
open index.html

# Or serve locally with Python:
python -m http.server 8080
# Then visit http://localhost:8080
```

### Add your photo
1. Drop your square photo (e.g. `800×800px`) as `images/profile.jpg`
2. In `index.html`, replace:
   ```html
   <div class="photo-placeholder">...</div>
   ```
   with:
   ```html
   <img class="photo-img" src="images/profile.jpg" alt="Shuangyi Hu">
   ```

### Add your resume
Drop your PDF as `images/resume.pdf` — the download button is already wired up.

### Backend (optional — needed for live AI chat)
```bash
cd backend
cp .env.example .env
# Edit .env with your HF_SPACE and HF_TOKEN

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then in `js/widget.js`, update the `getReply()` function to call:
```js
const res  = await fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, history: chatHistory })
});
const data = await res.json();
return data.reply;
```

---

## 🌐 Deploy

### Frontend → GitHub Pages
```bash
git init
git add .
git commit -m "initial portfolio"
git branch -M main
git remote add origin https://github.com/shuangyihu/portfolio.git
git push -u origin main

# In GitHub repo Settings → Pages → Source: main branch / root
```

### Backend → Railway
1. Push `backend/` to a GitHub repo
2. Connect to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set env vars: `HF_SPACE`, `HF_TOKEN`
4. Railway auto-detects Python + gives you a public HTTPS URL
5. Update `widget.js` CORS origins with your Railway URL

---

## ✦ Customization Checklist

- [ ] Add `images/profile.jpg` (square photo, 800×800px recommended)
- [ ] Add `images/resume.pdf`
- [ ] Update contact email in `index.html`
- [ ] Update LinkedIn URL in `index.html`
- [ ] Replace demo chat replies in `js/widget.js` with real API call
- [ ] Update `backend/main.py` CORS origins with your domain
- [ ] Deploy frontend to GitHub Pages
- [ ] Deploy backend to Railway/Render

---

*Built with vanilla HTML/CSS/JS + FastAPI · No build step required*
