# GitHub + Vercel MVP Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch 13 a 0 on jogue13a0.com.br with automatic CI/CD, analytics, and public GitHub repository for alpha testing with friends.

**Architecture:** Commit all changes to main branch → push to GitHub → Vercel auto-deploys to production. Vercel Analytics collects visitor metrics. Manual feedback collected via form in /sobre page.

**Tech Stack:** GitHub (repo hosting), Vercel (static hosting + analytics), SvelteKit adapter-static (already configured), Vercel Analytics (free Web Analytics).

---

## File Structure

**Files to create:**
- `docs/superpowers/plans/2026-06-16-github-vercel-launch.md` (this plan)

**Files to modify:**
- `README.md` — expand with setup instructions, game rules summary, feedback process
- `svelte.config.js` — enable Vercel Analytics
- `src/routes/sobre/+page.svelte` — add feedback form/link
- `.gitignore` — verify/add common exclusions

**No new functional code** — only configuration and documentation.

---

## Task 1: Pre-Deployment Verification

**Files:**
- Test: All test files remain unchanged
- Verify: `npm test`, `npm run check`, `npm run build` all pass

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected output: All tests pass (green checkmarks, no failures).

- [ ] **Step 2: Run TypeScript type check**

```bash
npm run check
```

Expected output: No type errors, clean output.

- [ ] **Step 3: Build the project**

```bash
npm run build
```

Expected output: Build succeeds, `build/` directory created with static files.

- [ ] **Step 4: Verify build output**

```bash
ls -la build/ | head -20
```

Expected output: Files like `index.html`, `jogo/`, `sobre/`, etc. present in build directory.

- [ ] **Step 5: Commit any unstaged changes (if needed)**

If any changes were made during testing:

```bash
git add -A
git commit -m "chore: ensure clean state before GitHub push"
```

If nothing changed, skip this step.

---

## Task 2: Create GitHub Repository and Push Code

**Files:**
- Modify: `.gitignore` (ensure complete)

- [ ] **Step 1: Verify .gitignore is complete**

Open `/home/lemontech/chelo/gitP/13a0/.gitignore` and ensure it contains:

```
node_modules/
build/
.svelte-kit/
dist/
*.local
.env
.env.local
.env.*.local
```

If `.gitignore` doesn't exist or is incomplete, create/update it with the above content.

- [ ] **Step 2: Create GitHub repository**

Go to https://github.com/new and create repository with:
- **Owner:** CheloCortez
- **Repository name:** 13a0
- **Description:** "13 a 0 - Counter-Strike Major draft simulator" (optional)
- **Public:** Yes
- **Initialize:** Do NOT initialize with README (you have one locally)
- **Add .gitignore:** No (you have one locally)

Click "Create repository". GitHub will show you the commands to push an existing repo.

- [ ] **Step 3: Add GitHub remote to local repo**

```bash
git remote add origin https://github.com/CheloCortez/13a0.git
git branch -M main
```

Expected output: No errors, remote is configured.

- [ ] **Step 4: Push all commits to GitHub**

```bash
git push -u origin main
```

Expected output: All commits pushed, branch tracking established.

- [ ] **Step 5: Verify on GitHub**

Open https://github.com/CheloCortez/13a0 in browser. Verify:
- All files are present
- Recent commits show in commit history
- No node_modules or build/ in repo

- [ ] **Step 6: Commit plan document**

```bash
git add docs/superpowers/plans/2026-06-16-github-vercel-launch.md
git commit -m "docs: add GitHub + Vercel launch plan"
git push
```

---

## Task 3: Configure Vercel Project and Auto-Deployment

**Files:**
- No code changes (configuration in Vercel dashboard)

- [ ] **Step 1: Go to Vercel and import project**

Go to https://vercel.com/dashboard and click "Add New" → "Project".

Select "Import Git Repository" and find `CheloCortez/13a0` in the list. Click "Import".

Expected: Vercel shows project configuration screen.

- [ ] **Step 2: Configure build settings**

