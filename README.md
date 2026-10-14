# Lead Studio

A lead management and sales-preparation app built with Next.js, React, shadcn/ui, Tailwind, MongoDB, and the Anthropic Claude API.

You bring leads in from Sales Navigator (or any CRM) as CSV files. The app stores them, lets you search and filter, uses Claude to analyze each prospect, and generates email sequences, a sales pitch, and an outreach strategy. Everything can be exported as CSV.

## Features

| # | Feature | Where |
|---|---------|-------|
| 1 | Lead intake from Sales Navigator exports (manual CSV upload with column mapping) | `/import` |
| 2 | Dashboard: searchable, filterable, paginated leads; CSV export | `/dashboard`, `/leads` |
| 3 | AI analysis of the lead and company: pain points, challenges, buying signals, fit score | Lead detail → Analysis |
| 4 | Motivations, decision factors, and ethical persuasion strategies | Lead detail → Analysis |
| 5 | Personalized 4-email sequence (day 0, 3, 7, 14) with opt-out lines | Lead detail → Email sequence |
| 6 | Tailored sales pitch: approach, problems to highlight, value proposition, positioning, CTA | Lead detail → Sales pitch |
| 7 | Outreach strategy: best angle, channel, timing, opening lines, talking points, objections and responses | Lead detail → Outreach strategy |
| 8 | LinkedIn connection note (200 characters max) and 3 follow-up DMs, with copy buttons | Lead detail → LinkedIn |
| 9 | Export leads, analysis, sequences, and pitches to CSV (full or contacts-only) | `/api/export` |

Manual single-lead entry is at `/leads/new`. Your business context, which the AI uses, is set at `/settings`.

## Compliance: how leads get in

This app does **not** scrape LinkedIn or Sales Navigator. That violates LinkedIn's User Agreement and can get accounts restricted. The supported workflow is:

1. Find and save leads in Sales Navigator.
2. Export them (Sales Navigator's export, or your CRM's sync) to CSV.
3. Upload the CSV in **Import CSV**, review the column mapping and preview, then import.
4. Add contact details (email, phone) from a licensed enrichment provider or your own research.

Before sending any outreach, check the rules that apply to your recipients (for example GDPR/PECR for the EU and UK, CAN-SPAM for the US). Every email this app generates includes an opt-out sentence, but you are responsible for having a lawful basis, honoring opt-outs, and identifying yourself correctly. Use the **Do not contact** status for anyone who asks to be removed.

The AI is instructed not to invent facts, make unsupported claims, use false urgency or fake social proof, or exploit personal vulnerabilities. Still, review every email and pitch before you send it.

## Project structure

```
app/
  (app)/                 Authenticated pages (layout checks the session)
    dashboard/           Overview and pipeline stats
    leads/               List with search and filters; [id] detail; new
    import/              CSV upload wizard (client component)
    settings/            Business context used by the AI
  actions/               Server actions (import, CRUD, AI runs)
  api/export/route.ts    CSV download endpoint
  login/                 Sign-in page and actions (email + password, signed session cookie)
components/              App components (shell, badges, copy, forms)
  ui/                    shadcn/ui primitives (button, card, tabs, dialog, …)
lib/
  ai-schemas.ts          Zod schemas for AI output (validated before saving)
  ai-service.ts          Analysis and outreach orchestration (server only)
  claude.ts              Anthropic client with JSON validation and one repair retry
  prompts.ts             System prompts and guardrails
  import.ts              CSV column detection, normalization, dedupe (pure, tested)
  import-service.ts      Save leads with insert/update by dedupe key
  export.ts / csv.ts     CSV building with formula-injection protection
  queries.ts             Shared search/filter logic
  mongodb.ts             Shared MongoDB client, collections, and indexes
  session.ts / auth.ts   Session cookie (JWT) signing and the requireUser() helper
scripts/create-user.mjs  Create a login or reset its password
middleware.ts            Redirects anonymous users to /login
```

### Design decisions

