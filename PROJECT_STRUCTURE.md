# Project Structure

This document outlines the complete file structure and organization of the Beside Rental Platform.

## 📁 Root Directory

```
beside-rental-platform/
├── 📄 README.md                    # Project overview and setup guide
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 DEPLOYMENT.md                # Deployment instructions
├── 📄 SECURITY.md                  # Security policy and guidelines
├── 📄 LICENSE                      # MIT License
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .dockerignore                # Docker ignore rules
├── 📄 Dockerfile                   # Docker container configuration
├── 📄 vercel.json                  # Vercel deployment configuration
├── 📄 package.json                 # Dependencies and scripts
├── 📄 next.config.mjs              # Next.js configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 postcss.config.mjs           # PostCSS configuration
├── 📄 components.json              # shadcn/ui configuration
└── 📁 .github/                     # GitHub workflows and templates
    └── 📁 workflows/
        └── 📄 ci-cd.yml            # CI/CD pipeline
```

## 📁 Application Structure (`/app`)

### Core Pages
```
app/
├── 📄 layout.tsx                   # Root layout with providers
├── 📄 page.tsx                     # Homepage with featured items
├── 📄 loading.tsx                  # Global loading component
├── 📄 globals.css                  # Global styles
```

### Authentication Pages
```
app/
├── 📄 login/page.tsx               # User login page
├── 📄 signup/page.tsx              # User registration page
```

### Item Management
```
app/items/
├── 📄 page.tsx                     # Browse all items
├── 📄 loading.tsx                  # Items loading state
├── 📁 [id]/                       # Dynamic item pages
│   ├── 📄 page.tsx                 # Item detail page
│   └── 📄 ItemPageClient.tsx       # Client-side item component
├── 📁 new/                        # Create new listing
│   └── 📄 page.tsx                 # Item creation form
├── 📁 book/                       # Booking flow
│   └── 📄 page.tsx                 # Booking confirmation
└── 📁 [category]/                 # Category-specific pages
    ├── 📄 electronics/page.tsx
    ├── 📄 furniture/page.tsx
    ├── 📄 vehicles/page.tsx
    ├── 📄 tools/page.tsx
    ├── 📄 sports/page.tsx
    ├── 📄 others/page.tsx
    └── 📄 travel-gare/page.tsx
```

### User Dashboard
```
app/
├── 📄 my-items/page.tsx            # User's listed items
├── 📄 booking-history/page.tsx     # Booking history
├── 📄 favorites/page.tsx           # Saved/favorited items
├── 📄 profile/page.tsx             # User profile view
├── 📄 settings/page.tsx            # Account settings
└── 📄 notifications/page.tsx       # User notifications
```

### API Routes
```
app/api/
├── 📁 auth/                        # Authentication endpoints
│   ├── 📁 [...nextauth]/
│   │   └── 📄 route.ts             # NextAuth configuration
│   ├── 📄 login/route.ts           # Login endpoint
│   ├── 📄 signup/route.ts          # Registration endpoint
│   └── 📄 change-password/route.ts # Password change
├── 📁 items/                       # Item management
│   ├── 📄 route.ts                 # CRUD operations
│   ├── 📁 [id]/
│   │   ├── 📄 route.ts             # Individual item operations
│   │   ├── 📄 booked-dates/route.ts # Booking dates management
│   │   ├── 📄 unavailable/route.ts  # Availability management
│   │   └── 📁 bookings/
│   │       ├── 📄 route.ts         # Booking operations
│   │       └── 📄 route_new.ts     # Enhanced booking logic
│   └── 📁 [category]/             # Category-specific endpoints
│       ├── 📄 furniture/route.ts
│       └── 📄 travel-gare/route.ts
├── 📁 bookings/                    # Booking system
│   ├── 📄 route.ts                 # Booking operations
│   └── 📄 history/route.ts         # Booking history
├── 📁 users/                       # User management
│   └── 📁 [email]/
│       ├── 📄 route.ts             # User profile operations
│       ├── 📄 items/route.ts       # User's items
│       └── 📄 favorites/route.ts   # User favorites
├── 📁 reviews/                     # Review system
│   ├── 📁 [id]/
│   │   └── 📄 route.ts             # Individual review operations
│   ├── 📄 helpfulness/route.ts     # Review helpfulness votes
│   └── 📄 report/route.ts          # Report inappropriate reviews
├── 📁 user/                        # User-specific operations
│   ├── 📄 reviewable-bookings/route.ts # Bookings eligible for review
│   └── 📄 reviews/route.ts         # User's reviews
├── 📄 upload/route.ts              # Image upload handling
└── 📄 notifications/route.ts       # Notification system
```

