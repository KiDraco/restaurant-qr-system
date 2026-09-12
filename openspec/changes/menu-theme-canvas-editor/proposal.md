## Why

The current "Theme" system is broken and severely limited. The "Nuevo Theme" button doesn't work — clicking it does nothing, so admins cannot create new themes at all. Beyond that, the current concept of a "theme" only covers colors and fonts, but restaurants need a visual menu designer where they can compose the entire menu structure (images, categories, product listings, decorative elements, logo placement) on a canvas that represents the actual printed menu page. This change fixes the broken button and evolves themes into a full visual canvas editor — a "Canva-like" experience for menu design — giving restaurants complete freedom to design their menus visually rather than choosing from rigid templates.

## What Changes

- **Fix "Nuevo Theme" button**: Creates a new theme and immediately opens the Canvas Editor with an empty or seeded canvas.
- **Canvas Editor (visual menu designer)**: Central canvas representing a menu page with drag-and-drop, resize, select, delete, duplicate, layer ordering, and snap/grid alignment. Sidebar toolbar for adding elements: Image, Text, Category, Product, Separator/Line, Decorative Element, Logo.
- **Element properties panel**: When an element is selected, its configurable properties appear (position, size, typography, colors, border radius, opacity, alignment, spacing, etc. — varying by element type).
- **Theme persistence**: A theme now saves the complete visual structure — page size/format, background, colors, typography, all elements with their positions, dimensions, styles, and component config — so the same theme can be applied to different menus while preserving visual identity.
- **No hardcoded layouts**: Users have full freedom to place elements anywhere (image top/right/side-by-side, logo centered/corner, separators anywhere, etc.).

## Capabilities

### New Capabilities

- `menu-canvas-editor`: Visual drag-and-drop canvas editor for composing menu pages. Includes canvas rendering, element manipulation (drag, resize, select, delete, duplicate, layer order), snap/grid, and sidebar toolbar.
- `canvas-element-types`: Defines the palette of element types (Image, Text, Category, Product, Separator, Decorative, Logo) and their property schemas.
- `canvas-element-properties`: Property panel for editing selected element's config (position, size, typography, colors, border radius, opacity, alignment, spacing, crop/scale for images, etc.).
- `theme-canvas-persistence`: Serializes and deserializes the complete canvas state (page format, background, elements with positions/dimensions/styles) as the theme definition. Enables saving, loading, and applying themes to menus.

### Modified Capabilities

- `theme-system`: The existing theme capability (colors, fonts) is being expanded to include full visual structure (canvas elements, layout, positions). This is a **BREAKING** change to the theme data model — themes now contain a canvas definition, not just style tokens.

## Impact

- **Frontend**: New admin routes/pages for Canvas Editor (`/admin/themes/new`, `/admin/themes/:id/edit`). New components: `CanvasEditor`, `Canvas`, `ElementPalette`, `ElementPropertiesPanel`, `CanvasElement` (with subtypes), drag-and-drop logic (likely `@dnd-kit` or native HTML5 DnD), snap/grid utilities. Theme data model changes in `hooks/useTheme.js`, `services/api.js`, `ThemeList`, `ThemeEditor`, `ThemesManager`.
- **Backend**: Theme model (`backend/src/models/Theme.js`) extended to store canvas JSON (elements array with positions, styles, config). Controller (`themeController.js`) updated for CRUD on canvas themes. Migration needed for existing themes (new fields nullable with defaults).
- **API**: `GET/POST/PUT/DELETE /api/theme` extended to handle canvas payload. No breaking API changes — new fields are optional/additive.
- **Persistence**: SQLite `themes` table gains new columns (`canvas_json`, `page_format`, `background_config`). Migration in `database.js`.
- **Dependencies**: May add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (or use native DnD). No backend dependency changes.
- **Rollback**: If migration causes issues, revert DB migration and restore previous Theme model/controller. Feature flag `FEATURE_CANVAS_THEMES` can gate the editor UI.