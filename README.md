# Marketly AI

Marketly AI is a luxury AI SaaS workspace for creating premium product advertisement assets. The flagship Creator Studio combines a product image with a reference advertisement and uses FLUX.2-Klein-LoRA-Studio through HuggingFace/Gradio to preserve the original campaign scene while swapping in the target product.

## Features

- AI Product Advertisement Studio with product and reference image upload
- Scene-preserving prompt workflow for luxury commercial ad visuals
- Dashboard, analytics, campaign generation, storyboard, video generation, and AI assistant surfaces
- Server-side HuggingFace/Gradio inference integration
- ImageKit-backed generated asset persistence
- Auth, AI memory, analytics, and generation history foundations
- Reusable shadcn/ui-inspired primitives, shared loading states, empty states, and responsive app shell

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- TailwindCSS 4
- shadcn/ui-style primitives
- TanStack Query
- Zustand
- MongoDB with Mongoose
- HuggingFace and Gradio Client
- ImageKit

## Project Structure

```txt
src/
  app/                 App Router pages and API routes
  components/          Shared layout, UI primitives, and reusable presentation components
  features/            Domain modules for creator studio, analytics, auth, dashboard, and more
  hooks/               Cross-feature React hooks
  lib/
    api/               Reusable API clients and external integration adapters
    constants/         Shared product constants and navigation metadata
    utils.ts           Framework-agnostic utility helpers
  server/              Server-only services, schemas, security, database, and AI orchestration
  services/            Client/server orchestration services used across feature boundaries
  store/               Global UI state
  types/               Shared TypeScript types
```

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` and sign in to access the product workspace.

## Environment Variables

Create `.env.local` from `.env.example` and provide the values needed for your environment.

```bash
HF_TOKEN=
HUGGINGFACE_API_KEY=
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

`HF_TOKEN` is used server-side for the FLUX.2-Klein-LoRA-Studio Gradio Space. Secrets are intentionally not exposed to the browser.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Screenshots

Screenshots can be added under `public/stitch/screenshots/` for:

- Dashboard
- Creator Studio
- Campaign Generator
- Storyboard
- Video Generator
- Analytics
- AI Assistant

## Roadmap

- Persistent project and brand workspaces
- Team collaboration and approval workflows
- Production billing and subscription tiers
- Model routing across FLUX, SDXL, and brand-tuned providers
- Asset versioning, campaign experiments, and performance feedback loops
- Automated regression tests for API routes and generation workflows
