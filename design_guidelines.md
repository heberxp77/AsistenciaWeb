# Design Guidelines: University Attendance Management System

## Design Approach
**Design System Approach** - Material Design with professional academic customization. This utility-focused application prioritizes efficiency, clarity, and data management over visual flair.

## Layout System

**Spacing Scale:** Use Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Container margins: m-4, m-8

**Page Structure:**
- Persistent sidebar navigation (w-64) on desktop, collapsible on mobile
- Top navigation bar with user profile, notifications, and quick actions
- Main content area with max-w-7xl container
- Breadcrumb navigation for deep hierarchies

## Typography

**Font Family:** Inter via Google Fonts (primary), Roboto (fallback)

**Hierarchy:**
- Page titles: text-3xl font-bold
- Section headers: text-2xl font-semibold
- Card titles: text-xl font-medium
- Body text: text-base font-normal
- Labels: text-sm font-medium uppercase tracking-wide
- Helper text: text-sm text-gray-600

## Core Components

### Navigation
**Sidebar:**
- Role-based menu items with icons (Heroicons)
- Active state with background highlight and left border accent
- Collapsible sub-menus for hierarchical navigation
- Role badge at top (Admin/Docente/Responsable)

**Top Bar:**
- University logo/name (left)
- Search bar (center) for quick access
- Notifications bell icon, user avatar dropdown (right)

### Data Tables
**Attendance Lists & Reports:**
- Striped rows for readability
- Sortable column headers with arrow indicators
- Row hover state for interaction clarity
- Action buttons (edit, delete, view) aligned right
- Pagination footer with page numbers and items-per-page selector
- Filter pills above table showing active filters with x-close buttons

### Forms
**Attendance Entry & Administration:**
- Single-column layouts for narrow forms, two-column for wide screens
- Floating labels for input fields
- Dropdown selects with search for long lists (schools, programs, students)
- Toggle switches for presence/absence with clear yes/no indicators
- File upload area with drag-drop zone for justification scans
- Textarea for justification notes with character counter
- Primary action button (right-aligned), secondary cancel (left)

### Cards
**Group Cards, Student Cards:**
- Elevated shadow (shadow-md) on white background
- Header with title and meta info (date, time, status badge)
- Divided sections with border-t for different data groups
- Icon indicators for quick status recognition

### Status Badges
- Present: Green pill with checkmark icon
- Absent: Red pill with x icon
- Justified: Yellow pill with document icon
- Rounded-full px-3 py-1 text-sm styling

### Dashboard Widgets
**For Area Managers:**
- Stat cards in 4-column grid (grid-cols-4): Total students, Present today, Absent, Justified
- Large number (text-4xl font-bold) with label below
- Trend indicators (up/down arrows) with percentage change
- Line charts for attendance over time (use Chart.js)
- Bar charts for comparison by program/shift

### Modals & Overlays
- Centered modal with backdrop (backdrop-blur-sm)
- Modal max-width: max-w-2xl for forms, max-w-4xl for data views
- Clear close button (x) in top-right
- Action buttons in footer (right-aligned)

## Role-Specific Layouts

### Administrator Dashboard
- Quick stats overview at top
- Recent activity feed
- Direct links to all CRUD operations
- System health indicators

### Teacher Interface
- Active groups prominently displayed as cards
- Quick-access attendance entry
- Calendar view of scheduled classes
- Pending justifications alert banner

### Area Manager Dashboard
- Filter bar with dropdowns: Turno, Carrera, Docente, Grupo
- Export button for reports (PDF/Excel)
- Date range selector
- Real-time attendance statistics

## Interactions

**Minimal Animations:**
- Smooth transitions on dropdown opens (transition-all duration-200)
- Gentle fade-in for modals
- NO scroll animations, parallax, or decorative motion

**Feedback:**
- Toast notifications (top-right) for actions: success (green), error (red), info (blue)
- Loading spinners for async operations
- Disabled state styling for unavailable actions

## Images

**No hero images** - This is a functional application, not a marketing site.

**Profile Photos:**
- Student/teacher avatars in circular frames (rounded-full) 
- 40px for list items, 80px for profile headers
- Placeholder initials for missing photos

**Justification Documents:**
- Thumbnail preview in table cells (64px square)
- Full-size viewer in modal on click
- PDF icon placeholder for non-image files

## Accessibility
- Consistent focus rings on all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation for all forms and tables
- High contrast text (WCAG AA minimum)
- Form validation with clear error messages below fields