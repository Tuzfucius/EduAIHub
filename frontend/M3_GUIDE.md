# Material Design 3 Implementation Guide

## Overview

This project uses **Material Design 3 (M3)** as its design system, implemented with **Tailwind CSS v4**.

- **UI Library**: Tailwind CSS v4 (configured with M3 tokens)
- **Color Scheme**: M3 Baseline (Purple)
- **Design Tokens**: CSS custom properties + Tailwind theme extension

---

## Color System

### Primary Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--md-primary` | #6750A4 | #D0BCFF | Main brand color |
| `--md-on-primary` | #FFFFFF | #381E72 | Text/icons on primary |
| `--md-primary-container` | #EADDFF | #4F378B | Filled tonal areas |
| `--md-on-primary-container` | #21005D | #EADDFF | Text in containers |

### Secondary Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--md-secondary` | #625B71 | #CCC2DC | Secondary actions |
| `--md-secondary-container` | #E8DEF8 | #4A4458 | Secondary tonal areas |

### Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--md-surface` | #FEF7FF | #141218 | Main background |
| `--md-surface-container` | #F3EDF7 | #211F26 | Component backgrounds |
| `--md-surface-variant` | #E7E0EC | #49454F | Subtle backgrounds |

### Tailwind Usage

```tsx
// Using Tailwind utility classes
<div className="bg-md-primary text-md-on-primary">
  Primary background
</div>

// Using CSS variables
<div style={{ backgroundColor: 'var(--md-primary)' }}>
  Custom usage
</div>
```

---

## Shape System (Border Radius)

| Size | Token | Value | Usage |
|------|-------|-------|-------|
| Extra Small | `rounded-xs` | 4px | Small chips, badges |
| Small | `rounded-sm` | 8px | Text fields, small cards |
| Medium | `rounded-md` | 12px | Cards, dialogs |
| Large | `rounded-lg` | 16px | Large cards |
| Extra Large | `rounded-xl` | 28px | Bottom sheets, FABs |
| Full | `rounded-full` | 9999px | Circular buttons, avatars |

### Tailwind Usage

```tsx
<div className="rounded-xl">Extra Large (28dp)</div>
<div className="rounded-full">Circular</div>
```

---

## Elevation System

| Level | Token | Shadow | Usage |
|-------|-------|--------|-------|
| 1 | `elevation-1` | 0px 1px 3px | Cards, buttons |
| 2 | `elevation-2` | 0px 2px 6px | Floating elements |
| 3 | `elevation-3` | 0px 4px 8px | Dialogs, nav bars |
| 4 | `elevation-4` | 0px 8px 12px | Large dialogs |
| 5 | `elevation-5` | 0px 12px 16px | Full-screen dialogs |

### Tailwind Usage

```tsx
<div className="elevation-2">Elevated Card</div>
```

---

## Typography Scale

| Style | Font Size | Line Height | Letter Spacing | Weight |
|-------|-----------|-------------|----------------|--------|
| Display Large | 57px | 64px | -0.25px | 400 |
| Display Medium | 45px | 52px | 0 | 400 |
| Display Small | 36px | 44px | 0 | 400 |
| Headline Large | 32px | 40px | 0 | 400 |
| Headline Medium | 28px | 36px | 0 | 400 |
| Headline Small | 24px | 32px | 0 | 400 |
| Title Large | 22px | 28px | 0 | 400 |
| Title Medium | 16px | 24px | 0.15px | 500 |
| Title Small | 14px | 20px | 0.1px | 500 |
| Body Large | 16px | 24px | 0.5px | 400 |
| Body Medium | 14px | 20px | 0.25px | 400 |
| Body Small | 12px | 16px | 0.4px | 400 |
| Label Large | 14px | 20px | 0.1px | 500 |
| Label Medium | 12px | 16px | 0.5px | 500 |
| Label Small | 11px | 16px | 0.5px | 500 |

### Tailwind Usage

```tsx
<h1 className="text-headline-medium">Title</h1>
<p className="text-body-large">Body text</p>
<span className="text-label-medium">Label</span>
```

