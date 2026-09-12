## Context

The restaurant QR system currently has a broken "Theme" feature. The "Nuevo Theme" button in the admin dashboard is non-functional (click does nothing). The existing theme system only supports basic color/font tokens and lacks any visual design capability. Restaurants need a way to compose their menu visually — placing images, text, categories, product listings, separators, and decorative elements on a canvas that represents the actual menu page — similar to a lightweight Canva for menus.

Current state:
- Frontend: React 18 + Tailwind 3, admin dashboard at `/admin/themes` with `ThemeList`, `ThemeEditor`, `ThemesManager` components
- Backend: Express REST API with `Theme` model storing `name`, `config` (JSON with colors/fonts), `is_active`, `is_default`
- Database: SQLite `themes` table with columns `id`, `name`, `config`, `is_active`, `is_default`, `created_at`, `updated_at`
- Theme data flows: `hooks/useTheme.js` fetches active theme, injects CSS variables; `ClientMenu.jsx` applies theme to public menu view

## Goals / Non-Goals

**Goals:**
- Fix "Nuevo Theme" button to create a theme and open Canvas Editor immediately
- Build a Canvas Editor with drag-and-drop, resize, select, delete, duplicate, layer ordering, and snap/grid
- Support 7 element types: Image, Text, Category, Product, Separator, Decorative, Logo
- Property panel for selected element with type-specific config (position, size, typography, colors, border, opacity, alignment, spacing, crop/scale)
- Theme persists complete canvas state (page format, background, elements array with positions/dimensions/styles)
- No hardcoded layouts — full freedom to place elements anywhere
- Theme applies to menus preserving visual identity

**Non-Goals:**
- Real-time collaborative editing
- Undo/redo history (v1)
- Template marketplace or sharing
- Export to PDF/image (separate feature)
- Mobile-responsive canvas editing (desktop admin only)
- Animations/transitions on canvas

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Drag-and-drop library** | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Modern, accessible, headless, works well with React 18, supports custom sensors for pointer/mouse/touch, better than raw HTML5 DnD for complex canvas interactions |
| **Canvas coordinate system** | Absolute positioning (CSS `position: absolute` with `top`/`left` in pixels) on a fixed-size container representing the page | Simple, predictable, maps 1:1 to PDF generation later, avoids flex/grid layout conflicts inside canvas |
| **Page format** | Fixed A4 portrait (794×1123px at 96 DPI) as default; configurable later | Standard menu size, avoids responsive complexity in v1 |
| **Element ID generation** | `crypto.randomUUID()` client-side | No backend round-trip for new elements, works offline-first |
| **Theme data model** | New `canvas_json` column (TEXT) stores full canvas state; `config` column retained for backward compat (colors/fonts) | Minimal migration, existing themes keep working, new themes use canvas_json |
| **Snap/grid** | 8px grid with magnetic snap (4px threshold), toggleable | Balances precision with ease of alignment |
| **Layer ordering** | Z-index based on array index in `elements[]` (last = top), drag-to-reorder in layers panel | Simple mental model, matches DOM painting order |
| **Image handling** | Images stored as base64 data URLs in canvas JSON for v1; later migrate to uploaded assets | Avoids upload infrastructure in v1, keeps theme portable as single JSON |
| **Property panel** | Right sidebar, shows config for selected element only, updates canvas on blur/change | Familiar inspector pattern, avoids modal overhead |
| **New theme flow** | `POST /api/theme` creates theme with empty canvas → redirect to `/admin/themes/:id/edit` | Single click "Nuevo Theme" → immediate editing |

**Alternatives considered:**
- **Fabric.js / Konva.js**: Powerful but heavy (50-100KB), overkill for static menu layout, steep learning curve
- **Native HTML5 DnD**: No touch support, poor accessibility, flaky cross-browser
- **React Beautiful DnD**: Unmaintained, no longer supports React 18
- **Relative/flex layout inside canvas**: Breaks pixel-perfect positioning needed for print menus
- **Separate `canvas_themes` table**: Over-engineered; single table with optional `canvas_json` is simpler

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Canvas JSON grows large** (base64 images) | Limit image size to 500KB, warn user, plan asset CDN migration for v2 |
| **Drag performance on low-end devices** | Use `@dnd-kit` with `pointer` sensor, debounce reposition, virtualize layers panel if >50 elements |
| **Cross-browser DnD quirks** | Test on Chrome/Firefox/Safari/Edge; `@dnd-kit` abstracts most differences |
| **Theme migration breaks existing themes** | `canvas_json` nullable; `config` column preserved; `Theme.getConfig()` falls back to `config` if `canvas_json` null |
| **Print/PDF fidelity mismatch** | Canvas uses same coordinate system as future PDF generator; v1 visual only, PDF in separate epic |
| **Complexity creep in element types** | Freeze 7 element types for v1; new types require spec update |
| **Accessibility of canvas editor** | Keyboard navigation for select/move/delete (arrow keys + Enter/Space), ARIA labels, focus management |

## Migration Plan

1. **DB Migration** (in `database.js` `initializeDatabase()`):
   - `ALTER TABLE themes ADD COLUMN canvas_json TEXT DEFAULT NULL`
   - `ALTER TABLE themes ADD COLUMN page_format TEXT DEFAULT 'A4-portrait'`
   - `ALTER TABLE themes ADD COLUMN background_config TEXT DEFAULT '{"type":"color","value":"#FFFFFF"}'`
   - Existing themes: `canvas_json` = NULL, falls back to `config` (colors/fonts)

2. **Backend**:
   - `Theme` model: add `canvas_json`, `page_format`, `background_config` fields
   - `themeController`: handle new fields in create/update; `listAll`/`findActive` include new fields
   - API unchanged (additive fields only)

3. **Frontend**:
   - New routes: `/admin/themes/new` (redirects to create+edit), `/admin/themes/:id/edit` (CanvasEditor)
   - `ThemeEditor` → refactor to `CanvasEditor` (new component)
   - New components: `Canvas`, `ElementPalette`, `ElementPropertiesPanel`, `CanvasElement` (polymorphic), `useCanvas` hook
   - `hooks/useTheme.js`: handle `canvas_json` for CSS variable injection (colors/fonts from canvas or legacy `config`)

4. **Feature flag**: `FEATURE_CANVAS_THEMES` (env var) gates new editor UI; old ThemeEditor remains as fallback

5. **Rollback**: Revert DB columns, restore previous Theme model/controller, disable feature flag

## Open Questions

- Should `Product` elements auto-populate from menu items API, or be manual text entry? (Lean: manual v1, auto-link v2)
- How to handle theme versioning for rollback within a theme? (Skip v1)
- Print margins / safe zones on canvas? (Add visual guides v1.1)
- Export theme as JSON file for backup/import? (Nice-to-have, defer)