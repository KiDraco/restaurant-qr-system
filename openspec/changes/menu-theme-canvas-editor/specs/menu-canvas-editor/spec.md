## ADDED Requirements

### Requirement: Canvas renders a fixed-size page representing the menu sheet
The system SHALL render a fixed-size canvas area (default A4 portrait: 794×1123px at 96 DPI) that visually represents the printable menu page. The canvas SHALL have a background (color, gradient, or image) configurable via theme.

#### Scenario: Default canvas loads with white background
- **WHEN** user opens Canvas Editor for a new theme
- **THEN** a 794×1123px canvas area appears with white background

#### Scenario: Canvas reflects theme background config
- **WHEN** user sets theme background to gradient `#FF6B6B` → `#4ECDC4`
- **THEN** canvas displays that gradient as background

### Requirement: Elements can be added to the canvas via sidebar toolbar
The system SHALL provide a sidebar toolbar with buttons to add each of the 7 element types: Image, Text, Category, Product, Separator, Decorative, Logo. Clicking a button SHALL add a new element of that type at a default position (centered horizontally, staggered vertically) on the canvas.

#### Scenario: Add Image element
- **WHEN** user clicks "Add Image" in toolbar
- **THEN** an Image element appears on canvas at default position with placeholder image

#### Scenario: Add Text element
- **WHEN** user clicks "Add Text" in toolbar
- **THEN** a Text element appears with default content "Nuevo texto"

#### Scenario: Add Category element
- **WHEN** user clicks "Add Category" in toolbar
- **THEN** a Category element appears with default title "Categoría"

#### Scenario: Add Product element
- **WHEN** user clicks "Add Product" in toolbar
- **THEN** a Product element appears with placeholder name, description, price

#### Scenario: Add Separator element
- **WHEN** user clicks "Add Separator" in toolbar
- **THEN** a horizontal line appears at default position

#### Scenario: Add Decorative element
- **WHEN** user clicks "Add Decorative" in toolbar
- **THEN** a decorative shape (e.g., divider icon) appears

#### Scenario: Add Logo element
- **WHEN** user clicks "Add Logo" in toolbar
- **THEN** a Logo element appears with placeholder

### Requirement: Elements can be selected, moved, and resized on the canvas
The system SHALL allow selecting an element by clicking it. Selected elements SHALL show a bounding box with resize handles. Users SHALL drag elements to reposition them (updating `x`, `y` in pixels). Users SHALL drag resize handles to change `width` and `height`. Element position and size SHALL be constrained within canvas bounds.

#### Scenario: Select element by click
- **WHEN** user clicks an element on canvas
- **THEN** element shows selection bounding box with 8 resize handles

#### Scenario: Drag element to new position
- **WHEN** user drags selected element to new location
- **THEN** element `x`, `y` update in real-time; element stays within canvas bounds

#### Scenario: Resize element via handles
- **WHEN** user drags a corner resize handle
- **THEN** element `width` and `height` update proportionally; aspect ratio unlocked by default

#### Scenario: Constrain element within canvas
- **WHEN** user drags element near canvas edge
- **THEN** element snaps to boundary and cannot exceed canvas dimensions

### Requirement: Elements can be deleted and duplicated
The system SHALL provide delete and duplicate actions for selected elements via keyboard (Delete/Backspace, Ctrl+D) and context menu.

#### Scenario: Delete selected element
- **WHEN** user selects element and presses Delete
- **THEN** element is removed from canvas immediately

#### Scenario: Duplicate selected element
- **WHEN** user selects element and presses Ctrl+D
- **THEN** a copy appears offset by +20px, +20px with new unique ID

### Requirement: Elements support layer ordering
The system SHALL maintain element z-order based on array order in `elements[]` (last = top). Users SHALL reorder layers via context menu (Bring to Front, Send to Back, Bring Forward, Send Backward) and drag-to-reorder in a layers panel.

#### Scenario: Bring to front
- **WHEN** user selects element and chooses "Bring to Front"
- **THEN** element moves to end of `elements[]` array and renders on top

#### Scenario: Send to back
- **WHEN** user selects element and chooses "Send to Back"
- **THEN** element moves to start of `elements[]` array and renders behind others

### Requirement: Canvas provides snap-to-grid alignment
The system SHALL provide an 8px grid with magnetic snap (4px threshold) that can be toggled on/off. When enabled, dragging or resizing elements SHALL snap to nearest grid lines.

#### Scenario: Snap to grid while dragging
- **WHEN** grid enabled and user drags element near grid line
- **THEN** element snaps to grid at 4px threshold

#### Scenario: Toggle grid on/off
- **WHEN** user toggles grid button in toolbar
- **THEN** grid lines show/hide and snapping enables/disables

### Requirement: "Nuevo Theme" creates theme and opens Canvas Editor
The system SHALL provide a working "Nuevo Theme" button in `ThemeList`. Clicking it SHALL create a new theme via `POST /api/theme` with empty canvas state, then navigate to `/admin/themes/:id/edit` to open Canvas Editor.

#### Scenario: Click Nuevo Theme creates theme and opens editor
- **WHEN** user clicks "Nuevo Theme" button
- **THEN** new theme created with empty `elements[]`, default page format, white background; browser navigates to Canvas Editor for that theme

### Requirement: Canvas Editor accessible at `/admin/themes/:id/edit`
The system SHALL render the Canvas Editor at route `/admin/themes/:id/edit` for existing themes, loading the theme's canvas state.

#### Scenario: Open existing theme in Canvas Editor
- **WHEN** user navigates to `/admin/themes/5/edit`
- **THEN** Canvas Editor loads with theme's saved `elements[]`, `page_format`, `background_config`