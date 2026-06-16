---
name: github-vercel-launch-design
description: MVP launch strategy with GitHub repository and Vercel deployment with analytics
metadata:
  type: design
  date: 2026-06-16
  targetAudience: friends alpha testing group
---

# MVP Launch Design: GitHub + Vercel Deployment

## Overview

Launch **13 a 0** as a publicly accessible MVP on production infrastructure with automatic deployment pipeline, custom domain, and analytics collection for a closed alpha group (friends).

**Target:** jogue13a0.com.br
**Repository:** github.com/CheloCortez/13a0
**Deployment:** Vercel with automatic CI/CD on push to main
**Analytics:** Vercel Analytics (included free tier)

## Architecture

### Repository Structure

- **Public GitHub repository** (no secrets in repo)
- **Main branch** is production — every push deploys to jogue13a0.com.br automatically
- **Typical PR workflow** for any future contributors
- **README** documents setup, how to report bugs, feedback collection process
- **.gitignore** excludes node_modules, build artifacts, .env (if any)

### Deployment Pipeline

```
Commit to main → Git push → GitHub webhook → Vercel → Build + Deploy → jogue13a0.com.br
```

**Vercel handles:**
- Install dependencies (`npm install`)
- Build (`npm run build`)
- Serve static output (`adapter-static`)
- SSL/HTTPS automatically
- Preview deployments for any future PRs

**No custom CI/CD needed** — Vercel dashboard does everything.

### Domain Setup

1. Domain `jogue13a0.com.br` registered separately (outside Vercel)
2. Point nameservers to Vercel (or CNAME record)
3. Configure domain in Vercel project settings
4. SSL certificate auto-generated via Let's Encrypt

### Analytics Collection

**Vercel Analytics** (Web Analytics free tier):
- Auto-tracks page views, referrers, user agent, device
- Tracks Core Web Vitals (LCP, CLS, FID)
- Dashboard shows visitor count, feature usage patterns (via page routes)
- **Manual feedback collection:** Share a Google Form or Discord server link in `/sobre` page for friends to report bugs/suggestions

**No code changes needed** — add one line to `svelte.config.js` to enable.

## Pre-Deployment Checklist

Before first deploy:

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] README documents: setup, game rules, how to report bugs, feedback process
- [ ] Create GitHub repository (CheloCortez/13a0)
- [ ] Push all commits to main
- [ ] Connect Vercel project to GitHub repo (auto-deploy on push enabled)
- [ ] Configure domain `jogue13a0.com.br` in Vercel project
- [ ] Enable Vercel Analytics in Vercel dashboard
- [ ] Share link with friends alpha group
- [ ] Monitor first day for crashes/issues (check Vercel logs, collect manual feedback)

## Success Criteria

- ✅ Site live at jogue13a0.com.br
- ✅ All features from MVP working in production
- ✅ Analytics dashboard shows visitor activity
- ✅ Friends can access and play without errors
- ✅ Feedback collection mechanism in place (form/channel)

## Future Iterations (Post-MVP)

- Versioning/releases (GitHub Releases, tags)
- Changelog in README
- Staging environment if needed (separate Vercel project on develop branch)
- Enhanced feedback (Discord webhook, email notifications)
- Advanced analytics (custom events tracking)

## Known Limitations

- Cologne 2026 has provisional data; will be updated post-launch
- No admin panel for data updates — future feature
- All deployment is manual trigger (via git push); no scheduled tasks