Vercel should auto-detect SvelteKit settings. Verify:
- **Framework Preset:** SvelteKit
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

Click "Deploy".

Expected: Vercel starts initial build (takes 1-2 minutes). You get a deployment URL like `13a0-xyz.vercel.app`.

- [ ] **Step 3: Wait for initial deployment to complete**

Refresh the Vercel dashboard until deployment shows "Ready" status (green checkmark).

Click the deployment URL to verify site loads and works (can play the game, no errors in console).

- [ ] **Step 4: Verify auto-deployment is enabled**

In Vercel project settings:
- Go to Settings → Git
- Verify "Vercel for GitHub" is connected
- Verify "Deploy on push to main" is enabled (default)

Expected: Any future push to main triggers automatic deployment.

---

## Task 4: Enable Vercel Analytics

**Files:**
- Modify: `svelte.config.js`

- [ ] **Step 1: Open svelte.config.js**

Read the current file at `/home/lemontech/chelo/gitP/13a0/svelte.config.js`.

- [ ] **Step 2: Add Vercel Analytics configuration**

Add this line at the top of the file (after any imports, before config export):

```javascript
import { building } from '$app/environment';
```

Then in the config export, add this inside the `vite` object (or create it if missing):

```javascript
define: {
  __VERCEL__: JSON.stringify(process.env.VERCEL === '1'),
}
```

The file should look roughly like:

```javascript
import adapter from '@sveltejs/adapter-static';
import { building } from '$app/environment';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: process.env.BASE_PATH || ''
    }
  },
  vite: {
    define: {
      __VERCEL__: JSON.stringify(process.env.VERCEL === '1'),
    }
  }
};

export default config;
```

- [ ] **Step 3: Add Vercel Analytics to root layout**

Open `src/routes/+layout.svelte`. Add this at the top of the script section:

```svelte
<script>
  import { dev } from '$app/environment';

  // Enable Vercel Analytics in production
  if (!dev) {
    import('@vercel/analytics/sveltekit');
  }
</script>
```

If the file already has a `<script>` tag, just add the code inside it (no duplicate script tags).

- [ ] **Step 4: Add Vercel Analytics dependency**

```bash
npm install @vercel/analytics
```

Expected output: Package installed, appears in package.json.

- [ ] **Step 5: Verify no TypeScript errors**

```bash
npm run check
```

Expected output: No errors.

- [ ] **Step 6: Build and test locally**

```bash
npm run build
npm run preview
```

Open http://localhost:4173 and verify site works (no errors in console).

- [ ] **Step 7: Commit changes**

```bash
git add svelte.config.js src/routes/+layout.svelte package.json package-lock.json
git commit -m "feat: enable Vercel Analytics for MVP"
git push
```

Expected: Vercel automatically deploys new version (watch Vercel dashboard for deployment).

---

## Task 5: Configure Custom Domain

**Files:**
- No code changes (domain configuration in Vercel)

**Prerequisites:** Domain `jogue13a0.com.br` must be registered. If not registered yet, register it via any registrar (Namecheap, Google Domains, etc.) before this task.

- [ ] **Step 1: Add domain in Vercel**

Go to Vercel project → Settings → Domains.

Click "Add" and enter: `jogue13a0.com.br`

Vercel will show DNS configuration instructions.

- [ ] **Step 2: Configure DNS**

**Option A: Use Vercel nameservers (recommended for simplicity)**
- In your domain registrar's dashboard, change nameservers to Vercel's:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
  - `ns3.vercel-dns.com`
  - `ns4.vercel-dns.com`

Wait 24-48 hours for DNS to propagate globally.

**Option B: Use CNAME (if you want to keep existing nameservers)**
- Add CNAME record: `jogue13a0.com.br` → `cname.vercel-dns.com`

Wait a few minutes.

- [ ] **Step 3: Verify domain is connected**

In Vercel domain settings, refresh until status shows "Valid" (green checkmark).

Once valid, open https://jogue13a0.com.br in browser and verify:
- Site loads (no "not found" errors)
- HTTPS works (no certificate warnings)
- Game is playable

