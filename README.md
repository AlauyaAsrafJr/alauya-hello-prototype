# Actibase Admin Module

Administration dashboard for Actibase — manage users, players, attendance
sessions, reports, and archived records. Implements the
[Admin Module design](https://claude.ai/design/p/5f49f0c0-d470-46ec-ab2c-a71c61eadfad)
as a React + TypeScript + Vite app.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```

## Structure

- `src/App.tsx` — top-level state and page routing
- `src/pages/` — Dashboard, Users, Players, Attendance, Reports, Archive, Settings
- `src/components/` — Sidebar, Topbar, Toast, and modal dialogs
- `src/data.ts` — mock data generators (users, players, sessions, reports, archive)
- `src/styles/tokens.css` — Modernist design system tokens and component classes
