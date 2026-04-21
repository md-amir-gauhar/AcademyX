Create a frontend-only application. APIs and backend already exist. Build scalable architecture ready for API integration using mock service layers, hooks, and reusable components.

The platform must help students:

Discover courses
Enroll and track progress
Watch lessons
Take quizzes/tests
Practice exercises
Join live classes
Chat with mentors
View analytics
Stay motivated with streaks / gamification
Manage subscriptions
Use mobile seamlessly
TECH STACK

Use:

Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
Zustand or Redux Toolkit
React Query / TanStack Query
React Hook Form + Zod
Recharts
Lucide Icons
next-themes
Axios service layer
Sonner toast notifications

Use best practices:

component-driven architecture
modular folders
scalable state management
lazy loading
route groups
SEO metadata
accessibility (WCAG)
keyboard navigation
dark/light mode
skeleton loaders
error boundaries
DESIGN SYSTEM

Create a premium visual language:

Style
modern glassmorphism + clean cards
subtle gradients
soft shadows
rounded-2xl corners
layered depth
elegant spacing
high readability
Colors

Primary:

Indigo #6366F1
Violet #8B5CF6

Secondary:

Emerald #10B981
Sky #0EA5E9

Dark theme:

Zinc / Slate tones

Success:

Green

Warning:

Amber

Danger:

Rose
Typography

Use Inter / Geist / Satoshi style fonts.

Hierarchy:

Hero: 48-64px bold
Section titles: 32px
Cards: 18-24px
Body: 15-16px
PAGES TO BUILD
1. Landing Page (High Conversion)

Sections:

Hero
headline:
“Learn Smarter. Grow Faster.”
animated CTA buttons
student illustration / 3D gradient scene
trust badges
live stats counter
Social Proof
testimonials carousel
company/university logos
ratings
Featured Courses
cards with hover animation
How It Works

3-step process timeline

Why Choose Us

comparison section

Pricing preview
FAQ accordion
Final CTA
2. Auth Pages
Sign In
Sign Up
Forgot Password
OTP Verification
Social login UI

Use split-screen modern layout.

3. Student Dashboard

Must feel premium like SaaS dashboard.

Widgets:

Continue Learning
Weekly Goal Progress
Upcoming Live Classes
Recommended Courses
XP / Streak
Time Spent
Certificates Earned
Notifications

Charts + motion cards.

4. Course Marketplace

Filters:

category
price
rating
duration
level
language

Features:

grid/list toggle
search
trending tags
wishlist
compare courses

Course card:

thumbnail
instructor
rating
students count
lessons
CTA
5. Course Detail Page

Sections:

sticky preview player
curriculum accordion
instructor profile
reviews
what you’ll learn
prerequisites
certificate info
related courses
enroll CTA
6. Video Learning Interface

Build immersive learning UI.

Layout:

Left:

video player

Right:

lesson playlist

Bottom Tabs:

Notes
Resources
Transcript
Discussion
Quiz

Top:

breadcrumbs
progress bar

Extras:

playback speed
bookmarks
resume last position
auto next lesson
7. Quiz / Exam Interface

Need engaging test UI.

Features:

timer
question palette
mark for review
MCQ / multi-select / coding / descriptive
progress tracker
submit confirmation
results analytics

Gamified completion animation.

8. Practice Zone
flashcards
drag/drop exercises
typing practice
coding playground UI
revision sets
9. Live Classes Page
calendar schedule
join room CTA
upcoming sessions
reminders
mentor cards
10. Community Page
discussion threads
study groups
leaderboards
comments
reactions
11. Subscription / Billing
plans comparison
invoices
payment methods
coupons
upgrade flow
12. Profile Settings

Tabs:

account
notifications
privacy
security
certificates
downloads
ADMIN PANEL (Optional but build structure)

Pages:

users
courses
instructors
analytics
revenue
support tickets
CMS
COMPONENTS TO CREATE

Reusable components:

Navbar
Sidebar
Mobile bottom nav
Search command palette
CourseCard
InstructorCard
StatsCard
ProgressRing
PricingCard
QuizCard
EmptyState
Skeleton loaders
Charts
Modals
Data tables
Accordions
Tabs
Toasts
UX MICRO INTERACTIONS

Add delightful interactions:

hover lift cards
shimmer buttons
animated counters
page transitions
skeleton pulse loading
confetti on completion
progress celebrations
subtle parallax hero
RESPONSIVENESS

Must be perfect on:

Mobile
Tablet
Laptop
Desktop
Ultra wide

Use mobile-first layout.

PERFORMANCE

Optimize:

image lazy loading
route streaming
code splitting
memoization
virtualization for large lists
smooth 60fps animations
ACCESSIBILITY
semantic HTML
keyboard nav
focus states
aria labels
color contrast
reduced motion support
FILE STRUCTURE

Use enterprise-level structure:

/app
/components
/features
/hooks
/services
/store
/types
/lib
/constants

API INTEGRATION READY

Create mock API interfaces:

authService.ts
courseService.ts
dashboardService.ts
quizService.ts
paymentService.ts

Use React Query hooks.

STATE MANAGEMENT

Use global state for:

auth user
theme
cart
wishlist
notifications
current lesson progress
SPECIAL PREMIUM FEATURES

Include:

AI study assistant floating chat widget
Smart recommendations carousel
Daily streak animation
Achievement badges
Personalized dashboard
Resume learning instantly
Offline downloads UI
Multi-language toggle