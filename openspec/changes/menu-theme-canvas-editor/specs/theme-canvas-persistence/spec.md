## ADDED Requirements

### Requirement: Theme stores complete canvas state in `canvas_json`
The system SHALL persist the full canvas state as a JSON string in the `themes.canvas_json` column. The canvas state SHALL include:
- `page_format` (string): e.g., `A4-portrait`, `A4-landscape`
- `background_config` (object): `{ type: "color|gradient|image", value: "...", ... }`
- `elements` (array): each element with `id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `config` (type-specific properties), `locked` (boolean), `visible` (boolean)
- `grid` (object): `{ enabled: boolean, size: number }`
- `version` (number): schema version for future migrations

#### Scenario: Save theme persists full canvas
- **WHEN** user clicks "Guardar" in Canvas Editor
- **THEN** `PUT /api/theme/:id` sends full canvas JSON; DB `canvas_json` updated

#### Scenario: Canvas JSON has correct structure
- **WHEN** theme saved with 3 elements
- **THEN** `canvas_json` parses to object with `page_format`, `background_config`, `elements` (length 3), `grid`, `version`

### Requirement: Theme loads canvas state into editor
The system SHALL load the saved `canvas_json` when opening Canvas Editor for an existing theme (`GET /api/theme/:id`). If `canvas_json` is NULL (legacy theme), the editor SHALL initialize with empty canvas and fall back to `config` (colors/fonts) for styling.

#### Scenario: Load existing canvas theme
- **WHEN** user opens `/admin/themes/5/edit` for theme with `canvas_json`
- **THEN** Canvas Editor renders all elements at saved positions with saved styles

#### Scenario: Legacy theme without canvas_json opens empty
- **WHEN** user opens editor for theme created before canvas feature
- **THEN** editor shows empty canvas; theme colors/fonts from `config` available for new elements

### Requirement: Theme applies canvas styles to public menu view
The system SHALL use the active theme's canvas configuration (`colors`, `fonts`, `background`) to style the public client menu (`ClientMenu.jsx`). The `hooks/useTheme.js` SHALL extract style tokens from `canvas_json` (or fallback to `config`) and inject CSS variables.

#### Scenario: Active theme colors apply to menu
- **WHEN** theme has `canvas_json.background_config.type: "color", value: "#FFF8F0"`
- **THEN** public menu background becomes `#FFF8F0`

#### Scenario: Theme fonts apply to menu
- **WHEN** theme canvas defines `fontFamily: "Georgia"` for headings
- **THEN** menu headings render in Georgia

### Requirement: Theme list shows canvas preview
The system SHALL display a small thumbnail preview of the canvas in `ThemeList` for themes that have `canvas_json`. The preview SHALL render a scaled-down version of the canvas (e.g., 200px wide) showing background and element layout.

#### Scenario: Theme list shows canvas thumbnail
- **WHEN** ThemeList renders theme with `canvas_json`
- **THEN** a 200×283px preview shows the canvas layout

#### Scenario: Legacy theme shows color swatch fallback
- **WHEN** ThemeList renders theme without `canvas_json`
- **THEN** preview shows color swatches from `config` instead

### Requirement: Duplicate theme copies canvas state
The system SHALL provide a "Duplicate" action in ThemeList that creates a new theme with copied `canvas_json`, `page_format`, `background_config`, and a new name (appending " - Copia").

#### Scenario: Duplicate theme preserves canvas
- **WHEN** user clicks "Duplicar" on theme with complex canvas
- **THEN** new theme created with identical `canvas_json` and all settings

### Requirement: Theme export/import as JSON file
The system SHALL provide "Exportar" and "Importar" actions. Export downloads the theme's `canvas_json` as a `.json` file. Import accepts a `.json` file, validates structure, and creates a new theme.

#### Scenario: Export theme downloads JSON
- **WHEN** user clicks "Exportar" on theme
- **THEN** browser downloads `theme-{name}.json` with full canvas state

#### Scenario: Import creates new theme from file
- **WHEN** user selects valid theme JSON file in "Importar"
- **THEN** new theme created with imported canvas state; name from file or "Imported Theme"