- **Security:** Every query filters on the signed-in user's `user_id`, so each user only reads and writes their own documents. Passwords are hashed with bcrypt; sessions are HS256-signed JWTs in an httpOnly cookie, verified in middleware and on the server. The Claude API key never reaches the browser; all AI calls run in server actions. Server actions re-validate every import row instead of trusting the client.
- **Idempotent imports:** Leads are keyed on a normalized LinkedIn URL, then email, then name plus company. Re-importing an updated export refreshes profile fields but keeps your status, notes, and AI output.
- **Validated AI output:** Claude is asked for JSON, and the reply is checked against a Zod schema. If it fails, the app sends the validation errors back once for a repair. Nothing unvalidated reaches the database.
- **Prompt caching:** The system prompts are marked for caching to lower cost on repeat runs.
- **CSV safety:** Exported cells that start with `= + - @` are prefixed with an apostrophe to prevent spreadsheet formula injection. The export includes a UTF-8 BOM so Excel displays names correctly.

## Local setup

### 1. Get a MongoDB database

Use a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) (**Database → Connect → Drivers** gives you the connection string), or a local `mongod` at `mongodb://localhost:27017`. In Atlas, add your IP (and later your host's IPs) under **Network Access**.

Collections and indexes are created automatically on first use. There is no schema to run.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string. Server-only. |
| `MONGODB_DB` | Optional. Database name, defaults to `lead-studio`. |
| `AUTH_SECRET` | Random string of 32+ characters that signs session cookies. Server-only. Changing it signs everyone out. |
| `ANTHROPIC_API_KEY` | Claude API key. Server-only. |
| `CLAUDE_MODEL` | Optional. Defaults to `claude-sonnet-5-5`. Use `claude-opus-5-5` for deeper analysis at higher cost. |
| `NEXT_PUBLIC_APP_URL` | Optional. Used for links. |

### 3. Install, create your login, and run

```bash
npm install
npm run create-user -- you@example.com "a-strong-password"
npm run dev
```

Run `create-user` again with the same email to reset the password. Public sign-up is not needed for a single-owner tool.

Open http://localhost:3000, sign in, and fill in **Settings** first. The AI needs your services description to produce useful output.

### 4. Run tests and typecheck

```bash
npm run typecheck
npm test
```

## Using the app

1. **Settings:** Describe what you sell, your value propositions (only claims you can back up), your sender name, and your tone.
2. **Import:** In Sales Navigator, export your saved leads to CSV. Upload the file, check the column mapping, and import. Excel users can save as "CSV UTF-8".
3. **Leads:** Search and filter. Open a lead and click **Run analysis + outreach**. This takes 30 to 60 seconds.
4. **Review:** Read the analysis, edit outreach in your own tool if you wish, and copy the emails.
5. **Track:** Update the status and notes as you work each lead.
6. **Export:** Click **Export CSV (all data)** for leads with their AI output, or **contacts only** for a plain list.

## Deploying to Vercel

1. Push the project to GitHub.
2. In Vercel, click **Add New → Project** and import the repository. The framework is detected as Next.js.
3. Add the environment variables from `.env.example` under **Settings → Environment Variables**.
4. Deploy.
5. In MongoDB Atlas **Network Access**, allow connections from Vercel (Atlas's Vercel integration, or `0.0.0.0/0` with a strong database password).

Notes:
- `maxDuration = 60` on the lead detail page allows AI runs up to 60 seconds. On Vercel's Hobby plan the function limit may be lower, so use the Pro plan for reliable runs or move AI work to a background job (see below).
- Keep `MONGODB_URI`, `AUTH_SECRET`, and `ANTHROPIC_API_KEY` secret.

## Known limitations and next steps

- **Email sending is not built in.** The app generates and exports sequences for you to send from your own mailbox or sales tool. A sending integration (Gmail API, Resend, or Postmark) with a suppression check before each send is the natural next step.
- **Bulk analysis runs one lead at a time.** For large batches, move the analysis into a queue (Inngest, Trigger.dev, or Vercel Queues) so it runs in the background.
- **Contact enrichment** (emails, phone numbers) is manual. You can connect a licensed provider such as Apollo, Lusha, or Cognism later.
- **Excel files** must be saved as CSV first. Only `.csv` is accepted in the uploader.
- **Single-owner by default.** Team roles would need a `team_id` field and query changes.
