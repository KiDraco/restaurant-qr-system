## ADDED Requirements

### Requirement: Property panel shows config for selected element only
The system SHALL display a right sidebar property panel that shows configuration controls for the currently selected element. When no element is selected, the panel SHALL show canvas-level settings (page format, background, grid toggle). The panel SHALL update in real-time as the user changes values.

#### Scenario: Panel shows element config when element selected
- **WHEN** user clicks an Image element on canvas
- **THEN** property panel shows Image-specific controls: src, alt, width, height, borderRadius, opacity, objectFit, scale, crop

#### Scenario: Panel shows canvas settings when nothing selected
- **WHEN** user clicks empty canvas area
- **THEN** property panel shows page format, background config, grid toggle

### Requirement: Property controls match element type schema
The system SHALL render appropriate input controls for each property type:
- String/text → text input or textarea
- Number (px, %, 0-1) → number input with unit suffix
- Color → color picker (hex + opacity slider)
- Enum → select dropdown
- Boolean → toggle switch
- Base64 image → file input + preview + "remove" button
- Crop/scale → dedicated visual cropper for images

#### Scenario: Color property shows color picker
- **WHEN** user edits `color` property of Text element
- **THEN** color picker opens with hex input and opacity slider

#### Scenario: Enum property shows dropdown
- **WHEN** user edits `objectFit` of Image element
- **THEN** dropdown shows `cover`, `contain`, `fill`, `none`

#### Scenario: Image property shows file picker with preview
- **WHEN** user edits `src` of Image element
- **THEN** file input appears; selecting image shows preview and stores base64

### Requirement: Property changes apply immediately to canvas
The system SHALL apply property changes to the selected element on the canvas in real-time (on input blur or change event). No explicit "Save" button needed in property panel.

#### Scenario: Changing fontSize updates element immediately
- **WHEN** user changes `fontSize` from 16 to 24 in property panel
- **THEN** selected Text element on canvas resizes text immediately

#### Scenario: Changing borderRadius updates Image element
- **WHEN** user sets `borderRadius: 12` on Image element
- **THEN** Image element corners round immediately

### Requirement: Property panel validates inputs
The system SHALL validate property values on change and show inline error for invalid values (e.g., negative width, invalid hex color, opacity outside 0-1). Invalid values SHALL NOT be applied to canvas until corrected.

#### Scenario: Negative width shows error
- **WHEN** user enters `-100` for element width
- **THEN** inline error "Width must be positive" appears; canvas not updated

#### Scenario: Invalid hex color shows error
- **WHEN** user enters `zzzzzz` for color
- **THEN** inline error "Invalid color format" appears

### Requirement: Image cropper for crop/scale properties
The system SHALL provide a visual cropper modal when user edits `crop` or `scale` on an Image element. The cropper SHALL show the source image with a draggable/resizeable crop rectangle, and update `crop` coordinates and `scale` in real-time.

#### Scenario: Open image cropper
- **WHEN** user clicks "Crop" button on Image element property panel
- **THEN** modal opens with source image and adjustable crop rectangle

#### Scenario: Adjusting crop updates element
- **WHEN** user resizes/moves crop rectangle in modal
- **THEN** element `crop` and `scale` update in real-time on canvas

### Requirement: Canvas-level settings in property panel
When no element is selected, the property panel SHALL show:
- Page format selector (A4-portrait, A4-landscape, Letter, Custom)
- Background config: type (color, gradient, image), value(s)
- Grid toggle (on/off)
- Canvas padding/margins

#### Scenario: Change page format
- **WHEN** user selects "A4-landscape" in property panel
- **THEN** canvas resizes to 1123×794px; elements stay in relative positions

#### Scenario: Change background to gradient
- **WHEN** user sets background type to gradient with two colors
- **THEN** canvas background updates to that gradient