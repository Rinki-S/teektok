# AI Coding Guidelines

- Stack: Next.js App Router (TypeScript) with Tailwind CSS v4 imports, next-themes, lucide-react icons, and shadcn-style UI primitives. Fonts come from next/font (Geist + DM Sans) in layout.
- Layout: [app/layout.tsx](app/layout.tsx) wraps every page in ThemeProvider (default "dark") and SidebarProvider. AppSidebar is rendered once at root; main content lives beside it. Avoid re-wrapping providers in child routes.
- Sidebar system: Use the primitives in [components/ui/sidebar.tsx](components/ui/sidebar.tsx). State lives in context with keyboard shortcut Cmd/Ctrl+B and cookie `sidebar_state`; mobile falls back to a Sheet. For inset/floating layouts, prefer `SidebarInset`. For nav items, compose `SidebarMenu` + `SidebarMenuItem` + `SidebarMenuButton` (supports `variant`/`size` via cva). Use `SidebarTrigger` or `SidebarRail` to toggle.
- App nav example: [components/app-sidebar.tsx](components/app-sidebar.tsx) shows how to build grouped menus with lucide icons and custom hover classes. Follow this pattern for additional sections; keep icons/text in arrays and map them into menu items.
- Demo surface: [components/example.tsx](components/example.tsx) provides `ExampleWrapper` and `Example` shells for side-by-side demos. [components/component-example.tsx](components/component-example.tsx) demonstrates composing cards, dialogs, dropdowns, forms, and shadcn controls; reuse as reference for spacing, tone, and accessibility patterns.
- Theme & tokens: [app/globals.css](app/globals.css) imports tailwind, tw-animate-css, and shadcn presets. Light/dark tokens defined via CSS custom properties and `@theme inline`; `@custom-variant dark` maps `.dark` scope. Keep new styles on these tokens; prefer utility classes over ad-hoc colors.
- Utilities: use `cn` from [lib/utils.ts](lib/utils.ts) to merge class lists. Follow TypeScript defaults; enable client components with "use client" where hooks or browser APIs are used.
- Responsive behavior: `useIsMobile` in [hooks/use-mobile.ts](hooks/use-mobile.ts) controls sidebar mobile switching; use it instead of duplicating matchMedia logic.
- Data & state: No global state library; stick to React state/hooks. Components are largely presentational; keep side effects minimal.
- Scripts: `npm run dev` starts Next.js, `npm run build` for production, `npm run start` to serve, `npm run lint` for ESLint. No custom test setup present.
- Assets: Prefer remote images via `img` (see component-example) or Next/Image if optimizing; ensure width/height are provided when switching to Image.
- Accessibility: Follow existing patterns—buttons expose sr-only labels where icons are used; Dialog/Select/Dropdown come from radix-based shadcn components, so pass through `asChild` when wrapping links.
- Contributing patterns: Keep UI pieces in `components/ui` or `components/` roots; export small utilities from `lib/`. Co-locate new hooks in `hooks/`.
- Theming defaults: Body uses `antialiased` and font vars on `<html>`; avoid overriding at page level unless necessary to keep consistent typography.
- Navigation width: Sidebar widths use CSS vars (`--sidebar-width`, `--sidebar-width-icon`); adjust via props/styles on SidebarProvider if changing layout spacing.
- Motion: tw-animate-css is available; prefer it over custom keyframes for small motions to keep bundle size down.
- Internationalization: Current copy mixes English and Chinese labels (e.g., sidebar menu). Preserve or extend this bilingual style rather than replacing wholesale.
- Error handling: Components assume static data; if introducing async/server data, favor Next.js server components for fetching and pass props into client components.
- Performance: Avoid unnecessary re-renders inside Sidebar by keeping menu item arrays static (defined outside components) and passing primitives.
- File organization: New pages go in `app/`; remember to export default server components unless they require client features. For client pages, add "use client" at top.
- Import style: Use absolute aliases via `@/` (configured by Next/tsconfig). Keep lucide icons tree-shaken by importing named icons only.

If anything here is unclear or missing, tell me what to clarify or expand.