## 📁 Components (`/components`)

### Core Components
```
components/
├── 📄 auth-provider.tsx            # Authentication context
├── 📄 navbar.tsx                   # Main navigation
├── 📄 theme-provider.tsx           # Theme context
├── 📄 client-root.tsx              # Client-side root wrapper
└── 📄 protected-route.tsx          # Route protection
```

### Feature Components
```
components/
├── 📄 booking-calendar.tsx         # Interactive booking calendar
├── 📄 calendar-manager.tsx         # Calendar management
├── 📄 account-settings.tsx         # User account settings
├── 📄 notification-dropdown.tsx    # Notification UI
├── 📄 rating-summary.tsx           # Rating display
├── 📄 review-prompt.tsx            # Review prompts
├── 📄 review-submission-form.tsx   # Review submission
├── 📄 reviews-display.tsx          # Review listings
├── 📄 user-reviews.tsx             # User review management
└── 📄 simple-item-test.tsx         # Testing component
```

### UI Components (`/components/ui`)
```
components/ui/
├── 📄 button.tsx                   # Button variants
├── 📄 input.tsx                    # Input fields
├── 📄 card.tsx                     # Card layouts
├── 📄 dialog.tsx                   # Modal dialogs
├── 📄 dropdown-menu.tsx            # Dropdown menus
├── 📄 calendar.tsx                 # Calendar picker
├── 📄 form.tsx                     # Form utilities
├── 📄 toast.tsx                    # Toast notifications
├── 📄 avatar.tsx                   # User avatars
├── 📄 badge.tsx                    # Status badges
├── 📄 select.tsx                   # Select dropdowns
├── 📄 textarea.tsx                 # Text areas
├── 📄 checkbox.tsx                 # Checkboxes
├── 📄 radio-group.tsx              # Radio buttons
├── 📄 switch.tsx                   # Toggle switches
├── 📄 slider.tsx                   # Range sliders
├── 📄 progress.tsx                 # Progress bars
├── 📄 tabs.tsx                     # Tab navigation
├── 📄 accordion.tsx                # Collapsible content
├── 📄 alert.tsx                    # Alert messages
├── 📄 sheet.tsx                    # Side panels
├── 📄 popover.tsx                  # Popup content
├── 📄 tooltip.tsx                  # Hover tooltips
├── 📄 table.tsx                    # Data tables
├── 📄 pagination.tsx               # Page navigation
├── 📄 breadcrumb.tsx               # Navigation breadcrumbs
├── 📄 carousel.tsx                 # Image carousels
├── 📄 command.tsx                  # Command palette
├── 📄 context-menu.tsx             # Right-click menus
├── 📄 hover-card.tsx               # Hover cards
├── 📄 menubar.tsx                  # Menu bars
├── 📄 navigation-menu.tsx          # Navigation menus
├── 📄 scroll-area.tsx              # Scrollable areas
├── 📄 separator.tsx                # Visual separators
├── 📄 skeleton.tsx                 # Loading skeletons
├── 📄 collapsible.tsx              # Collapsible sections
├── 📄 drawer.tsx                   # Bottom drawers
├── 📄 resizable.tsx                # Resizable panels
├── 📄 sidebar.tsx                  # Sidebar layouts
├── 📄 toggle.tsx                   # Toggle buttons
├── 📄 toggle-group.tsx             # Toggle groups
├── 📄 aspect-ratio.tsx             # Aspect ratio containers
├── 📄 chart.tsx                    # Chart components
├── 📄 input-otp.tsx                # OTP input
├── 📄 sonner.tsx                   # Sonner toast
├── 📄 toaster.tsx                  # Toast container
├── 📄 alert-dialog.tsx             # Alert dialogs
├── 📄 drag-drop-upload.tsx         # File upload with drag/drop
├── 📄 image-editor.tsx             # Image editing
├── 📄 enhanced-error-handler.tsx   # Error handling
├── 📄 use-mobile.tsx               # Mobile detection hook
├── 📄 use-toast.ts                 # Toast utilities
└── 📄 label.tsx                    # Form labels
```

