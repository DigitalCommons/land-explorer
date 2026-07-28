# Styling with Tailwind and shadcn

This is now the standard way to style the React app. New UI code should be written this way. Existing SCSS-based components should be migrated to this approach as we work in them (see [Migrating old files](#migrating-old-files) below).

## The basics

### Tailwind

[Tailwind](https://tailwindcss.com/) is a utility-first CSS framework. Instead of writing CSS rules in a stylesheet, you compose small utility classes directly on elements:

```tsx
<div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
```

There's no CSS file to hunt through to find out how something is styled - the styling is on the element itself. This is the main thing it's solving for us: our old SCSS (`src/assets/styles/*.scss`) requires searching the codebase for a class name to find where a component's styles live and being careful not to affect other components that share that class.

We're on Tailwind v4, which is configured in CSS rather than a `tailwind.config.js` file. Our config lives in `src/tailwind.css`:

-   `@theme inline { ... }` maps design tokens (colours, radii, etc.) to CSS variables
-   `:root { ... }` and `.dark { ... }` define the actual colour values (as `oklch()`), so dark mode is just a matter of the `.dark` class being present on an ancestor element
-   Utility classes like `bg-primary`, `text-muted-foreground`, `rounded-lg` all resolve to these variables, so changing a token in one place updates every component using it

### shadcn

[shadcn/ui](https://ui.shadcn.com/) is not a component library you install from npm and import - it's a CLI that **generates the component source code into our repo**, under `src/components/ui/`. We own and can freely edit that code; there's no black-box package to work around.

Each generated component is:

-   built on unstyled, accessible primitives (we're using [Base UI](https://base-ui.com/))
-   styled with Tailwind utility classes
-   given variants (e.g. a button's `variant="outline"` vs `variant="destructive"`) using [`class-variance-authority`](https://cva.style/docs) (`cva`)
-   combined with any custom classes via the `cn()` helper in `src/lib/utils.ts`, which merges `clsx` + `tailwind-merge` so conflicting Tailwind classes resolve sensibly (e.g. a passed-in `p-2` correctly overrides a default `p-4`)

See `src/components/ui/button.tsx` for a worked example of this pattern.

Configuration for the CLI lives in `apps/front-end/components.json` - this is where the style variant (`base-nova`), base colour, icon library (`lucide`), and import aliases (`@/components`, `@/lib`, `@/hooks`, etc.) are set.

### Adding a new shadcn component

Use the CLI rather than hand-writing primitives:

```bash
npx shadcn@latest add <component-name>
```

e.g. `npx shadcn@latest add dialog`. This drops the component into `src/components/ui/` following our existing config, ready to import and use. Browse available components at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

## Policy

-   **All new components and new UI code should be written using Tailwind + shadcn**, not new SCSS. Reach for an existing `src/components/ui/*` component first; if it doesn't exist yet, generate it with the CLI rather than hand-rolling styled markup.
-   **Don't add to the legacy SCSS** (`src/assets/styles/*.scss`). If you need a one-off style that doesn't fit a utility class, prefer an inline Tailwind utility (Tailwind v4 supports arbitrary values, e.g. `top-[3px]`) over a new SCSS rule.

### Migrating old files

We're not doing a big-bang rewrite of the old SCSS-styled components. Instead, when you're already working in a file that uses the old system:

-   convert the styles you touch to Tailwind classes / shadcn components as part of that change
-   if a chunk of a component is being reworked anyway, take the opportunity to move the whole component over rather than leaving it half-migrated
-   once a `.scss` partial has no remaining consumers, delete it and remove its `@import` from `src/assets/styles/style.scss`

There's no need to migrate code you're not otherwise touching - this is an incremental, work-as-we-go migration, not a separate project.
