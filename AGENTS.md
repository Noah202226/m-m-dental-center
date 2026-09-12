# M&M Dental Center - Engineering & AI Agent Guidelines

## 1. Project Overview & Architecture
**M&M Dental Center** is a modern dental practice management web application built with:
- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI Library**: React 19 + Tailwind CSS v4 + DaisyUI plugins
- **Design Standard**: Radix UI + shadcn/ui component architecture
- **State Management**: Zustand modular stores (`app/stores/`)
- **Backend & Auth**: Appwrite Cloud (Databases, Collections, User Session Tokens)
- **Exports**: jsPDF & autoTable with bundled font (`Roboto-font.js`)

---

## 2. Mandatory UI/UX & Design System Standards

### Rule 1: Zero Hardcoded Colors
- **NEVER** use hardcoded color styles such as `bg-black`, `bg-gray-900`, `text-gray-200`, or raw hex codes like `#1f0202`.
- **ALWAYS** use semantic CSS variable tokens:
  - `bg-[hsl(var(--background))]` - Global background (adaptive light/dark)
  - `bg-[hsl(var(--card))]` / `border-[hsl(var(--border))]` - Card containers and surfaces
  - `text-[hsl(var(--foreground))]` - High-contrast text
  - `text-[hsl(var(--muted-foreground))]` - Subtitles, helper descriptions, and labels
  - `amber-500` / `amber-400` - Primary brand accent (M&M Gold)
  - `emerald-500` / `red-500` - Semantic indicators (Success/Paid vs. Destructive/Debt)

### Rule 2: Reusable UI Primitives First
Always check and import from `app/components/ui/` before introducing any new component markup:
- **Buttons**: `<Button variant="default | outline | secondary | ghost | destructive" size="sm | default | lg" loading={boolean}>`
- **Cards**: `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>`
- **Modals & Dialogs**: `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>` (Powered by `@radix-ui/react-dialog`, NEVER native `<dialog id="...").showModal()`)
- **Badges**: `<Badge variant="default | secondary | success | warning | destructive | outline">`
- **Inputs**: `<Input type="..." placeholder="..." />`
- **Tables**: `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>`
- **Command Palette**: `<CommandPalette />` for `Ctrl+K` global quick navigation and patient search

### Rule 3: Responsive & Accessible Layouts
- All master-detail views (e.g., Patients, Treatment Records) must provide a dual-pane workspace on `md:` breakpoints and a seamless modal/drawer experience on mobile viewports.
- Inputs must have clear label associations and visible focus rings (`focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]`).

---

## 3. Directory Conventions

```plaintext
app/
├── components/
│   ├── ui/                    # Reusable Radix/shadcn design primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Dialog.jsx
│   │   ├── Badge.jsx
│   │   ├── Input.jsx
│   │   ├── Table.jsx
│   │   └── CommandPalette.jsx
│   ├── dashboard/             # Dashboard feature tabs
│   │   ├── DashboardData.jsx  # KPI metrics & period breakdowns
│   │   ├── Patients.jsx       # Patient directory & master-detail ledger
│   │   ├── Products.jsx       # Dental inventory
│   │   ├── Reports.jsx        # Collections & expense reporting
│   │   └── actions/           # Feature-specific modals and panels
│   └── layout/                # Global layout wrappers & theme providers
├── lib/
│   ├── utils.js               # cn() class merger
│   └── appwrite.js            # Appwrite SDK client
└── stores/                    # Zustand stores
```

---

## 4. Documentation References
For detailed design tokens, component APIs, and recipes, see:
- [UI/UX Design System Guide](file:///.agents/context/ui-ux-design-system.md)
