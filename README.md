# LoanLoop

**Borrow from your building.** LoanLoop is a trust-first lending shelf for apartment communities. Instead of buying a ladder, a drill, or a tent for one weekend, neighbours can borrow what is already a few doors away.

Built for the **Appwrite Databases Hackathon** with **Appwrite TablesDB + Gemini + Next.js**.

---

## What it does

- **A shared shelf per building.** Residents list tools, kitchen gear, camping equipment, books, and more.
- **A race-safe request flow.** Requesting an item stages `available → requested` inside a TablesDB transaction. Two neighbours cannot claim the same item.
- **Approve, decline, cancel, return.** Every transition is transactional and writes an audit event.
- **Trust that means something.** Start at 50. On-time returns add 5. Late returns cost 2 points per day, capped at −10 per loan. Scores are clamped to 0–100.
- **Private contact details.** Email addresses unlock only for the two people on an active or overdue loan.
- **A grounded AI assistant.** Gemini embeds item descriptions into TablesDB and finds things by meaning, then answers using only the building's real shelf.
- **Demo mode.** The full UI works locally with seeded Sunshine Apartments fixtures and no cloud credentials.

---

## Stack

- **Next.js 16.4** (App Router, Route Handlers, React 19)
- **Appwrite TablesDB** for every row, relationship, permission, and transaction
- **Appwrite Auth** (email/password) and **Appwrite Storage** for item photos
- **Gemini** for embeddings (`embedding` vector on each item) and the assistant
- **Bun** for installs and scripts
- **Tailwind CSS 4**, Geist Sans, Instrument Serif

There is exactly **one Appwrite database** (`loanloop`) and five tables: `profiles`, `items`, `loans`, `loan_events`, `notifications`.

---

## Run locally

```bash
bun install
cp .env.example .env.local
# fill in the Appwrite project values, API key, and Gemini key
bun run setup   # database, bucket, tables, columns, relationships, indexes
bun run seed    # Sunshine Apartments users, items, loans, events, alerts
bun run dev
```

Open <http://localhost:3000>.

In the Appwrite console, add a **Web platform** for `localhost` (Project Settings → Platforms). The browser talks to Appwrite directly with the Web SDK, so an unregistered origin is blocked by CORS. Add your Vercel hostname the same way before deploying.

`bun run setup` is idempotent: it reuses the existing database, bucket, tables, columns, and indexes. It never creates a second database.

### Seeded accounts

All four accounts use the password from `SEED_PASSWORD` (default shown below):

| Account | Email | Role in the demo |
| --- | --- | --- |
| Aisha Rao | `aisha@example.com` | Main account: borrower, lender, 72 trust |
| Rohan Mehta | `rohan@example.com` | Requests Aisha's pressure cooker |
| Maya Iyer | `maya@example.com` | Lends the tent |
| Dev Shah | `dev@example.com` | New neighbour |

Use Aisha for the demo: approve Rohan's request. Sign out and use Rohan's seed account to see the borrower's view and the contact details unlocked by the active loan.

### No Appwrite credentials?

Do nothing. When `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` are missing, the app automatically runs in local demo mode. Data is stored in `localStorage`, the same Sunshine Apartments fixtures are used, and the full request → approve → return flow works. Demo mode enters as Aisha; the four-account switchover above applies to a seeded Appwrite project.

You can also force it:

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Appwrite schema

| Table | Key columns | Row permissions |
| --- | --- | --- |
| `profiles` | `display_name`, `locality`, `trust_score`, `completed_loans` | Any signed-in neighbour |
| `items` | `title`, `status`, `owner_id`, `embedding`, `search_text` | Any signed-in neighbour |
| `loans` | `item_id`, `owner_id`, `borrower_id`, `status`, `due_at` | The owner and borrower only |
| `loan_events` | `loan_id`, `type`, `actor_id`, `note` | The loan's owner and borrower |
| `notifications` | `user_id`, `type`, `title`, `body`, `read` | The notified user |

