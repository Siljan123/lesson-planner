# UI Theme Guide — for AI assistants working on this codebase

This file exists so an AI (Claude Code, Copilot, etc.) generates UI that matches the existing system instead of inventing new colors, spacing, or components. **Read this before writing any component or page markup.**

> Assumption: this follows the same shadcn-vue + Tailwind v4 setup already used in the SFADS and monorepo projects (shared layer, `node-linker=hoisted`). Swap the palette section if the Lesson Plan Docs Generator gets its own brand direction.

---

## 1. Foundations

- **Component library:** shadcn-vue (Radix Vue primitives + Tailwind). Components live in `shared/components/ui/*` inside the Nuxt layer and are consumed via auto-import — **never** hand-roll a button, input, dialog, etc. If a needed variant doesn't exist, extend the existing component's `class-variance-authority` (`cva`) config rather than writing a one-off styled element.
- **Styling engine:** Tailwind CSS v4. Theme is declared via CSS custom properties in `assets/css/main.css` (or the layer's global stylesheet) using the `@theme` directive — not a `tailwind.config.js` color object.
- **Icons:** `@lucide/vue` (matches existing usage, e.g. `Radio`, `HeartPulse`, `ShieldAlert` in the SFADS emergency module). Don't mix in a second icon set.
- **No inline hex values in markup or component `<style>` blocks.** Every color reference goes through a CSS variable / Tailwind token below. If a needed color doesn't exist as a token, add it to the theme file — don't hardcode.

---

## 2. Color Tokens

shadcn's theming model: every semantic role is a CSS variable, referenced in Tailwind as `bg-background`, `text-foreground`, `border-border`, etc. Light/dark values are swapped by toggling the `.dark` class on `<html>`.

| Token | Role | Light (suggested) | Dark (suggested) |
|---|---|---|---|
| `--background` | Page background | `oklch(0.99 0 0)` | `oklch(0.16 0 0)` |
| `--foreground` | Default text | `oklch(0.18 0 0)` | `oklch(0.95 0 0)` |
| `--primary` | Primary actions (Generate, Save, Export) | `oklch(0.48 0.13 152)` — a calm education-appropriate green | `oklch(0.62 0.13 152)` |
| `--primary-foreground` | Text on primary | `oklch(0.99 0 0)` | `oklch(0.15 0 0)` |
| `--secondary` | Secondary buttons, chips | `oklch(0.95 0.01 152)` | `oklch(0.24 0.01 152)` |
| `--muted` | Subtle backgrounds (cards, table stripes) | `oklch(0.96 0 0)` | `oklch(0.22 0 0)` |
| `--muted-foreground` | Secondary text | `oklch(0.48 0 0)` | `oklch(0.65 0 0)` |
| `--accent` | Hover states, highlighted rows | `oklch(0.94 0.03 152)` | `oklch(0.28 0.03 152)` |
| `--destructive` | Delete, discard, validation errors | `oklch(0.55 0.22 25)` | `oklch(0.65 0.22 25)` |
| `--border` | Borders, dividers | `oklch(0.9 0 0)` | `oklch(0.3 0 0)` |
| `--ring` | Focus ring | same as `--primary` | same as `--primary` |
| `--radius` | Base corner radius | `0.5rem` | — |

**Status colors** (not part of core shadcn tokens, but needed for lesson-plan statuses — define alongside the above):

| Status | Token name | Use |
|---|---|---|
| Draft | `--status-draft` (neutral grey) | AI-generated, not yet reviewed |
| Needs review | `--status-review` (amber) | Teacher is editing |
| Ready | `--status-ready` (green) | Approved, ready to export |
| Exported | `--status-exported` (blue) | DOCX/PPTX generated |

Use these for `Badge` variants on lesson plan cards/lists — don't reuse `--destructive`/`--primary` for status meaning that isn't actually an error or a primary action.

---

## 3. Typography

- **UI font:** Inter (or the existing project default if one is already set in `main.css` — check before adding a new `@font-face`).
- **Scale:** stick to Tailwind's default type scale (`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`) — don't introduce arbitrary `text-[17px]` values.
- **Weights:** `font-medium` for labels and button text, `font-semibold` for headings, `font-normal` for body copy. Avoid `font-bold` except for page-level `<h1>`.
- **Lesson-plan content itself** (the generated ILAW sections shown in the editor) should render in a slightly larger, more readable size (`text-base` minimum, `leading-relaxed`) since teachers will be reading and editing dense paragraphs — don't compress it to `text-sm` to save space.

---

## 4. Layout & Spacing

- Base spacing unit is Tailwind's default `4px` scale — use `gap-4`, `p-6`, `space-y-2`, etc. Don't invent custom spacing values.
- Cards (`Card`, `CardHeader`, `CardContent`) use `rounded-[var(--radius)]` and `border-border` — this is set once at the component level; don't override radius per-instance unless there's a real hierarchy reason.
- Forms: use shadcn's `Form` + `FormField` composition (with `vee-validate` + `zod`, matching the Zod-schema-first approach already planned for lesson plan generation) rather than raw `<input>` + manual error `<span>`s.
- Page width: content max-width `max-w-4xl` for the lesson-plan editor (long-form reading), `max-w-7xl` for list/dashboard views.

---

## 5. Component Conventions Specific to This Project

| UI need | Component to use |
|---|---|
| Lesson plan list | `Table` (desktop) / `Card` list (mobile) — same dual pattern as `HospitlasClinicCardView`/`HospitlasClinicTableView` in SFADS |
| ILAW section editor | Four `Card`s (one per section: Intentions, Learning Experience, Assessing Learning, Ways Forward), each with a `Tiptap`-powered `CardContent` |
| Status | `Badge` with the status tokens above |
| Generate / Regenerate action | `Button` with `variant="default"` + a `Loader2` spinner icon while the LLM call is in flight |
| AI-use declaration | `Dialog` or inline `Alert` (`variant="warning"`) shown before export is enabled — this is a compliance step, make it visually distinct, not a quiet checkbox |
| Export options | `DropdownMenu` (DOCX / PPTX) triggered from a single "Export" `Button` |
| Empty states (no lesson plans yet) | Centered icon + one-line explanation + primary CTA — follow the "empty screen is an invitation to act" convention, not a generic "No data" message |

---

## 6. What NOT to do

- Don't add a second component library (no Headless UI, no Vuetify) alongside shadcn-vue.
- Don't hardcode colors, spacing, or radius values that bypass the token system above.
- Don't use `text-red-500` / `bg-green-500` etc. directly for status or destructive states — use the semantic tokens (`text-destructive`, `--status-*`) so a future theme change updates everything at once.
- Don't default to the generic AI-generated look (warm cream + terracotta accent, or all-cards-identical-radius-and-shadow SaaS kit) — this project already has a palette; extend it deliberately rather than reaching for a template default.
