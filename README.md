# Marriage Mode

Marriage Mode by **Upfront Consulting with Tiff & Reco LLC**: a free, private
checklist that helps people who just committed to one partner close old
dating accounts, cancel the billing and stop the emails. Each person cleans up
their own accounts and chooses what to share with their partner. No
surveillance.

| Folder | What |
|---|---|
| `HUB.md` | **Tiffany's hub: to-do steps, links, done log** |
| `docs/` | Plan of record. Start with [`docs/00-FOUNDER-BRIEF.md`](docs/00-FOUNDER-BRIEF.md) |
| `app/` | Next.js MVP (static, deploys free to Netlify) |
| `supabase/` | Production database schema and RLS isolation tests |

```bash
cd app && npm install && npm run dev   # local
npm test && npm run typecheck && npm run build
```
