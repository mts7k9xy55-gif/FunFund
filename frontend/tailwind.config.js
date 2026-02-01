/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        surface: {
                                DEFAULT: 'hsl(var(--surface))',
                                hover: 'hsl(var(--surface-hover))'
                        },
                        border: {
                                DEFAULT: 'hsl(var(--border))',
                                strong: 'hsl(var(--border-strong))'
                        },
                        text: {
                                primary: 'hsl(var(--text-primary))',
                                secondary: 'hsl(var(--text-secondary))',
                                tertiary: 'hsl(var(--text-tertiary))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                light: 'hsl(var(--accent-light))'
                        },
                        flow: 'hsl(var(--flow))',
                        do: 'hsl(var(--do))',
                        commit: 'hsl(var(--commit))',
                        positive: 'hsl(var(--positive))',
                        neutral: 'hsl(var(--neutral))',
                        negative: 'hsl(var(--negative))',
                        ai: {
                                border: 'hsl(var(--ai-border))',
                                bg: 'hsl(var(--ai-bg))'
                        },
                        card: {
                                DEFAULT: 'hsl(var(--card, 0 0% 100%))',
                                foreground: 'hsl(var(--card-foreground, 0 0% 3.9%))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
                                foreground: 'hsl(var(--popover-foreground, 0 0% 3.9%))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(0 0% 100%)'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--surface))',
                                foreground: 'hsl(var(--text-primary))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--surface))',
                                foreground: 'hsl(var(--text-secondary))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--negative))',
                                foreground: 'hsl(0 0% 100%)'
                        },
                        input: 'hsl(var(--border))',
                        ring: 'hsl(var(--accent))'
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        },
                        'slide-in': {
                                from: {
                                        opacity: '0',
                                        transform: 'translateY(10px)'
                                },
                                to: {
                                        opacity: '1',
                                        transform: 'translateY(0)'
                                }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'slide-in': 'slide-in 0.2s ease-out'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};