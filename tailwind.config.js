/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Force generation of brand color utilities
    'bg-brand-terracotta',
    'bg-brand-terracotta-dark',
    'bg-brand-terracotta-light',
    'bg-brand-sage',
    'bg-brand-sage-dark',
    'bg-brand-sage-light',
    'bg-brand-cream',
    'bg-brand-warm-white',
    'bg-brand-sand',
    'bg-brand-clay',
    'bg-brand-navy',
    'bg-brand-navy-dark',
    'bg-brand-stone',
    'bg-brand-stone-dark',
    'text-brand-terracotta',
    'text-brand-sage',
    'text-brand-sage-dark',
    'text-brand-navy',
    'text-brand-stone',
    'text-brand-stone-dark',
    'text-brand-clay',
    'border-brand-sand',
    'border-brand-sage',
    'hover:bg-brand-terracotta-dark',
    'hover:bg-brand-cream',
    'hover:text-brand-terracotta',
    'hover:text-brand-navy',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-open-sans)', 'Open Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Warm, homeowner-friendly brand palette
        'brand-terracotta': '#c1414f', // Primary - warm, inviting red
        'brand-terracotta-light': '#d66570',
        'brand-terracotta-dark': '#9e3540',
        'brand-sage': '#7c9885', // Secondary - calming green
        'brand-sage-light': '#95ad9e',
        'brand-sage-dark': '#627a6a',
        'brand-cream': '#faf7f2', // Background - warm white
        'brand-warm-white': '#fffdf9',
        'brand-sand': '#f5e9d3', // Accent - soft beige
        'brand-clay': '#d4a574', // Highlight - earthy brown
        'brand-navy': '#2c3e50', // Trust - deep blue
        'brand-navy-light': '#34495e',
        'brand-navy-dark': '#1a252f',
        'brand-stone': '#8b8680', // Neutral gray with warmth
        'brand-stone-light': '#a8a39e',
        'brand-stone-dark': '#6b6762',
        // Status colors with warmer tones
        'status': {
          'success': '#6b8e7f', // Muted sage green
          'warning': '#d4a574', // Warm amber
          'error': '#c85450', // Soft red
          'info': '#5b8a9d', // Calming blue
        },
        // Keep legacy colors for backwards compatibility
        'kurtis-accent': '#c1414f',
        'kurtis-light': '#f5e9e8',
        'kurtis-dark': '#a8a09f',
        'kurtis-black': '#000000',
        'kurtis-white': '#ffffff',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}