## 📁 Hooks (`/hooks`)

```
hooks/
├── 📄 use-image-upload.ts          # Image upload functionality
├── 📄 use-enhanced-image-upload.ts # Enhanced upload with compression
├── 📄 use-mobile.tsx               # Mobile device detection
└── 📄 use-toast.ts                 # Toast notification management
```

## 📁 Library (`/lib`)

```
lib/
├── 📄 supabase.ts                  # Supabase client configuration
├── 📄 supabase-db.ts               # Database operations
├── 📄 database.ts                  # Database utilities
├── 📄 user-database.ts             # User-specific database operations
├── 📄 cloudinary.ts                # Cloudinary image service
├── 📄 image-compression.ts         # Image compression utilities
├── 📄 upload-performance.ts        # Upload performance monitoring
├── 📄 booking-utils.ts             # Booking-related utilities
├── 📄 item-store.ts                # Item data management
└── 📄 utils.ts                     # General utility functions
```

## 📁 Public Assets (`/public`)

```
public/
├── 📄 placeholder.jpg              # Default item image
├── 📄 placeholder.svg              # SVG placeholder
├── 📄 placeholder-user.jpg         # Default user avatar
├── 📄 placeholder-logo.png         # App logo (PNG)
└── 📄 placeholder-logo.svg         # App logo (SVG)
```

## 📁 Styles (`/styles`)

```
styles/
└── 📄 globals.css                  # Global CSS styles and Tailwind imports
```

## 🔧 Configuration Files

### Next.js & Build
- `next.config.mjs` - Next.js configuration with optimizations
- `tsconfig.json` - TypeScript compiler configuration
- `postcss.config.mjs` - PostCSS configuration for Tailwind

### Package Management
- `package.json` - Dependencies, scripts, and project metadata
- `pnpm-lock.yaml` - Lockfile for reproducible installs

### UI Framework
- `components.json` - shadcn/ui component configuration

### Deployment
- `vercel.json` - Vercel deployment settings
- `Dockerfile` - Container configuration
- `.dockerignore` - Docker build context exclusions

### Development
- `.gitignore` - Git exclusion rules
- `.env.example` - Environment variables template

## 📊 Key Metrics

- **Total Files**: 150+ TypeScript/React files
- **Components**: 50+ reusable UI components
- **API Routes**: 25+ REST endpoints
- **Pages**: 15+ user-facing pages
- **Hooks**: 4 custom React hooks
- **Utilities**: 10+ helper libraries

## 🏗 Architecture Principles

1. **Modular Design**: Each feature is self-contained
2. **Type Safety**: Full TypeScript coverage
3. **Reusable Components**: DRY principle with UI components
4. **API-First**: Clean separation between frontend and backend
5. **Performance**: Optimized images, lazy loading, and caching
6. **Security**: Row-level security, input validation, and secure headers
7. **Accessibility**: WCAG compliant UI components
8. **Responsive**: Mobile-first design approach

This structure provides a scalable foundation for a modern rental marketplace platform.
