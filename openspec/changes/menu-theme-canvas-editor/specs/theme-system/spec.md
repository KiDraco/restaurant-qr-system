## MODIFIED Requirements

### Requirement: Theme data model
The system SHALL store theme definitions in the `themes` table with the following columns:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `is_active` (BOOLEAN DEFAULT 0)
- `is_default` (BOOLEAN DEFAULT 0)
- `config` (TEXT NOT NULL DEFAULT '{}') — JSON with legacy color/font tokens (retained for backward compatibility)
- `canvas_json` (TEXT DEFAULT NULL) — **ADDED** full canvas state (page_format, background_config, elements[], grid, version)
- `page_format` (TEXT DEFAULT 'A4-portrait') — **ADDED** page size/orientation
- `background_config` (TEXT DEFAULT '{"type":"color","value":"#FFFFFF"}') — **ADDED** background definition
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

#### Scenario: New theme includes canvas fields
- **WHEN** theme created via Canvas Editor
- **THEN** `canvas_json`, `page_format`, `background_config` populated; `config` also saved for backward compat

#### Scenario: Legacy theme works without canvas fields
- **WHEN** theme created before canvas feature exists
- **THEN** `canvas_json` is NULL; `config` provides colors/fonts; system gracefully falls back

### Requirement: Theme API returns canvas fields
The system SHALL include the new canvas fields in all theme API responses:
- `GET /api/theme` (list): each theme includes `canvas_json`, `page_format`, `background_config`
- `GET /api/theme/active`: returns active theme with canvas fields
- `GET /api/theme/:id`: returns single theme with canvas fields
- `POST /api/theme`: accepts optional `canvas_json`, `page_format`, `background_config` in request body
- `PUT /api/theme/:id`: accepts optional canvas fields for update

#### Scenario: List themes includes canvas_json
- **WHEN** client calls `GET /api/theme`
- **THEN** each theme object has `canvas_json`, `page_format`, `background_config` fields (nullable)

#### Scenario: Create theme accepts canvas fields
- **WHEN** client posts `{ name: "Test", canvas_json: "...", page_format: "A4-landscape" }`
- **THEN** theme created with those values; missing fields get defaults

### Requirement: Theme model methods handle canvas fields
The `Theme` model (`backend/src/models/Theme.js`) SHALL be updated to:
- Include new fields in `create()`, `update()`, `findById()`, `findAll()`, `findActive()`, `getConfig()`
- `getConfig(themeId)` SHALL merge `canvas_json` styles (colors, fonts, background) with legacy `config` for backward compatibility, preferring canvas values when present

#### Scenario: getConfig merges canvas and legacy config
- **WHEN** `Theme.getConfig(id)` called for theme with both `canvas_json` and `config`
- **THEN** returns merged object where canvas colors/fonts/background take precedence

#### Scenario: getConfig falls back to legacy config
- **WHEN** `Theme.getConfig(id)` called for theme with `canvas_json` = NULL
- **THEN** returns parsed `config` (legacy behavior unchanged)

### Requirement: Theme migration creates new columns
The database initialization (`backend/src/config/database.js`) SHALL add the new columns via `ALTER TABLE` in the migration block, with sensible defaults:
- `canvas_json` TEXT DEFAULT NULL
- `page_format` TEXT DEFAULT 'A4-portrait'
- `background_config` TEXT DEFAULT '{"type":"color","value":"#FFFFFF"}'

#### Scenario: Migration adds columns idempotently
- **WHEN** `initializeDatabase()` runs on existing database
- **THEN** new columns added if not present; existing data preserved

### Requirement: ThemeList and ThemeEditor handle canvas themes
Frontend components SHALL be updated:
- `ThemeList`: show canvas thumbnail preview when `canvas_json` present; fallback to color swatches from `config`
- `ThemeEditor` → refactored to `CanvasEditor` (new route `/admin/themes/:id/edit`)
- `ThemesManager`: route "Nuevo Theme" to create+edit flow; "Editar" opens CanvasEditor

#### Scenario: ThemeList shows canvas preview
- **WHEN** rendering theme with `canvas_json`
- **THEN** thumbnail renders scaled canvas preview (200px wide)

#### Scenario: ThemeList fallback for legacy themes
- **WHEN** rendering theme without `canvas_json`
- **THEN** shows color swatches from `config.colors`