---

## Component Patterns

### Filled Button

```tsx
<button className="md-button-filled">
  Button Text
</button>
```

### Elevated Card

```tsx
<div className="md-card-elevated">
  Card content
</div>
```

### Filled Tonal Button

```tsx
<button className="md-button-filled-tonal">
  Tonal Button
</button>
```

### Outlined Button

```tsx
<button className="md-button-outlined">
  Outlined Button
</button>
```

### Icon Button

```tsx
<button className="md-icon-button">
  <Icon24px />
</button>
```

### FAB (Floating Action Button)

```tsx
<button className="md-fab">
  <Icon24px />
</button>

// Large FAB
<button className="md-fab md-fab-large">
  <Icon24px />
</button>
```

### Navigation Bar (Mobile)

```tsx
<nav className="md-navigation-bar">
  <NavItem icon={<Home />} label="Home" />
  <NavItem icon={<Search />} label="Search" />
</nav>
```

### Chips

```tsx
// Filled chip
<span className="md-chip md-chip-filled">Chip</span>

// Outline chip
<span className="md-chip md-chip-outline">Chip</span>
```

### Progress Indicators

```tsx
// Linear progress
<div className="md-progress-linear">
  <div className="md-progress-linear-bar" style={{ width: '60%' }} />
</div>

// Circular progress
<div className="md-progress-circular" />
```

---

## Dark Mode

Dark mode is enabled via `dark` class on the `<html>` or `<body>` element.

### Tailwind Dark Mode

```tsx
<div className="bg-md-surface md-dark:bg-md-surface-dark">
  Light/Dark mode aware
</div>
```

### Manual Dark Mode Toggle

```tsx
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
};
```

---

## Responsive Breakpoints

| Breakpoint | Width | Typical Devices |
|------------|-------|-----------------|
| `xs` | 0px | Phone portrait |
| `sm` | 600px | Phone landscape, small tablet |
| `md` | 840px | Tablet portrait |
| `lg` | 1200px | Tablet landscape, desktop |
| `xl` | 1600px | Large desktop |

### Tailwind Usage

```tsx
// Hidden on mobile, visible on tablet+
<div className="hidden md:block">Desktop only</div>
```

---

## Spacing Scale (8dp Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Standard spacing |
| `space-3` | 12px | Medium spacing |
| `space-4` | 16px | Standard component padding |
| `space-5` | 20px | Large spacing |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Section gaps |

### Tailwind Usage

```tsx
<div className="p-4 space-y-2">Content</div>
```

---

## State Layers

Interactive states use the `state-layer` pattern for ripple-like effects.

```tsx
<div className="state-layer">
  Interactive content
</div>
```

---

## Utility Classes

### Text Truncation

```tsx
<div className="truncate-text">Truncates single line</div>
<div className="line-clamp-2">Truncates to 2 lines</div>
<div className="line-clamp-3">Truncates to 3 lines</div>
```

### Flex Utilities

```tsx
<div className="flex-center">Centered content</div>
<div className="flex-between">Space between</div>
```

### Container Max-Width

```tsx
<div className="container-compact">Max 600px</div>
<div className="container-medium">Max 840px</div>
<div className="container-expanded">Max 1200px</div>
```

---

## Configuration Files

### `tailwind.config.cjs`

Contains all M3 design tokens as Tailwind theme extensions.

### `src/styles/index.css`

Contains:
- CSS custom properties for M3 tokens (light/dark)
- Component utility classes
- Responsive utilities

---

## Best Practices

1. **Use Tailwind utilities first** - Prefer `bg-md-primary` over inline styles
2. **Use semantic tokens** - Use `--md-surface` not hardcoded colors
3. **Follow 8dp grid** - Use spacing tokens for consistency
4. **Use appropriate elevation** - Match elevation to component importance
5. **Support dark mode** - Always test both themes
6. **Minimum touch target** - Use `touch-target` class for interactive elements (48x48dp minimum)

---

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Material Design Color Tool](https://m3.material.io/theme-builder)
- [Tailwind CSS](https://tailwindcss.com/)
