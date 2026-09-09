/* eslint-env node */
// import * as convert from 'color-convert'
import { hex } from 'color-convert'
import themes from 'daisyui/src/theming/themes'
import tw from 'tailwindcss/colors'
import { hex as colors } from './src/palette'
import { convertSingle } from './src/utils/color'

const cupcake = themes.cupcake
const dracula = themes.dracula
const base = {
  '--rounded-btn': '0.25rem',
  '--btn-text-case': 'normal',
  '--tab-border': '1px',
  '--tab-radius': '0',
  '--tw-border-opacity': '0.1',
  '--rounded-box': '0',
}

const slateHSL = convertSingle(tw.slate, hex.hsl, ([h, s, l]) => `${h} ${s}% ${l}%`)
const gSlate = {
  '--color-gbase-50': slateHSL[50],
  '--color-gbase-100': slateHSL[100],
  '--color-gbase-200': slateHSL[200],
  '--color-gbase-300': slateHSL[300],
  '--color-gbase-400': slateHSL[400],
  '--color-gbase-500': slateHSL[500],
  '--color-gbase-600': slateHSL[600],
  '--color-gbase-700': slateHSL[700],
  '--color-gbase-800': slateHSL[800],
  '--color-gbase-900': slateHSL[900],
  '--color-gbase-950': slateHSL[950],
}

// Minimalist nirnor-inspired theme
const nirmorMinimal = {
  ...base,
  'primary': '#000000',
  'primary-content': '#ffffff',
  'secondary': '#1a1a1a',
  'secondary-content': '#ffffff',
  'accent': '#333333',
  'accent-content': '#ffffff',
  'neutral': '#f5f5f5',
  'neutral-content': '#000000',
  'base-50': '#ffffff',
  'base-100': '#fafafa',
  'base-200': '#f5f5f5',
  'base-300': '#e5e5e5',
  'base-content': '#000000',
  'info': '#000000',
  'success': '#000000',
  'warning': '#000000',
  'error': '#000000',
  ...gSlate,
}

const nirmorMinimalDark = {
  ...base,
  'primary': '#ffffff',
  'primary-content': '#000000',
  'secondary': '#e5e5e5',
  'secondary-content': '#000000',
  'accent': '#cccccc',
  'accent-content': '#000000',
  'neutral': '#1a1a1a',
  'neutral-content': '#ffffff',
  'base-50': '#0a0a0a',
  'base-100': '#1a1a1a',
  'base-200': '#2a2a2a',
  'base-300': '#3a3a3a',
  'base-content': '#ffffff',
  'info': '#ffffff',
  'success': '#ffffff',
  'warning': '#ffffff',
  'error': '#ffffff',
  ...gSlate,
}

export const guccho = [
  {
    'guccho-light': {
      ...nirmorMinimal,
    },
  },
  {
    'guccho-dark': {
      ...nirmorMinimalDark,
    },
  },
]
