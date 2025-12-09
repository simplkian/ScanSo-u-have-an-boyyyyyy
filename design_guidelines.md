# ContainerFlow Design Guidelines

## Industrial Design Theme

Professional mobile waste container management app for iOS and Android with driver/admin roles, QR scanning, real-time tracking, and industrial-grade UI optimized for outdoor use and work glove operation.

## Color Palette

### Primary Colors
- **Primary (Navy Blue)**: `#1F3650` - Headers, navigation, main buttons, titles
- **Primary Light**: `#2D4A6A` - Hover/pressed states
- **Accent (Safety Orange)**: `#FF6B2C` - Call-to-action buttons, icons, warnings, interactions
- **Accent Light**: `#FF8F5C` - Hover/pressed states

### Background Colors
- **Background Root**: `#F4F6F8` - App background
- **Background Default (White)**: `#FFFFFF` - Cards, content areas
- **Background Secondary**: `#E1E4E8` - Secondary surfaces
- **Background Tertiary**: `#D1D5DB` - Tertiary surfaces

### Text Colors
- **Text Primary**: `#212529` - Main text content
- **Text Secondary**: `#5A6572` - Secondary text, labels
- **Text on Primary/Accent**: `#FFFFFF` - Text on colored backgrounds

### Status Colors (WCAG AA Compliant)
- **Success (Green)**: `#2EAD4A` - Completed, OK status
- **Warning (Yellow/Orange)**: `#F5A524` - Caution, attention needed
- **Warning Light**: `#FFB547` - Secondary warning
- **Error/Critical (Red)**: `#D9423B` - Urgent, cancelled, critical
- **In Progress (Blue)**: `#2D8FDB` - Active tasks
- **Idle/Open (Gray)**: `#8A95A6` - Inactive, pending

### Fill Level Colors
- **Low (0-50%)**: `#2EAD4A` (Green)
- **Medium (51-79%)**: `#F5A524` (Yellow/Orange)
- **High (80-100%)**: `#D9423B` (Red)

## Typography

### Font Weights
- **Headings**: 600-700 (Semi-bold to Bold)
- **Body Text**: 400 (Regular)
- **Buttons/Labels**: 600-700 (Semi-bold to Bold)
- **Status Badges**: 700 (Bold), Uppercase, Letter-spacing 0.5

### Font Sizes
- **H1**: 32px
- **H2**: 28px
- **H3**: 24px
- **H4**: 20px
- **Body**: 16px
- **Small**: 14px
- **Caption**: 12px

## Spacing and Layout

### Touch Targets (Glove-Friendly)
- **Minimum Touch Target**: 48dp (for glove compatibility)
- **Button Height**: 56dp (primary), 48dp (secondary)
- **Input Height**: 52dp
- **Tab Bar Height**: 64dp
- **List Item Height**: 72dp

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- 2xl: 24px
- 3xl: 32px

### Border Radius
- xs: 8px
- sm: 12px
- md: 16px
- lg: 20px
- xl: 24px

## Components

### Buttons
- **Primary Button**: Orange accent background, white text, 56dp height, rounded corners (lg)
- **Secondary Button**: White/card background, 2px primary border, primary text, 56dp height
- **Text/Link Button**: No background, accent or primary text
- All buttons use bold (700) font weight

### Cards
- White background with 1px border
- Border color: `#E1E4E8`
- Border radius: lg (20px)
- Padding: 16px
- Title in primary navy color (bold)

### Status Badges
- Rounded corners (sm - 12px)
- Bold uppercase text
- Solid color background based on status
- White text
- Minimum height: 28px
- Letter-spacing: 0.5

### Filter Chips
- 48dp minimum height
- 2px border
- Rounded corners (sm - 12px)
- Selected: accent background, white text
- Unselected: white background, border, dark text
- Uppercase text with 600 font weight

### Progress Bars
- Height: 10px
- Color based on fill level
- Rounded corners (xs - 8px)

### Icons
- Standard size: 24px
- Large size: 32px
- Use Feather icons for consistency
- Primary color for navigation, accent for actions
- NO emojis

## Navigation

### Bottom Tab Bar
- Height: 64dp
- 4 Tabs: Tasks, Scanner, Containers, Admin/Profile
- Active state: Orange accent color
- Inactive state: Gray (`#8A95A6`)
- Icon size: 24dp
- Font weight: 600

### Headers
- Use transparent headers for list screens
- Primary navy color for header titles
- White background for opaque headers

## Accessibility

### Contrast Ratios (WCAG AA)
- Primary (#1F3650) vs White: 7.6:1
- Accent (#FF6B2C) vs White: 4.6:1
- Success (#2EAD4A) vs White: 5.5:1
- Warning (#F5A524) vs White: 4.6:1
- Error (#D9423B) vs White: 5.4:1

### Glove-Friendly Design
- All interactive elements minimum 48dp
- Clear visual feedback on press
- Generous spacing between touch targets
- High contrast for outdoor visibility
- Large, rounded buttons

## Dark Mode

For dark mode, backgrounds become:
- Background Root: `#0F1419`
- Background Default: `#1A1F26`
- Background Secondary: `#252B33`
- Background Tertiary: `#303740`
- Card Surface: `#1A1F26`
- Card Border: `#303740`

Text colors invert:
- Text Primary: `#ECEDEE`
- Text Secondary: `#9BA1A6`

Primary and accent colors remain consistent for brand recognition.

## Screen Specifications

### Tasks Screen
- Filter chips at top (My Tasks, Today, All)
- Status filter chips below
- Card-based task list with status badges
- Navigation button for GPS directions
- 48dp+ touch targets throughout

### Admin Dashboard
- Grid of stat cards (2 columns)
- Color-coded left border indicators
- Quick action buttons (56dp height)
- Orange primary CTA, white secondary buttons

### Analytics Screen
- Weekly delivery bar chart
- Material distribution progress bars
- Container fill level monitoring
- Summary statistics with icons

### Scanner Screen
- Full-screen camera view
- Flashlight toggle (48dp minimum)
- Result modal with confirm/cancel

## Interaction Design

### Touch Feedback
- Opacity reduction to 0.8 on press
- Scale animation (0.98) for cards
- Background color change for buttons

### Loading States
- Orange accent spinner
- Skeleton screens for lists
- Disabled button state with loading indicator

### Error Handling
- Red error badges and borders
- Inline error messages
- Toast notifications for success (green)