---

## Task 6: Expand README with Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

Open `/home/lemontech/chelo/gitP/13a0/README.md` and review current content.

- [ ] **Step 2: Expand README with complete sections**

Replace/expand the README with this structure:

```markdown
# 13 a 0 — Counter-Strike Major Draft Simulator

A browser-based game where you draft players from historic Counter-Strike Majors, build your dream team, and simulate a complete Major tournament (Swiss stage + playoffs). The ultimate glory: win a map 13–0.

## Play Now

🎮 **[jogue13a0.com.br](https://jogue13a0.com.br)**

## Game Rules

### Draft Phase (5 Picks)
- Each pick gives you a random team from a Major
- You choose **any player** from that team (roles can repeat)
- Auto-placement adjusts players to optimal roles based on their historical strength

### Team Strength
- Off-role penalty: −15% rating
- Missing dedicated AWPer: −8%
- Missing dedicated IGL: −10%
- Extra AWPers: −5% each
- Teammate synergy (played together historically): +3%

### Game Modes
- **Classic:** Full visibility, 3 redrafts
- **Almanac:** Blind mode (ratings hidden), 1 redraft

### Tournament
- Swiss stage (6 rounds, round-robin seeding)
- Best-of-1 matches; top 2 advance to playoffs
- Playoffs: single-elimination BO3

## Setup (Local Development)

Requires **Node.js 22.22.3** (managed via nvm).

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
npm install
npm run dev          # http://localhost:5173
npm test             # Run all tests
npm run check        # TypeScript check
npm run build        # Static build
npm run validate-data # Verify Major JSONs
```

## Architecture

- **100% static:** SvelteKit + Svelte 5 (runes) + TypeScript + `adapter-static`
- **No backend:** All game logic runs in the browser
- **Deterministic simulation:** Same seed = same tournament outcome
- **Persistent saves:** Campaign state stored in localStorage

### Key Files

- `src/lib/engine/` — Game logic (draft, strength, matches, tournaments)
- `src/lib/stores/game.svelte.ts` — State management and flow orchestration
- `src/lib/components/` — UI components (PlayerCard, TeamCard, SwissBoard, etc.)
- `src/routes/` — Pages (home, /jogo, /sobre)
- `static/data/majors/` — Historic Major rosters (JSON)

## Feedback & Bug Reports

Found a bug? Have a suggestion? Please let us know:

