## ADDED Requirements

### Requirement: Element type palette defines 7 supported element types
The system SHALL define exactly 7 element types for v1, each with a unique `type` identifier, display label, icon, and default property schema. No additional element types SHALL be added without a spec update.

#### Scenario: Element type registry contains all 7 types
- **WHEN** Canvas Editor initializes
- **THEN** element palette contains: `image`, `text`, `category`, `product`, `separator`, `decorative`, `logo`

### Requirement: Image element type schema
The system SHALL define the `image` element type with the following configurable properties:
- `src` (string): base64 data URL or image URL (required)
- `alt` (string): accessibility text
- `width` (number, px): default 300
- `height` (number, px): default 200
- `x` (number, px): horizontal position
- `y` (number, px): vertical position
- `borderRadius` (number, px): default 0
- `opacity` (number, 0-1): default 1
- `objectFit` (enum: `cover`, `contain`, `fill`, `none`): default `cover`
- `scale` (number): default 1 (for zoom/crop)
- `crop` (object): `{ x, y, width, height }` in source image coordinates

#### Scenario: Image element has required properties
- **WHEN** Image element is created
- **THEN** it has all properties defined with valid defaults

### Requirement: Text element type schema
The system SHALL define the `text` element type with properties:
- `content` (string): the text content (required)
- `fontFamily` (string): e.g., `system-ui`, `Georgia`, `Roboto` (default: theme default)
- `fontSize` (number, px): default 16
- `fontWeight` (enum: `normal`, `medium`, `semibold`, `bold`): default `normal`
- `color` (string, hex): default theme text color
- `textAlign` (enum: `left`, `center`, `right`, `justify`): default `left`
- `lineHeight` (number): default 1.5
- `letterSpacing` (string): default `normal`
- `width` (number, px): auto by default
- `x`, `y` (number, px): position

#### Scenario: Text element has required properties
- **WHEN** Text element is created
- **THEN** it has all properties with valid defaults

### Requirement: Category element type schema
The system SHALL define the `category` element type for section headers with properties:
- `title` (string): category name (required)
- `fontFamily`, `fontSize`, `fontWeight`, `color`, `textAlign` (same as Text)
- `separator` (boolean): show separator line below (default true)
- `separatorColor`, `separatorWidth`, `separatorStyle` (line config)
- `paddingTop`, `paddingBottom` (number, px): spacing around title
- `x`, `y`, `width` (position/size)

#### Scenario: Category element includes separator config
- **WHEN** Category element is created
- **THEN** it has `separator: true` and line styling defaults

### Requirement: Product element type schema
The system SHALL define the `product` element type for menu items with properties:
- `name` (string): product name (required)
- `description` (string): optional description
- `price` (string): formatted price e.g., "$12.50" (required)
- `nameFont`, `nameSize`, `nameWeight`, `nameColor` (name styling)
- `descFont`, `descSize`, `descColor` (description styling)
- `priceFont`, `priceSize`, `priceWeight`, `priceColor` (price styling)
- `layout` (enum: `horizontal`, `vertical`): default `horizontal` (name/price same line)
- `spacing` (number, px): between name and price
- `showPrice` (boolean): default true
- `x`, `y`, `width` (position/size)

#### Scenario: Product element has dual layout option
- **WHEN** Product element created
- **THEN** `layout` defaults to `horizontal` with `spacing: 16`

### Requirement: Separator element type schema
The system SHALL define the `separator` element type for horizontal lines with properties:
- `color` (string, hex): default theme secondary color
- `width` (number, px): line thickness, default 1
- `style` (enum: `solid`, `dashed`, `dotted`, `double`): default `solid`
- `length` (number, px or `%`): default 100%
- `x`, `y` (position)
- `marginTop`, `marginBottom` (number, px): spacing

#### Scenario: Separator has style options
- **WHEN** Separator created
- **THEN** `style` defaults to `solid`, `width: 1`

### Requirement: Decorative element type schema
The system SHALL define the `decorative` element type for visual flourishes (icons, shapes, dividers) with properties:
- `kind` (enum: `divider-icon`, `flourish`, `corner-accent`, `custom-svg`): default `divider-icon`
- `src` (string): for custom SVG, base64 or URL
- `color` (string, hex): icon color
- `width`, `height` (number, px): default 48
- `opacity` (number, 0-1): default 1
- `x`, `y` (position)
- `rotation` (number, degrees): default 0

#### Scenario: Decorative element supports icon kinds
- **WHEN** Decorative element created
- **THEN** `kind` defaults to `divider-icon`

### Requirement: Logo element type schema
The system SHALL define the `logo` element type for restaurant branding with properties:
- `src` (string): base64 data URL or URL (required)
- `alt` (string): accessibility
- `width`, `height` (number, px): default 120×120
- `borderRadius` (number, px): default 0
- `opacity` (number, 0-1): default 1
- `x`, `y` (position)
- `linkUrl` (string): optional click target

#### Scenario: Logo element requires image source
- **WHEN** Logo element created without `src`
- **THEN** placeholder shows until image provided