---
name: shadcn-tasks-table
description: Design + implementation reference for the shadcn/ui "Tasks" data table pattern (ui.shadcn.com/examples/tasks) — a search box, dashed faceted-filter buttons (Status/Priority/etc.), a date filter, a "Sort" menu with an active-count badge, a "View" columns toggle, right-aligned sortable columns, icon+text Status/Priority cells, category-badge Title cells, a row-actions "..." menu, and a "N of M row(s) selected" footer with page-size select + pagination. Use this skill whenever the user asks to build a data table, task/issue list, admin table, or any tabular UI with search, faceted filters, sorting, column visibility, row selection, or pagination — especially if they mention shadcn, TanStack Table, or paste/describe a table that looks like this one. Directly applicable to Nuxt/Vue + shadcn-vue + TanStack Table projects, which is this user's stack.
---

# shadcn Tasks Table

Reference for recreating the canonical **shadcn/ui "Tasks" example** (React + Tailwind + shadcn/ui + TanStack Table, MIT — source: `shadcn-ui/ui`, live at `ui.shadcn.com/examples/tasks`). This is the table every "shadcn data table" tutorial studies. The version this skill documents is a common extended variant of it (as seen in admin-dashboard roundups): the same core anatomy plus a couple of extra facet filters and a Sort/View pair in the toolbar.

Use this for: task lists, ticket/issue trackers, admin CRUD tables, inventory/order tables — any dense tabular admin UI where rows need filtering, sorting, selection, and row actions.

## Core visual principles

