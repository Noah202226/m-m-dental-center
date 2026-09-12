# M&M Dental Center — UI/UX Design System Specification

## 1. Design Tokens & Theme Specification

The application uses an adaptive CSS variable token system configured in `app/globals.css`. Both Light Mode and Dark Mode are fully supported and dynamically toggled via the `data-theme` attribute on the root HTML element.

### Token Mapping

| Token Variable | Light Mode (Default) | Dark Mode (`.dark` / `[data-theme="dark"]`) | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `210 20% 98%` (Soft slate) | `240 10% 4%` (`#09090b` obsidian) | Page background |
| `--foreground` | `222 47% 11%` (Deep navy) | `0 0% 98%` (Off-white) | Primary text color |
| `--card` | `0 0% 100%` (Pure white) | `240 8% 7%` (`#111114` card surface)| Card / Container surface |
| `--card-foreground`| `222 47% 11%` | `0 0% 98%` | Card body text |
| `--primary` | `45 93% 47%` (`#EAB308` Amber) | `45 93% 47%` (Amber-500) | Brand accent |
| `--primary-foreground`| `26 83% 14%` | `0 0% 0%` | Text on brand buttons |
| `--secondary` | `210 40% 96.1%` | `240 4% 16%` | Subtle background buttons |
| `--muted` | `210 40% 96.1%` | `240 4% 16%` | Neutral gray pill backings |
| `--muted-foreground` | `215 16% 47%` | `240 5% 65%` | Helper text & inactive labels |
| `--border` | `214 32% 91%` | `240 4% 16%` | Standard component borders |
| `--ring` | `45 93% 47%` | `45 93% 47%` | Focus ring indicator |

---

## 2. Core Primitives Reference (`app/components/ui/`)

### 1. `Button` (`Button.jsx`)
Powered by `class-variance-authority` (cva) and `cn()`.
```jsx
import { Button } from "@/app/components/ui/Button";

// Primary Brand Button with loading spinner support
<Button variant="default" size="default" loading={isSaving} onClick={handleSave}>
  Save Changes
</Button>

// Secondary / Outline Actions
<Button variant="outline" size="sm" onClick={handleCancel}>
  Cancel
</Button>

// Destructive Action
<Button variant="destructive" size="sm" onClick={handleDelete}>
  Delete Record
</Button>
```

### 2. `Card` (`Card.jsx`)
Structured container for grouping information.
```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/Card";

<Card className="hover:border-amber-500/30 transition-colors">
  <CardHeader>
    <CardTitle>Total Revenue</CardTitle>
    <CardDescription>Current month gross billings</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">₱45,000</div>
  </CardContent>
</Card>
```

### 3. `Dialog` (`Dialog.jsx`)
Accessible modal dialog built on `@radix-ui/react-dialog`. Automatically handles focus management, keyboard escape, backdrop blur, and smooth entrance/exit animations.
```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/Dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Form or modal contents */}
  </DialogContent>
</Dialog>
```

### 4. `Badge` (`Badge.jsx`)
Status indicators and tags.
```jsx
import { Badge } from "@/app/components/ui/Badge";

<Badge variant="default">Amber Brand</Badge>
<Badge variant="success">Paid in Full</Badge>
<Badge variant="warning">Installment Active</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="outline">Consultation</Badge>
```

### 5. `CommandPalette` (`CommandPalette.jsx`)
Accessible quick action and global search bar triggered via `Ctrl+K` or `Cmd+K`.
```jsx
import { CommandPalette } from "@/app/components/ui/CommandPalette";

<CommandPalette
  open={cmdOpen}
  onOpenChange={setCmdOpen}
  onSelectAction={(type, payload) => handleAction(type, payload)}
  patients={patientsList}
/>
```

---

## 3. Recipe: Creating a New Dashboard View

When creating a new feature module (e.g. `Appointments.jsx` or `Inventory.jsx`):
1. **Container Structure**:
   ```jsx
   <div className="space-y-6">
     {/* Page Header */}
     <div className="flex items-center justify-between">
       <div>
         <h2 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
           Feature Title
         </h2>
         <p className="text-xs text-[hsl(var(--muted-foreground))]">
           Descriptive subtitle explaining this view
         </p>
       </div>
       <Button onClick={() => setOpen(true)}>+ New Item</Button>
     </div>

     {/* Content Grid or Table */}
     <Card>
       <Table>...</Table>
     </Card>
   </div>
   ```
2. **Never hardcode inline styles** or dark-only classes like `bg-black`.
3. **Always pair inputs with labels** and wrap modal operations with `Dialog`.
