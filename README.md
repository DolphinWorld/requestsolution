# RequestSolution

A community-driven platform where users submit product ideas, AI generates structured specifications (features + tasks), and the community validates, discusses, and builds together.

## Features

- **AI-Powered Specs** — Submit a vague idea, get a structured spec with features, tasks, effort estimates, and open questions
- **Community Validation** — Upvote ideas, comment, and discuss
- **Developer Collaboration** — Claim tasks, link GitHub PRs/repos, track progress
- **Similar Ideas** — Embedding-based similarity detection to surface related ideas
- **No Login Required** — Cookie-based anonymous identity

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- SQLite + Prisma ORM v7
- OpenAI-compatible API (works with OpenAI, Ollama, OpenRouter, etc.)

## Getting Started

```bash
# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your LLM API endpoint and key

# Initialize the database
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `OPENAI_API_BASE_URL` | OpenAI-compatible API base URL | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | API key | `sk-...` |
| `OPENAI_MODEL` | Model for spec generation | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Model for embeddings | `text-embedding-3-small` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |

## License

This project is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

You may not use this project for commercial purposes without explicit permission.