Relationships: `items.owner → profiles`, `loans.item → items`, `loans.owner/borrower → profiles`, `loan_events.loan → loans`.

All writes go through Next.js Route Handlers. The browser signs in with the Appwrite Web SDK, sends a JWT, the server verifies the JWT, and then uses an admin API key for writes. Clients read rows directly from TablesDB under the row permissions above.

The race guard is a TablesDB transaction: stage the item status change, create the loan, event, and notification, then commit. A conflicting claim returns `409`.

Uploaded item photos are **public-read at the file level** with an unguessable file ID. Appwrite Cloud serves files from a different origin than the app, so an authenticated `<img>` request cannot carry the Appwrite session; public file reads are the simple, reliable way to render them from Vercel. Profile rows, emails, loans, events, and notifications remain protected by row permissions, and emails are only released by the contact endpoint for active loan parties.

---

## Gemini

- **Embeddings** are generated when an item is listed or edited and stored in `items.embedding`. `gemini-embedding-001` is used with 768 dimensions and `RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY` task types.
- The assistant embeds the neighbour's question, ranks available items by cosine similarity, and asks **Gemini 3.8 Flash** to answer from that shortlist. The request uses low thinking and JSON output.
- If Gemini is not configured or fails, the app falls back to keyword ranking, so the shelf and request flow never break.

Set `GEMINI_API_KEY`. Models can be changed with `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL`. `gemini-3.8-flash` is the stable default; Gemini 2.5 Flash is retired for new projects. The key is sent as an `x-goog-api-key` header, never in the URL.

---

## Tests and checks

```bash
bun run test
bunx tsc --noEmit
bun run lint
bun run build
```

The 15 unit tests cover trust scoring and IST end-of-day due-date validation in `src/lib/trust.test.ts` and `src/lib/validation.test.ts`.

---

## Deploy

1. Add the production hostname (for example `loanloop.vercel.app`) as a **Web platform** in the Appwrite project. Without it, Web SDK reads and sign-in fail with a CORS/platform error.
2. Import the repo into Vercel.
3. Add every variable from `.env.example` in Project Settings → Environment Variables, including `NEXT_PUBLIC_DEMO_MODE` unset or `false`.
4. Add `CRON_SECRET` and set the same value in Vercel.
5. Deploy. `vercel.json` schedules `/api/cron/overdue` once a day; Vercel sends the `CRON_SECRET` as a Bearer token.
6. Run `bun run setup` and `bun run seed` once against the production project, from your machine, with the production env values.

`NEXT_PUBLIC_*` values are baked in at build time. If you add or change them in Vercel, redeploy.

`bun run cron` manually triggers the overdue scan against `APP_URL`.

---

## Open-source libraries

- [Next.js](https://nextjs.org) — React framework and route handlers
- [React](https://react.dev) — UI runtime
- [Appwrite](https://appwrite.io) — Auth, TablesDB, Storage (Web + Node SDKs)
- [Google Gemini API](https://ai.google.dev) — embeddings and grounded assistant
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [Sonner](https://sonner.emilkowal.ski) — toasts
- [Zod](https://zod.dev) — request validation
- [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) — class composition
- [Vitest](https://vitest.dev) — unit tests
- [Geist](https://vercel.com/font) + [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) — type

Seed photo credits and licenses are in [`public/seed/CREDITS.md`](public/seed/CREDITS.md).

---

## The 2-minute demo path

1. Land on the warm, quiet home page and enter **Sunshine Apartments**.
2. Aisha's shelf: browse the ladder, projector, and books.
3. Ask the assistant: *“I need something for a movie night.”*
4. Open Rohan's pending pressure-cooker request and approve it.
5. Return to the shelf; the cooker is now on loan. Show the audit trail.
6. Switch to Rohan: the contact details are unlocked only because the loan is active.
7. Mark it returned and show the trust score change.

---

## License

MIT. See [`LICENSE`](LICENSE). Seed photo credits and licenses are listed in
[`public/seed/CREDITS.md`](public/seed/CREDITS.md).