1. **Everything is grayscale.** No accent color anywhere in the chrome — borders, icons, and secondary text all sit on the neutral/gray scale (`border`, `muted-foreground`, `foreground` design tokens). The only "color" is whatever the data itself implies (there isn't any here — even status isn't color-coded, just icon + label).
2. **Toolbar buttons are small and dashed for filters.** Filter triggers (`Status`, `Priority`, `Est. Hours`) are `outline` buttons, `h-8`, **dashed border**, with a small `PlusCircle` icon before the label. This dashed-outline + plus-icon combo is the single most recognizable shadcn-table signature — always use it for "add a filter" affordances, never a solid button.
3. **One filter can look different when its type differs.** A date-based filter (`Created At`) swaps the `PlusCircle` icon for a `Calendar` icon but keeps the same button shape — the icon communicates the filter's *kind* (multi-select vs. date), the button style communicates that it's still "a filter."
4. **Numeric/enum columns are right-aligned; identity columns are left-aligned.** `Task` and `Title` stay left-aligned (they're identifiers/content). `Status`, `Priority`, `Est. Hours`, `Created At` are right-aligned, both header and cell — this is what makes the right half of the table feel like a clean data grid instead of prose.
5. **Every sortable header is a button, not just text.** Header label + a small icon (`ArrowUpDown` when unsorted, `ArrowUp`/`ArrowDown` when active) rendered as a ghost button — clicking anywhere on the header cell toggles sort.
6. **Status and Priority are icon + word, never color badges.** A small (14–16px) muted-gray icon sits directly before the text, same text size as the rest of the row. No colored pills for state — that keeps the whole table monochrome per principle 1.
7. **Category labels ride inside the Title cell as an outline badge.** The `documentation` / `bug` / `feature` / `enhancement` tag is a small `Badge` (`variant="outline"`, `rounded-md`, `font-normal`, `capitalize`) placed inline before the (truncated, single-line, ellipsis'd) title text — not a separate column.
8. **Row actions are a borderless icon button.** Just a `MoreHorizontal` icon in a `ghost`/`icon` size button, right-most column, no border, only visible affordance is the hover background.
9. **The footer is a status line + pagination bar, not a toolbar.** Left: `"{n} of {total} row(s) selected."` in muted text (always rendered, even at 0 selected). Right: `Rows per page` label + `Select`, `Page X of Y` text, then four icon buttons (first / prev / next / last) — `outline`, `icon` size, `h-8 w-8`, disabled (and visibly faded) at either end of the range.
10. **Density stays tight throughout.** Toolbar controls are `h-8`. Header row is `h-10`. Body rows are compact with a hairline `border-b` between them (no zebra striping, no card wrapper — just a bordered `<table>`).

## Anatomy checklist (top to bottom, per the reference screenshot)

- **Toolbar row:** `Search titles...` input (`h-8 w-[150px] sm:w-[250px]`) → `+ Status` → `+ Priority` → `+ Est. Hours` (all dashed-outline + `PlusCircle`) → `📅 Created At` (dashed-outline + `Calendar`) → flex-spacer → `↕ Sort  [1]` (icon + label + small count badge when active) → `☰ View` (columns-visibility dropdown).
- **Header row:** checkbox column → `Task` (plain) → `Title ↕` → `Status ↕` (right) → `Priority ↕` (right) → `Est. Hours ↕` (right) → `Created At ⌄` (right, shown here already sorted so it's a single chevron, not the double arrow).
- **Body row:** checkbox → `TASK-0152` → `[badge: documentation]  The DNS bandwidth is down, reboot the auxiliary monitor so we can synth…` → `⊘ Done` / `↻ In-Progress` / `⊗ Canceled` / `○ Todo` → `↓ Low` / `→ Medium` / `↑ High` → `14` → `May 7, 2026` → `⋯`.
- **Footer:** `0 of 10 row(s) selected.` ⟷ `Rows per page [10 ⌄]` `Page 1 of 16` `⏮ ◀ ▶ ⏭`.

## Icon mapping (lucide)

Use `lucide-vue-next` — these are the closest lucide equivalents to the icons shown (the original shadcn example uses `@radix-ui/react-icons`; lucide is the standard pairing with shadcn-vue).

| Concept | Icon | Notes |
|---|---|---|
| Faceted filter trigger (Status/Priority/Est. Hours) | `PlusCircle` | Always paired with dashed button border |
| Date filter trigger (Created At) | `Calendar` | Same button shape as above, different icon |
| Sort menu | `ArrowUpDown` | Shown with a small count badge when ≥1 sort is active |
| View / column-visibility | `SlidersHorizontal` (or `Settings2`) | Opens a dropdown of toggleable columns |
| Column header sort state | `ArrowUpDown` (none) / `ArrowUp` (asc) / `ArrowDown` (desc) | |
| Status: Todo | `Circle` | outline circle |
| Status: In Progress | `Timer` (or `LoaderCircle`) | |
| Status: Done | `CircleCheck` | |
| Status: Canceled | `CircleX` | |
| Priority: Low | `ArrowDown` | |
| Priority: Medium | `ArrowRight` | |
| Priority: High | `ArrowUp` | |
| Row actions trigger | `MoreHorizontal` | ghost icon button, no border |
| Pagination | `ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight` | |

All row-content icons render at `h-4 w-4 text-muted-foreground` inline before their label with a small gap (`gap-1.5`/`gap-2`).

## Implementation guide (Vue 3 + shadcn-vue + TanStack Vue Table)

Assumes `@shadcn-nuxt`, `@lucide/vue`, and shadcn-vue's `Table`, `Button`, `Input`, `Badge`, `Checkbox`, `Select`, `DropdownMenu` components are already installed.

### Faceted filter button (Status / Priority / Est. Hours)

```vue
<!-- DataTableFacetedFilter.vue -->
<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <PlusCircle class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            <Badge v-if="selectedValues.size > 2" variant="secondary" class="rounded-sm px-1 font-normal">
              {{ selectedValues.size }} selected
            </Badge>
            <Badge v-else v-for="v in selectedValues" :key="v" variant="secondary" class="rounded-sm px-1 font-normal">
              {{ options.find(o => o.value === v)?.label }}
            </Badge>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <!-- PopoverContent: Command list of checkbox-style options, matches shadcn combobox pattern -->
  </Popover>
</template>
```

### Date filter button (Created At)

Same `Button` shape as above (`variant="outline" size="sm" class="h-8 border-dashed"`), swap `PlusCircle` for `Calendar`, and open a `PopoverContent` containing a shadcn `RangeCalendar`/`Calendar`.

### Sortable column header

```vue
<!-- DataTableColumnHeader.vue -->
<template>
  <Button variant="ghost" size="sm" class="-ml-3 h-8 data-[state=open]:bg-accent"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')">
    <span>{{ title }}</span>
    <ArrowDown v-if="column.getIsSorted() === 'desc'" class="ml-2 h-4 w-4" />
    <ArrowUp v-else-if="column.getIsSorted() === 'asc'" class="ml-2 h-4 w-4" />
    <ArrowUpDown v-else class="ml-2 h-4 w-4" />
  </Button>
</template>
```
Right-aligned columns wrap this in a `<div class="flex justify-end">` in the column's `header` render fn.

### Status / Priority cell

```ts
const statusIcons = { todo: Circle, 'in-progress': Timer, done: CircleCheck, canceled: CircleX }
const priorityIcons = { low: ArrowDown, medium: ArrowRight, high: ArrowUp }
```
```vue
<div class="flex items-center justify-end gap-1.5 text-sm">
  <component :is="statusIcons[row.status]" class="h-4 w-4 text-muted-foreground" />
  <span class="capitalize">{{ row.status.replace('-', ' ') }}</span>
</div>
```

### Title cell (category badge + truncated text)

```vue
<div class="flex items-center gap-2">
  <Badge variant="outline" class="rounded-md font-normal capitalize">{{ row.label }}</Badge>
  <span class="max-w-[280px] truncate text-sm sm:max-w-[420px]">{{ row.title }}</span>
</div>
```

### Row actions

```vue
<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="ghost" class="h-8 w-8 p-0 data-[state=open]:bg-muted">
      <MoreHorizontal class="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-[160px]">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Make a copy</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Footer / pagination

```vue
<div class="flex items-center justify-between px-2 py-4">
  <div class="text-sm text-muted-foreground">
    {{ table.getFilteredSelectedRowModel().rows.length }} of
    {{ table.getFilteredRowModel().rows.length }} row(s) selected.
  </div>
  <div class="flex items-center space-x-6 lg:space-x-8">
    <div class="flex items-center space-x-2">
      <p class="text-sm font-medium">Rows per page</p>
      <Select v-model="pageSize">
        <SelectTrigger class="h-8 w-[70px]"><SelectValue /></SelectTrigger>
        <SelectContent side="top">
          <SelectItem v-for="n in [10,20,30,40,50]" :key="n" :value="`${n}`">{{ n }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex w-[100px] items-center justify-center text-sm font-medium">
      Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
    </div>
    <div class="flex items-center space-x-2">
      <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanPreviousPage()" @click="table.setPageIndex(0)"><ChevronsLeft class="h-4 w-4" /></Button>
      <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()"><ChevronLeft class="h-4 w-4" /></Button>
      <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanNextPage()" @click="table.nextPage()"><ChevronRight class="h-4 w-4" /></Button>
      <Button variant="outline" class="h-8 w-8 p-0" :disabled="!table.getCanNextPage()" @click="table.setPageIndex(table.getPageCount() - 1)"><ChevronsRight class="h-4 w-4" /></Button>
    </div>
  </div>
</div>
```
The faded look on `first`/`prev` in the screenshot is just their `disabled` state on page 1 — not a special style.

## Spacing & token quick reference

- Toolbar controls: `h-8`, `text-sm`, `gap-2` between them, wrapped in a `flex items-center justify-between` row with `flex-1 items-center space-x-2` on the left cluster.
- Table header cell: `h-10 px-2 text-sm font-medium text-muted-foreground`; right-aligned columns add `text-right` / `justify-end`.
- Body cell: `p-2 align-middle text-sm`; rows use `border-b` (last row `border-0`) and `hover:bg-muted/50`.
- Badges: `variant="outline"`, `rounded-md`, `text-xs`/`text-sm font-normal`, `capitalize`.
- No box-shadow anywhere — the table's only structure comes from `border`/`border-b` hairlines (`border-border` token), consistent with shadcn's flat, borderless-card table style.
- Color budget: literally just neutrals (`foreground`, `muted-foreground`, `border`, `background`, `accent`/`muted` for hover) — resist the urge to add status colors; that's not this design.

## When to use vs. skip this style

**Use it for:** task/ticket trackers, admin CRUD lists, order/inventory tables, any internal tool table needing search + facet filters + sort + selection + row actions.

**Skip it for:** dashboards where color-coded status genuinely aids scanning at a glance (badges with color are a legitimate deviation — just say so explicitly if you deviate), read-only report tables with no interactivity (drop the toolbar and actions column), or mobile-first views (collapse rows into stacked cards below `sm`, this layout doesn't reflow well under ~500px).

## Quick checklist when building a table in this style

- [ ] Search input + dashed `PlusCircle` filter buttons + `Calendar` date filter, all `h-8`
- [ ] `Sort` (with active-count badge) and `View` (columns toggle) pinned to the toolbar's right edge
- [ ] Left-align identity columns (Task/Title), right-align enum/numeric/date columns
- [ ] Every sortable header is a ghost button with `ArrowUpDown`/`ArrowUp`/`ArrowDown`
- [ ] Status/Priority = muted icon + plain text, never a colored pill
- [ ] Category tag = outline `Badge` inline inside the Title cell, not its own column
- [ ] Row actions = borderless `MoreHorizontal` icon button, right-most column
- [ ] Footer = selection count (left) + rows-per-page `Select` + "Page X of Y" + 4 pagination icon buttons (right)
- [ ] Zero accent colors; only neutral tokens + hairline borders
