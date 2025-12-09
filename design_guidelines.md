# Container Management App - Design Guidelines

## Overview
Professional mobile waste container management app for iOS & Android with driver/admin roles, QR scanning, real-time tracking, and industrial-grade UI optimized for outdoor use and work glove operation.

## Authentication & User Roles

### Authentication Flow
- **Required**: Email/password authentication with Firebase
- **Two Roles**: Driver (field operations) and Admin (management dashboard)
- **No Self-Registration**: Only admins can create user accounts
- Login screen includes link explaining admin-only registration
- Profile screen includes logout and account management options

### Role-Based Navigation
- **Driver Access**: Tasks, Scanner, Containers (customer + warehouse), Profile
- **Admin Access**: All driver features + Admin Dashboard with management tools

## Navigation Architecture

### Root Navigation: Bottom Tab Bar
- **4 Tabs Total**: Home (Tasks), Scanner, Containers, Profile/Admin
- **Tab Bar Specifications**:
  - Height: 60dp
  - Background: White with subtle upward shadow
  - Active state: Orange (#FF6B35) icon + text
  - Inactive state: Gray (#9E9E9E) icon + text
  - Icon size: 24dp
  - Tab icons: List (Tasks), QR-Code (Scanner), Box (Containers), Person/Dashboard (Profile/Admin)

### Screen Navigation Patterns
- **Stack navigation** within each tab for detail views
- **Native modals** for confirmation dialogs, QR scan results, alerts
- **Safe area insets**: All screens respect tab bar height + spacing

## Screen Specifications

### 1. Tasks Screen (Home Tab)

**Layout**:
- Default navigation header (transparent)
- Scrollable list as main content
- Top filter bar (chips/buttons) pinned below header
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

**Components**:
- Filter chips: "My Tasks" (default), "Today", "All"
- Status filter buttons: Open (Gray), In Progress (Blue), Completed (Green), Cancelled (Red)
- Task cards with: container number, location, time window, material type, status badge
- "Details" button on each card

**Task Detail Screen**:
- Stack navigation (not modal)
- Container information, materials, estimated quantity
- Pickup instructions
- "Start Navigation" button (opens native maps)
- "Scan QR Code" button (switches to Scanner tab)

### 2. Scanner Screen

**Layout**:
- Full-screen camera view with QR alignment overlay
- Transparent header with close button
- Floating flashlight toggle button (bottom right)
- No tab bar visible during scanning

**Components**:
- Camera viewfinder with centered alignment grid/frame
- Flashlight button: 48x48dp minimum, orange accent color, subtle drop shadow (offset: 0,2 | opacity: 0.10 | radius: 2)
- Result modal: Shows container info with confirm/cancel actions

**Interaction Flow**:
1. Pickup scan → Display container details → Confirm pickup → Record timestamp + GPS
2. Delivery scan → Validate material match + capacity → Confirm delivery → Update fill level

### 3. Containers Screen

**Layout**:
- Two sub-tabs: "Customer Containers" and "Warehouse"
- Searchable/filterable lists
- Card-based layout for each container

**Customer Container Cards**:
- Container ID (prominent)
- Location (hall/room)
- Material type
- Last emptied date
- Current status badge

**Warehouse Container Cards**:
- Container ID and location
- Material type
- **Visual fill-level tracker**: Horizontal progress bar with percentage
- Current amount / Max capacity (in kg)
- Color-coded fill levels:
  - 0-50%: Green (#4CAF50)
  - 51-79%: Yellow/Orange (#FFA726)
  - 80-100%: Red (#E53935)
- Warning badge "Almost Full" when ≥80%

**Container Detail View**:
- Fill history chart/graph
- List of recent additions (date, amount, task reference)
- Display QR code for re-scanning

### 4. Admin Dashboard (Admin Role Only)

**Layout**:
- Grid of overview cards (2 columns on phone, more on tablet)
- Quick action buttons below cards
- Scrollable content

**Overview Cards**:
- Today's Tasks: Open count, Completed count, Active drivers
- Container Status: Critical containers (≥80%), Total available capacity
- Each card uses icon + large number + descriptive label

**Quick Actions** (orange buttons):
- Create New Task
- Manage Drivers
- Edit Containers

**Admin Detail Screens**:
- **Task Management**: List all tasks, filter by date/driver/status, create new task form (dropdown selectors for container + driver, time picker, priority, notes field)
- **Container Management**: CRUD operations, material type editor, capacity adjuster, manual fill reset with timestamp
- **Driver Management**: List drivers, create account (email + auto-generated password), deactivate/delete, view activity log
- **Activity Log**: Filterable table (date range, driver, container, action type), exportable

## Design System

### Color Palette

**Primary Colors**:
- Dark Blue: `#1E3A5F` (headers, navigation, primary buttons)
- Orange: `#FF6B35` (CTA buttons, icons, accents, active states)

**Background & Surfaces**:
- Light Gray: `#F5F5F5` (app background)
- White: `#FFFFFF` (cards, dialogs, tab bar)

**Text Colors**:
- Dark Gray: `#333333` (primary text)
- Medium Gray: `#757575` (secondary text, captions)

**Status Colors**:
- Green (Completed/OK): `#4CAF50`
- Yellow/Orange (Warning): `#FFA726`
- Red (Urgent/Error): `#E53935`
- Blue (In Progress): `#42A5F5`
- Gray (Open/Neutral): `#9E9E9E`

### Typography

**Font Family**: Roboto (system default for React Native)

**Scale**:
- Headline: Roboto Bold, 24sp
- Title: Roboto Medium, 20sp
- Body: Roboto Regular, 16sp
- Caption: Roboto Regular, 14sp, Gray color

**Requirements**:
- High contrast ratios (minimum 4.5:1) for outdoor readability
- No font size below 14sp

### UI Components

**Buttons**:
- Minimum height: 48dp (work glove friendly)
- Border radius: 8-12dp (rounded corners)
- Primary button: Orange background, white text, bold
- Secondary button: Transparent background, blue border, blue text
- Text size: Bold, minimum 16sp
- Visual feedback: Reduced opacity (0.7) on press

**Cards**:
- Background: White
- Elevation: 2-4dp subtle shadow
- Border radius: 12dp
- Padding: 16dp internal spacing
- Separation: 12dp vertical gap between cards or 1dp gray divider lines

**Icons**:
- Use Feather icons from @expo/vector-icons (no emojis)
- Standard size: 24dp
- Large (important actions): 32dp
- Color: Dark blue or orange based on context
- Minimalist, clearly recognizable

**Form Inputs**:
- Minimum height: 48dp
- Border: 1-2dp, gray when inactive, blue when focused
- Border radius: 8dp
- Clear label above or placeholder text
- Error state: Red border + error message below

**Progress Bars** (for fill levels):
- Height: 8-12dp
- Full width of container
- Rounded ends
- Animated fill transition
- Color matches fill percentage thresholds

**Badges** (for status):
- Small pill-shaped components
- Color-coded background matching status
- White text, uppercase, 12sp
- Padding: 4dp vertical, 8dp horizontal

**Floating Action Buttons** (Scanner flashlight, etc.):
- Size: 56x56dp or 48x48dp minimum
- Shadow specifications:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Orange background for primary actions
- White icon, 24dp

### Accessibility

**WCAG Compliance**:
- Text contrast: Minimum 4.5:1 ratio
- Interactive elements: Minimum 44x44dp touch target (optimized for 48dp for gloved hands)
- Screen reader support for all critical UI elements
- Support for system large text settings

**Field Optimization**:
- High contrast throughout for outdoor visibility
- Large touch targets for operation with work gloves
- Clear visual hierarchy
- Generous spacing between interactive elements

## Assets & Icons

### Required Icons
- System icons from Feather set for: list, QR code, box/package, person, dashboard, search, filter, map pin, camera, flashlight, check, x, alert triangle, info
- NO custom illustrations or emojis
- All icons must be clearly recognizable at 24dp size

### Custom Assets
- QR codes generated dynamically for each container
- No decorative images needed
- Profile avatars: Use initials in colored circles (auto-generated from driver names)

## Push Notifications

**Notification Triggers**:
- Pickup confirmed → Alert admin
- Delivery confirmed → Alert admin
- 80% fill level reached → Alert admin + all drivers
- New task assigned → Alert assigned driver
- Task cancelled → Alert admin

**Notification Content**:
- Short title: Action type + container ID
- Body: Key details (driver name, location, reason)
- Deep link to relevant screen when tapped

## Interaction Design

### Touch Feedback
- All touchable elements show visual feedback (opacity reduction to 0.7 or background color change)
- Haptic feedback on critical actions (scan confirmation, task completion)

### Transitions
- Smooth stack navigation (slide from right on iOS, default on Android)
- Fade transitions for modal dialogs
- Animated progress bar updates (smooth fill level changes)

### Loading States
- Spinner with orange accent color for async operations
- Skeleton screens for list loading
- Disabled state for buttons during submission (reduced opacity + loading spinner)

### Error Handling
- Red alert dialogs for errors
- Inline error messages below form fields
- Toast notifications for success confirmations (green background, white text, auto-dismiss after 3 seconds)