# Campus Job Tracker

> Three things every job-hunting season generates — where you applied, what you got asked, and how your side projects are coming along — collected into one full-stack app that runs entirely on your machine.

A personal job-search management system with three modules — **applications**, **interview question bank**, and **project progress** — plus a dashboard that ties them together.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![SQLModel](https://img.shields.io/badge/SQLModel-SQLite-003B57?logo=sqlite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)

| | |
| --- | --- |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind, shadcn-style components. React Query for server state, dnd-kit for drag-and-drop, Recharts for the dashboard |
| **Backend** | FastAPI + SQLModel + SQLite — a single-file database, so backing up means copying one file |
| **Size** | 9 tables · 32 REST endpoints · 6 pages · ~6.7k lines (2.1k Python, 4.5k TS/TSX) |
| **Scope** | Single user, runs locally, no auth layer |

> **Note:** the UI labels and seed data are in Chinese — this was built for a Chinese campus recruiting season. The codebase, API, and this document are in English.

## Screenshots

<!-- Suggested: application board, question bank, dashboard. Put them in docs/screenshots/ -->

| Application Board | Question Bank | Dashboard |
| --- | --- | --- |
| _TBD_ | _TBD_ | _TBD_ |

---

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt -i https://pypi.org/simple
.venv/Scripts/python.exe seed.py          # optional: load sample data
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

API docs at <http://127.0.0.1:8000/docs>.

> If pip hangs on a 403, the Tsinghua mirror is rejecting pip's user agent. Add `-i https://pypi.org/simple` to go through the official index.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite already proxies `/api` to `127.0.0.1:8000`, so there is no CORS setup to do.

On Windows you can also just run `dev.ps1` in the repo root — it opens two windows and starts both halves.

Sample data:

```bash
cd backend
.venv/Scripts/python.exe seed.py --reset   # wipe, then reload sample data
.venv/Scripts/python.exe seed.py --clear   # wipe only, ready for real records
```

---

## Data model

Nine tables. The three domains stay separate, crossing only once — where a question points back at the application and interview round it came from.

```
application ──1:N──> application_event
     │                      │
     └──────────┬───────────┘
                │ (nullable FKs — nulled on delete, not cascaded)
             question ──N:M──> tag        (via question_tag_link)

project ──1:N──> milestone ──1:N──> task
   └────1:N──> dev_log
```

| Tables | Purpose |
| --- | --- |
| `application` / `application_event` | Application record plus its timeline of events |
| `question` / `tag` / `question_tag_link` | Question bank with many-to-many tags |
| `project` / `milestone` / `task` / `dev_log` | Projects, milestones, task board, dev journal |

Enums live in `models/enums.py`: 10 application stages, 10 event types, 8 question types. Two constant tables sit alongside them — `FUNNEL_ORDER` (the funnel's progression order; the talent-pool and rejected stages are terminal and stay out of it) and `STATUS_TO_EVENT` (which event type to record when a card is dragged into a given column).

---

## How each module works

### 1. Applications — a record plus an event stream

An application is not one row with a status. It is **one record plus a stream of timeline events**.

| Table | Holds |
| --- | --- |
| `application` | Company, role, type (internship / autumn / spring / experienced), channel, city, salary, JD link, referrer, applied date, current stage, notes |
| `application_event` | Round (applied / online test / 1st, 2nd, 3rd interview / HR round / offer / rejected / talent pool), outcome, timestamp, duration, interviewer, retrospective notes |

Three things fall out of that:

- **Board drag-and-drop.** Ten columns map to ten stages; dropping a card appends an event on the backend, so history is never overwritten.
- **Funnel and conversion rates.** The count at a stage is the number of applications whose timeline contains an event for it. The denominator is *the last stage anyone actually reached* — plenty of companies skip the third interview and go straight to HR, and a fixed denominator would drive every downstream rate to 0%.
- **Questions attached to a specific round.** `question.application_id` / `event_id` point back, which makes "this was asked in the second interview at ByteDance" a structured fact rather than a sentence buried in a notes field.

Deleting an application does not delete its questions — it only unlinks them.

### 2. Question bank — questions plus mastery

| Field | Notes |
| --- | --- |
| Type | Algorithm / fundamentals / project follow-up / system design / SQL / HR / brainteaser |
| Tags | Many-to-many, entered comma-separated; unknown tags are created on the fly |
| Prompt, my answer, reference answer | Three separate columns, so review puts "what I said" next to "what I should have said" |
| Code | Its own field plus a language, for pasting the accepted solution to a whiteboard problem |
| Difficulty 1–5 | How hard the question itself is |
| **Mastery 1–5** | How well I actually know it — editable by clicking the stars in the list |
| `need_review` | Set automatically when mastery ≤ 3, so "review queue only" surfaces the weak spots in one click |

Search covers the title, prompt, my answer, the reference answer, and the code.

> The natural next step is Anki-style spaced repetition: add `next_review_at` / `ease` / `interval` to `question`, schedule with SM-2, and add a flashcard page. The mastery field is the groundwork for it.

### 3. Project progress — milestones, board, journal

| Layer | Purpose |
| --- | --- |
| `project` | Name, one-line summary (the line that goes on a résumé), tech stack, repo and live URLs, start/end dates, status |
| `milestone` | A goal plus a due date; checks itself off when every task under it is done, and un-checks if any task moves back |
| `task` | A todo / doing / done board, draggable, with priority and due date |
| `dev_log` | One entry a day: what got done, where I am stuck, hours spent |

**Progress is not stored.** It is computed each time as completed tasks over total tasks, so a hand-maintained percentage can never drift from reality.

The dev journal records the process, but its real job is being a source of material when it is time to write the résumé.

### 4. Dashboard

Application funnel, applications over the last 12 weeks, interview conversion by channel, question distribution by type and mastery, most-used tags, per-project progress bars, hours logged this week.

The chart palette has been checked for color-vision deficiency and contrast, with separate light and dark sets. Re-run the check before changing colors.

---

## Decisions worth explaining

There is not much code here. The time went into these four calls:

1. **Why an application is not a single status field.** With only a `status` column, dragging a card from "2nd interview" to "HR round" erases the second interview — the retrospective, the interviewer, the duration, all gone. Modeled as an event stream, the status is just the latest item on the timeline: history survives for free, and the funnel has something to be computed from.
2. **Why the funnel denominator cannot be the previous stage.** Many companies skip the third interview entirely. Hard-code the denominator to "made it to round three" and every rate below it reads 0% the moment that stage is empty. The implementation walks back to the last stage anyone actually reached.
3. **Why deleting an application does not delete its questions.** Applications go stale; questions do not — "the one they asked in the second round at ByteDance" is still worth reviewing next year. So the foreign keys are nulled and the question stays in the bank.
4. **Why progress is not persisted.** A stored percentage will eventually disagree with the tasks it claims to summarize, so it is computed on read. Milestone completion is derived the same way, which is what lets it reverse when a task moves back.

---

## Layout

```
backend/
  app/
    models/      SQLModel table definitions (enums / application / question / project)
    schemas/     Pydantic request and response models
    routers/     applications / questions / projects / stats
    db.py        Engine and table creation
    main.py      App entrypoint + CORS
  seed.py        Sample data
  data/          Where the SQLite file lands
frontend/
  src/
    components/
      ui/           shadcn-style primitives
      applications/ Board, table, timeline, forms
      questions/    Question cards, forms
      projects/     Task board, milestones, journal
      dashboard/    Charts
    hooks/useApi.ts React Query wrapper; writes invalidate caches in one place
    lib/            API client, enum label maps, utilities
    pages/          Six pages
```

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/applications/board` | Board data, grouped by column |
| POST | `/api/applications/{id}/move` | Drop target: change stage, reorder, append event |
| POST | `/api/applications/{id}/events` | Add a timeline entry (advances the stage by default) |
| GET | `/api/questions` | Filter by keyword / type / tag / company / review queue / mastery ceiling |
| POST | `/api/questions/{id}/mastery` | Self-assess mastery; maintains the review flag |
| POST | `/api/projects/{id}/tasks/{tid}/move` | Task board drag-and-drop |
| GET | `/api/stats/dashboard` | Every aggregate the dashboard needs |

32 endpoints in total — see `/docs` for the full list.

---

## On AI-assisted development

This project was built with Claude Code. The split was roughly:

| | |
| --- | --- |
| **Mine** | Scope, data modeling and schema review, the state machine and conversion-rate semantics, edge cases (skipped rounds, keeping questions when an application is deleted, not persisting progress), integration and acceptance |
| **AI's** | Implementing against an agreed schema and API contract, boilerplate, component scaffolding, the seed script |

This section is not a disclaimer. It is here to make a point: **once generating code gets cheap, the value moves to the section above it.** Those four decisions are not ones an AI volunteers — left alone it will reach for a single status field, a fixed denominator, a cascading delete, and a stored progress percentage. Four for four.

---

## Possible next steps

- Spaced repetition for questions (SM-2) plus a flashcard page
- Markdown rendering and syntax highlighting (prompts and answers are plain text today)
- Pull commit counts for any project with a GitHub repo and draw a heatmap
- CSV export for applications, scheduled SQLite backups
- To put this on the public internet: add a JWT layer and move from SQLite to PostgreSQL
