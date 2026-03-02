# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RequestSolution** (community-demand-board) is a community-driven platform where users submit product ideas that get transformed into structured specs via AI. Users can upvote, comment, claim tasks, and link GitHub PRs. No authentication — all identity is cookie-based and anonymous.

## Common Commands

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run lint          # Run ESLint
npm run db:push       # Push Prisma schema changes to database (use after schema edits)
npm run db:studio     # Open Prisma Studio UI for database inspection
npm run prisma:generate  # Regenerate Prisma client (use after schema edits)
```

## Environment Setup

Copy `.env.example` to `.env`. Key variables:

```
OPENAI_API_BASE_URL=  # OpenAI-compatible endpoint (supports Ollama, OpenRouter, etc.)
OPENAI_API_KEY=       # API key
OPENAI_MODEL=         # Model for spec generation (e.g. gpt-4o-mini)
OPENAI_EMBEDDING_MODEL=  # Model for embeddings (e.g. text-embedding-3-small)
DATABASE_URL=         # SQLite file path (e.g. file:./dev.db)
```

Initial database setup: `npx prisma db push`

## Architecture

**Stack:** Next.js 16 App Router + TypeScript, Tailwind CSS v4, SQLite + Prisma ORM v7, OpenAI-compatible SDK

### Core Data Flow

1. User submits idea → `POST /api/ideas` → Zod validation → rate limit check
2. LLM generates structured JSON spec (title, problemStatement, tags, features, tasks, openQuestions)
3. Idea + tasks saved in DB transaction; embedding generated asynchronously for similarity search
4. Idea detail page (`/ideas/[id]`) shows full spec + similar ideas via cosine similarity on embeddings

### Key Directories

- `app/` — Next.js App Router pages and API routes
- `components/` — React client components (Navbar, IdeaCard, TaskList, CommentSection, UpvoteButton)
- `lib/` — Shared utilities: `prisma.ts`, `llm.ts`, `embedding.ts`, `prompts.ts`, `validators.ts`, `rate-limit.ts`, `hot-score.ts`, `anon-id.ts`
- `prisma/` — Schema and migrations; generated client goes to `generated/`

### Anonymous Identity

Middleware (`middleware.ts`) sets a `anon_id` UUID cookie on every request. API routes call `getAnonId()` from `lib/anon-id.ts` to identify the user. All votes, claims, and comments are tagged with `anonId`. No login/session system exists.

### AI Integration

- `lib/llm.ts` — OpenAI client singleton configured from env vars
- `lib/prompts.ts` — System prompt + user prompt builder for spec generation
- `lib/embedding.ts` — `generateEmbedding()`, `cosineSimilarity()`, `findSimilarIdeas()` (threshold: 0.3, top 5)
- Spec generation includes retry logic; output validated against Zod `specSchema` in `lib/validators.ts`

### Rate Limiting

In-memory rate limiting in `lib/rate-limit.ts` (Map-based, not persisted across restarts):
- 5 submissions per user (anonId) per hour
- 10 submissions per IP per hour

### Hot Score Algorithm

`lib/hot-score.ts`: `log10(upvotes + 1) - age_in_days / 24` — used for "hot" sort on the homepage.

### Database Schema (SQLite via Prisma)

Core models: `Idea`, `Task`, `TaskLink`, `Comment`, `Vote`, `AnonUser`

- `Idea.embedding` stored as JSON float array
- `Idea.tags`, `Idea.features`, `Idea.openQuestions` stored as JSON
- `Task.effort` enum: S | M | L | XL
- `Task.status` enum: open | in_progress | done
- `Vote` uses composite PK (`ideaId` + `anonId`)

### Deployment

The app targets both Railway (standard Node) and Hugging Face Spaces (port 7860). The Dockerfile is multi-stage; it runs `prisma db push` on startup and stores the SQLite DB at `/app/data/prod.db` in production.