- **Discord:** [Join our server](#) (coming soon)
- **Form:** [Feedback form](#) (coming soon)
- **GitHub Issues:** [Open an issue](https://github.com/CheloCortez/13a0/issues)

## Contributing

This is an alpha MVP. Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes with clear messages
4. Push and open a PR
5. Wait for review

## Analytics

We collect anonymized usage data via Vercel Analytics to understand:
- How many people play
- Which game modes are popular
- Performance metrics (Core Web Vitals)

No personal data is stored. You can see what we collect [here](#).

## License

MIT — feel free to fork, modify, and remix!

---

**Made by:** Marcelo Cortez
**Inspired by:** 7 a 0 (Copa simulator)
```

- [ ] **Step 3: Verify structure**

Make sure the README:
- Has a "Play Now" link to jogue13a0.com.br
- Documents game rules clearly
- Explains setup with nvm command
- Lists key files and architecture
- Provides feedback/bug report channels
- Mentions analytics

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: expand README with complete game and project documentation"
git push
```

---

## Task 7: Add Feedback Collection to /sobre Page

**Files:**
- Modify: `src/routes/sobre/+page.svelte`

- [ ] **Step 1: Read current /sobre page**

Open `/home/lemontech/chelo/gitP/13a0/src/routes/sobre/+page.svelte` and review.

- [ ] **Step 2: Create a simple Google Form**

Go to https://forms.google.com and create a form titled "13 a 0 Feedback" with fields:
- **Short answer:** "Your name (optional)"
- **Short answer:** "Email (optional)"
- **Paragraph:** "What did you like?"
- **Paragraph:** "What could improve?"
- **Multiple choice:** "Which mode did you play?" (Classic / Almanac / Both)

Get the form's embed URL (looks like `https://forms.google.com/gviewform?embedded=true&formkey=...`).

- [ ] **Step 3: Add feedback section to /sobre**

At the end of the page content (before any closing tags), add:

```svelte
<section class="feedback-section">
  <h2>Feedback</h2>
  <p>
    Gostou do jogo? Encontrou um bug? Quer sugerir uma feature? Sua opinião é valiosa!
  </p>
  <p>
    <a href="https://forms.google.com/gviewform?embedded=true&formkey=YOUR_FORM_KEY" target="_blank">
      📝 Preencha nosso formulário de feedback
    </a>
  </p>
  <p style="font-size: 0.9em; opacity: 0.7;">
    Você também pode <a href="https://github.com/CheloCortez/13a0/issues" target="_blank">abrir uma issue no GitHub</a>.
  </p>
</section>

<style>
  .feedback-section {
    margin-top: 3rem;
    padding: 1.5rem;
    border-top: 2px solid var(--accent);
    background: rgba(255, 165, 0, 0.05);
  }

  .feedback-section h2 {
    margin-top: 0;
  }

  .feedback-section a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
  }

  .feedback-section a:hover {
    text-decoration: underline;
  }
</style>
```

Replace `YOUR_FORM_KEY` with the actual form key from your Google Form URL.

- [ ] **Step 4: Test locally**

```bash
npm run dev
```

Open http://localhost:5173/sobre and verify:
- Feedback section appears at the bottom
- Links work (external links open in new tab)
- Styling looks good (matches page design)

- [ ] **Step 5: Commit**

```bash
git add src/routes/sobre/+page.svelte
git commit -m "feat: add feedback form link to /sobre page"
git push
```

---

## Task 8: Final Pre-Production Checklist

**Files:**
- Verify all modified files

- [ ] **Step 1: Run full test suite one more time**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Run data validation**

```bash
npm run validate-data
```

Expected: All Major JSONs valid (no errors, Cologne 2026 provisional is okay).

- [ ] **Step 4: Build production bundle**

```bash
npm run build
```

Expected: Build succeeds, `build/` created.

- [ ] **Step 5: Preview production bundle locally**

```bash
npm run preview
```

Open http://localhost:4173 and manually test:
- Home page loads
- Can start a Classic game
- Can start an Almanac game
- Draft works (pick players)
- Review drag-and-drop works
- Tournament runs to completion
- /sobre page loads with feedback links
- Open browser DevTools → Console (no errors)

- [ ] **Step 6: Check Vercel deployment status**

Go to https://vercel.com/dashboard/CheloCortez/13a0

Verify latest deployment shows "Ready" (green).

- [ ] **Step 7: Test production domain**

Open https://jogue13a0.com.br in browser and verify:
- Site loads (DNS propagated)
- HTTPS certificate valid (no warnings)
- Game is fully playable
- No errors in DevTools console

- [ ] **Step 8: Monitor Vercel Analytics**

Go to Vercel project → Analytics. Verify:
- Dashboard loads
- Page views are being tracked (may show zero if just deployed, check back in a few minutes)

- [ ] **Step 9: Verify GitHub repo is clean**

```bash
git status
```

Expected: "On branch main" and "nothing to commit, working tree clean".

- [ ] **Step 10: Final summary commit (optional)**

If any last-minute fixes were needed:

```bash
git log --oneline -10  # Verify commit history looks good
```

---

## Summary

After completing all tasks:

✅ Code is on GitHub at https://github.com/CheloCortez/13a0
✅ Auto-deployment pipeline configured in Vercel
✅ Site live at https://jogue13a0.com.br with SSL
✅ Vercel Analytics enabled and tracking
✅ README documents game, setup, and feedback process
✅ Feedback form linked in /sobre page
✅ All tests pass, no type errors, production build verified
✅ Ready for friends alpha testing

Share the link: **https://jogue13a0.com.br**
