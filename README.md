# Archon Demo — Setup Guide
## AI-powered Azure architecture designer · Built for Replit

---

## ⚡ 5-minute setup

### Step 1 — Upload to Replit
1. Go to replit.com → Create Repl → Import from GitHub (or upload ZIP)
2. OR: create a new Repl → drag and drop this entire folder

### Step 2 — Add your Claude API key (REQUIRED)
1. In Replit, click **Tools → Secrets** (lock icon in left sidebar)
2. Add a new secret:
   - **Key:** `ANTHROPIC_KEY`
   - **Value:** your Anthropic API key (get one at console.anthropic.com)
3. Click **Add Secret**

That's it. No other secrets needed for the demo.

### Step 3 — Run
Click the **Run** button. Replit will:
1. Install Python dependencies (FastAPI, anthropic SDK)
2. Install Node dependencies (React, Vite, React Flow)
3. Start the backend on port 8000
4. Start the frontend on port 3000

The Replit preview will show the Archon UI.

---

## 🎯 Demo script (for customer presentation)

**Opening (30 seconds):**
> "Archon is an AI-powered Azure architecture designer. Instead of spending days
> creating architecture diagrams, your team can generate professional,
> WAF-validated designs in under 30 seconds."

**Live demo (2-3 minutes):**

1. Click the **"Smart document intelligence..."** quick prompt chip
2. Select **Healthcare** industry, **AI/ML platform** workload, **Zero-Trust** security
3. Select **HIPAA** and **SOC2** compliance
4. Click **⚡ Generate architecture**
5. While it generates (~15 seconds): explain the AI is selecting the right Azure services,
   calculating costs, and validating against Microsoft's Well-Architected Framework
6. Once generated: hover over service nodes to show tooltips (rationale, cost, PE status)
7. Click **WAF** tab to show pillar scores and findings
8. Click **Cost** tab to show breakdown and optimisation tips
9. Click **Export draw.io** — open the downloaded file in draw.io.com to show it works
10. Use flow filter buttons to highlight ingestion vs query paths

**Closing (30 seconds):**
> "What you just saw took 20 seconds. The equivalent manual work — selecting services,
> drawing the diagram, validating against WAF, estimating costs — typically takes
> a senior architect half a day. Archon does it in seconds, and the output is
> a professional draw.io file your team can edit immediately."

---

## 📁 File structure

```
archon-demo/
  backend/
    main.py              ← FastAPI app (ONE file — generate + export endpoints)
    requirements.txt     ← Python deps
  frontend/
    src/
      App.tsx            ← Entire React app (ONE file)
      main.tsx           ← Entry point
    index.html
    package.json
    vite.config.ts
    tsconfig.json
  .replit                ← Replit config
  replit.nix             ← Nix packages
  start.sh               ← Startup script
  README.md              ← This file
```

---

## 💰 Cost to run this demo

| Item | Cost |
|---|---|
| Replit Starter (free tier) | A$0 |
| Claude Sonnet 4.6 API — per generation | ~A$0.15 |
| 20 demo generations | ~A$3.00 total |
| Azure services | A$0 (not used — demo is self-contained) |
| **Total for demo** | **~A$3–5** |

Get A$5 free Claude API credit at console.anthropic.com when you sign up.
This covers ~30 demo generations — enough for multiple customer presentations.

---

## 🔧 Troubleshooting

**"ANTHROPIC_KEY not set" error:**
→ Add the key in Replit Secrets (Tools → Secrets), not in .env or code

**Generation times out:**
→ Claude API calls take 10-30 seconds. The loading spinner shows progress.
→ If it fails, try a simpler prompt first.

**Icons not showing:**
→ Icons load from code.benco.io CDN. Replit needs internet access (it has it by default).
→ If CDN is slow, icons may take 1-2 seconds to appear — this is normal.

**Frontend not connecting to backend:**
→ Vite proxies /api/* to localhost:8000 automatically.
→ If backend hasn't started yet, wait 10-15 seconds and reload.

**"Module not found" errors:**
→ Run `cd frontend && npm install` manually in the Replit shell

---

## 🚀 Next steps after the demo

1. **Add auth** — JWT email/password (see full prompt suite)
2. **Add Cosmos DB** — persist designs between sessions
3. **Add more exports** — PNG, PDF, PPTX
4. **Add refinement** — "add a WAF", "reduce to POC tier" chat
5. **Deploy to Azure Container Apps** — when you have paying customers
