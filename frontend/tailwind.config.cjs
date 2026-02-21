/** @type {import('tailwindcss').Config} */

/**
 * Material Design 3 Design Tokens Configuration
 * 
 * Reference: https://m3.material.io/styles/color
 * Color Scheme: baseline (Purple)
 */

module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // M3 Color System - Baseline Theme
            colors: {
                // Primary
                'md-primary': 'var(--md-primary)',
                'md-on-primary': 'var(--md-on-primary)',
                'md-primary-container': 'var(--md-primary-container)',
                'md-on-primary-container': 'var(--md-on-primary-container)',
                'md-primary-fixed': 'var(--md-primary-fixed)',
                'md-on-primary-fixed': 'var(--md-on-primary-fixed)',
                'md-primary-fixed-dim': 'var(--md-primary-fixed-dim)',

                // Secondary
                'md-secondary': 'var(--md-secondary)',
                'md-on-secondary': 'var(--md-on-secondary)',
                'md-secondary-container': 'var(--md-secondary-container)',
                'md-on-secondary-container': 'var(--md-on-secondary-container)',
                'md-secondary-fixed': 'var(--md-secondary-fixed)',
                'md-on-secondary-fixed': 'var(--md-on-secondary-fixed)',

                // Tertiary
                'md-tertiary': 'var(--md-tertiary)',
                'md-on-tertiary': 'var(--md-on-tertiary)',
                'md-tertiary-container': 'var(--md-tertiary-container)',
                'md-on-tertiary-container': 'var(--md-on-tertiary-container)',
                'md-tertiary-fixed': 'var(--md-tertiary-fixed)',
                'md-on-tertiary-fixed': 'var(--md-on-tertiary-fixed)',

                // Error
                'md-error': 'var(--md-error)',
                'md-on-error': 'var(--md-on-error)',
                'md-error-container': 'var(--md-error-container)',
                'md-on-error-container': 'var(--md-on-error-container)',

                // Surface
                'md-surface': 'var(--md-surface)',
                'md-on-surface': 'var(--md-on-surface)',
                'md-surface-dim': 'var(--md-surface-dim)',
                'md-surface-bright': 'var(--md-surface-bright)',
                'md-surface-container': 'var(--md-surface-container)',
                'md-surface-container-low': 'var(--md-surface-container-low)',
                'md-surface-container-high': 'var(--md-surface-container-high)',
                'md-surface-container-highest': 'var(--md-surface-container-highest)',
                'md-surface-variant': 'var(--md-surface-variant)',
                'md-on-surface-variant': 'var(--md-on-surface-variant)',

                // Background
                'md-background': 'var(--md-background)',
                'md-on-background': 'var(--md-on-background)',

                // Outline
                'md-outline': 'var(--md-outline)',
                'md-outline-variant': 'var(--md-outline-variant)',

                // Inverse
                'md-inverse-surface': 'var(--md-inverse-surface)',
                'md-inverse-on-surface': 'var(--md-inverse-on-surface)',
                'md-inverse-primary': 'var(--md-inverse-primary)',

                // Scrim
                'md-scrim': 'var(--md-scrim)',
            },

            // M3 Shape System - Border Radius
            borderRadius: {
                // Extra Small: 4dp
                'shape-xs': '4px',
                'rounded-xs': '4px',
                // Small: 8dp
                'shape-sm': '8px',
                'rounded-sm': '8px',
                // Medium: 12dp
                'shape-md': '12px',
                'rounded-md': '12px',
                // Large: 16dp
                'shape-lg': '16px',
                'rounded-lg': '16px',
                // Extra Large: 28dp
                'shape-xl': '28px',
                'rounded-xl': '28px',
                // Full: 9999px (circular)
                'shape-full': '9999px',
                'rounded-full': '9999px',
            },

            // M3 Elevation / Shadow System
            boxShadow: {
                'elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
                'elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
                'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
                'elevation-4': '0px 8px 12px 3px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)',
                'elevation-5': '0px 12px 16px 4px rgba(0, 0, 0, 0.15), 0px 4px 8px 0px rgba(0, 0, 0, 0.30)',
            },

            // M3 Typography - Roboto/Inter font family
            fontFamily: {
                'md-sans': ['Inter', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'],
                'md-serif': ['Merriweather', 'Georgia', 'serif'],
                'md-mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
            },

            // M3 Typography Scale
            fontSize: {
                // Display
                'md-display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
                'md-display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0', fontWeight: '400' }],
                'md-display-small': ['36px', { lineHeight: '44px', letterSpacing: '0', fontWeight: '400' }],
                // Headline
                'md-headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0', fontWeight: '400' }],
                'md-headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0', fontWeight: '400' }],
                'md-headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0', fontWeight: '400' }],
                // Title
                'md-title-large': ['22px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
                'md-title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
                'md-title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
                // Body
                'md-body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
                'md-body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
                'md-body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
                // Label
                'md-label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
                'md-label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
                'md-label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
            },

            // M3 Spacing Scale (8dp grid)
            spacing: {
                'space-1': '4px',
                'space-2': '8px',
                'space-3': '12px',
                'space-4': '16px',
                'space-5': '20px',
                'space-6': '24px',
                'space-8': '32px',
                'space-10': '40px',
                'space-12': '48px',
                'space-16': '64px',
                'space-20': '80px',
                'space-24': '96px',
            },

            // M3 State Layer Opacity
            opacity: {
                'hover': '0.08',
                'focus': '0.12',
                'pressed': '0.12',
                'dragged': '0.16',
                'disabled': '0.38',
            },

            // M3 Transition Duration
            transitionDuration: {
                'md-fast': '150ms',
                'md-medium': '200ms',
                'md-slow': '300ms',
                'md-enter': '250ms',
                'md-exit': '200ms',
            },

            // M3 Breakpoints (same as Material default)
            screens: {
                'xs': '0px',
                'sm': '600px',
                'md': '840px',
                'lg': '1200px',
                'xl': '1600px',
            },
        },
    },
    plugins: [],
}
