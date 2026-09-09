/* eslint-disable antfu/no-cjs-exports */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-env node */
import defaultTheme from 'tailwindcss/defaultTheme'
import { guccho } from './daisyui.themes'
import { hex as colors } from './src/palette'

/** @type {import('tailwindcss').Config} */
module.exports = {
  important: false,
  content: [
    './src/components/**/*.{vue,ts,js}',
    './src/layouts/**/*.vue',
    './src/pages/**/*.vue',
    './src/plugins/**/*.{js,ts}',
    './src/app.{js,ts,vue}',
  ],
  safelist: [
    {
      pattern: /tab.+/,
    },
    {
      pattern: /btn.+/,
    },
    {
      pattern: /hljs.+/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Hannotate SC',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      colors,
      animation: {
        'role-text': 'text 7s ease infinite',
        'fade-in': 'fadeIn 1.2s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        'role-text': {
          '0%, 100%': {
            'background-size': '100% 120%',
            'background-position': 'top center',
          },
          '50%': {
            'background-size': '100% 120%',
            'background-position': 'bottom center',
          },
        },
        'fadeIn': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slideUp': {
          'from': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.05em',
        widest: '0.15em',
      },
    },
    hljs: {
      theme: 'night-owl',
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
    require('tailwind-highlightjs'),
    require('@tailwindcss/container-queries'),
  ],
  daisyui: {
    darkTheme: 'guccho-dark',
    themes: guccho,
    base: false,
  },
}