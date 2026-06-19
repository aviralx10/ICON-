# ICON Casebook Platform

A multi-tenant casebook platform for consulting clubs at IIM Bangalore. Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- Multi-tenant architecture with per-tenant roles
- Case browsing with full-text search, filtering by category/company/difficulty
- Role-based access: Student, Editor, Admin, Owner
- Editor dashboard for case creation and management
- Mentor directory with Cal.com booking integration
- Admin panel for member, category, and company management
- Magic link authentication restricted to @iimb.ac.in emails
- Row Level Security on all tables

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy and configure environment variables:

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase project credentials
```

3. Run the database migration (`supabase/migrations/001_initial_schema.sql`) in your Supabase SQL editor.

4. Start the dev server:

```bash
npm run dev
```

## Project Structure

```
src/
  app/
    auth/           # Login, callback, server actions
    [tenant]/       # Tenant-scoped: cases, editor, mentors, admin
  components/       # App shell, case card/grid, filter panel, mentor card
    ui/             # shadcn/ui primitives
  hooks/            # use-toast
  lib/
    services/       # cases, categories, companies, memberships, mentors, search, usage
    supabase/       # Browser/server/middleware clients
  types/            # TypeScript interfaces for all DB tables
supabase/
  migrations/       # SQL schema with RLS policies
```

## Tech Stack

Next.js (App Router) / TypeScript / Tailwind CSS / shadcn/ui / Supabase / Zod
