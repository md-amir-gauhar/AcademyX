---
name: ui-ux-pro-max
description: Comprehensive design intelligence covering web and mobile UI/UX — 50+ design styles, 161 color palettes, 57 font pairings, 99 UX guidelines across 10 stacks.
---

Comprehensive UI/UX design intelligence. 10 technology stacks, 50+ styles, 161 palettes, 57 font pairings, 99 guidelines.

## When to Use

Required for any task involving:
- Designing new pages or screens
- Creating components
- Choosing color schemes or typography
- Reviewing UI code for quality
- UI structure, visual design decisions, interaction patterns

## Rule Categories by Priority

### Priority 1: Accessibility (CRITICAL)

- Color contrast ≥ 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- All interactive elements have visible focus states
- All images have descriptive alt text
- Full keyboard navigation support
- Screen reader compatible markup

### Priority 2: Touch & Interaction (CRITICAL)

- Minimum tap target: 44×44px
- Adequate spacing between targets to prevent mis-taps
- Visible touch feedback (ripple, opacity change)
- Swipe gestures as supplement, never sole navigation

### Priority 3: Performance (HIGH)

- Images optimized (WebP/AVIF, correct dimensions)
- Lazy loading for below-fold content
- No layout shift (CLS < 0.1)
- Critical CSS inlined

### Priority 4: Style Selection (HIGH)

- Match design style to product type and audience
- Consistent style throughout (no style mixing)
- SVG icons only (never bitmap for UI icons)
- Design tokens for all style values

### Priority 5: Layout & Responsive (HIGH)

- Mobile-first breakpoints
- Safe area insets on mobile (notch, home indicator)
- No horizontal scroll on mobile
- Flexible grid, not fixed pixel layouts

### Priority 6: Typography & Color (MEDIUM)

- Body line-height: 1.4–1.6
- Heading line-height: 1.1–1.3
- Maximum 3 type scales per screen
- Semantic color tokens (not raw hex in components)

### Priority 7: Animation (MEDIUM)

- Duration: 150–300ms for UI transitions
- Meaningful motion that aids understanding
- `prefers-reduced-motion` media query support
- No animation that causes seizure risk

### Priority 8: Forms & Feedback (MEDIUM)

- Visible labels (never placeholder-only)
- Error messages placed near the field
- Inline validation (not only on submit)
- Loading states for async actions

### Priority 9: Navigation Patterns (HIGH)

- Predictable back behavior
- Deep linking support
- Bottom nav: max 5 items
- Active state clearly indicated

### Priority 10: Charts & Data (LOW)

- Appropriate chart type for data relationship
- Accessible color encoding (not color alone)
- Tooltips for data point details
- Empty and loading states

## Usage Workflow

1. Analyze requirements (product type, audience, style keywords)
2. Select design system with `--design-system` flag
3. Apply stack-specific guidelines
4. Verify against priority 1–3 rules before shipping
