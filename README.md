# EPM – Employee Portal Management

EPM is Ionixx's internal employee portal. Employees use it for day-to-day self-service (attendance, time tracking, leave, pay, tasks and documents). Managers, HR, executives, office admins and system admins each get extra screens for their role.

The app is a React single-page application built with Vite. Most screens run on sample data stored in the browser (`localStorage`), so you can try every role without a backend.

## Features

| Area | What it covers |
| --- | --- |
| **Dashboard** | Quick stats, quick actions, notifications, recent activity, upcoming events and celebrations |
| **Profile** | Personal, job and contact details, plus profile photo upload |
| **Attendance** | Check-in/check-out, attendance calendar and recent attendance |
| **Time Tracker** | Timer, time entries, today's tasks and a weekly time-per-project chart |
| **Leave Tracker** | Leave balances, apply leave, leave calendar and history, restricted holidays; leave types include Compensatory Off, Bereavement and Sabbatical leave |
| **Pay & Tax** | Payslips, tax summary, declarations, tax planner and reimbursements |
| **Tasks** | Projects, sprints, board/list views, templates, automation rules, bulk actions, reports and Excel export |
| **Files** | Personal, department and company documents: upload, view, download and delete |
| **Organization** | Org chart, departments and employee directory |
| **Service Desk** | Raise and track requests; admins work the queue, asset log, expenses and desk reports |
| **Manager (MSS)** | Team overview, approvals, attendance monitoring and performance reviews |
| **HR** | Employee management, recruitment, training and compliance |
| **Executive** | Analytics and KPI monitoring |
| **System Admin** | User management, roles and permissions, system configuration, integrations and logs |

## Roles and demo logins

The login screen checks credentials against the mock users in [`src/lib/mock-users.ts`](src/lib/mock-users.ts). Each role sees its own sidebar menu and can open only the routes allowed for it there (`ROLE_SIDEBAR_ITEMS` and `ROLE_ROUTE_ACCESS`).

| Role | Login ID | Password |
| --- | --- | --- |
| Employee | `employee` | `employee123` |
| Project Manager | `pm` | `pm123` |
| HR | `hr` | `hr123` |
| Admin (office operations) | `admin` | `admin123` |
| System Admin | `sysadmin` | `sysadmin123` |
| Executive | `executive` | `executive123` |

You can also log in with the user's email address (for example `employee@ionixx.com`). These accounts are for development only.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 12 (`corepack enable` picks up the version pinned in `package.json`)

### Install and run

```bash
git clone <repository-url>
cd ionixx_protal_react
pnpm install
pnpm dev
```

The dev server opens at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Vite dev server on port 3000 |
| `pnpm build` | Build for production into `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | Run the TypeScript compiler (`tsc -b`) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the Jest test suite |
| `pnpm test:watch` | Run Jest in watch mode |

## Tech stack

- **Framework:** React 19, TypeScript, Vite 6
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 3, Radix UI primitives (shadcn/ui style components in `src/components/ui`), lucide-react icons
- **Forms and validation:** React Hook Form + Zod
- **Data:** TanStack Query, Axios
- **Other:** dnd-kit (drag and drop), sonner (toasts), write-excel-file (Excel export)
- **Testing:** Jest, ts-jest, React Testing Library

## Project structure

```
src/
├── App.tsx                 # Route table; every page is wrapped in ProtectedRoute
├── main.tsx                # App entry point and providers
├── components/
│   ├── auth/               # ProtectedRoute / PublicRoute guards
│   ├── auth-component/     # Login and forgot-password screens
│   ├── common-component/   # Dashboard and reports (shared by roles)
│   ├── employee-component/ # Self-service modules (attendance, leave, pay, tasks, files…)
│   ├── project_manager-component/
│   ├── hr-component/
│   ├── executive-component/
│   ├── admin-component/    # Service desk
│   ├── system_admin-component/
│   ├── layout/             # Header, sidebar and page layout
│   └── ui/                 # Reusable UI components
├── context/                # Auth, attendance and global React contexts
├── hooks/                  # Shared hooks
├── lib/                    # Business logic, routes, mock users, permissions, sample data
├── services/
│   ├── apis/               # Per-module services and React Query hooks
│   ├── axios/              # Axios instance (backend base URL and auth token)
│   └── storage/            # localStorage wrapper
└── types/                  # Shared TypeScript types
```

## Backend and environments

The Axios client in [`src/services/axios/axios.ts`](src/services/axios/axios.ts) holds the backend base URL. Dev is active by default, and the QA and UAT URLs are commented out below it. To point the app at another environment, change `baseURL` there.

## Deployment

`pnpm build` writes a static site to `dist/`. [`public/_redirects`](public/_redirects) sends every path to `index.html` so client-side routes work on Netlify-style hosts.
