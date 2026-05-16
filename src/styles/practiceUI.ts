export const OPTION_LABELS = ['ア', 'イ', 'ウ', 'エ']

export type PracticeThemeKey = 'morning' | 'flash' | 'deg'

export const PRACTICE_THEME = {
  morning: {
    color: '#19a576',
    colorLight: 'rgba(39,174,96,0.3)',
    bg: 'rgba(39,174,96,0.08)',
    border: 'rgba(39,174,96,0.2)',
    label: 'Morning Bugfix',
  },
  flash: {
    color: '#2383e2',
    colorLight: 'rgba(35,131,226,0.3)',
    bg: 'rgba(35,131,226,0.08)',
    border: 'rgba(35,131,226,0.2)',
    label: 'Flash Bugfix',
  },
  deg: {
    color: '#7c3aed',
    colorLight: 'rgba(124,58,237,0.3)',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    label: 'DegBugfix',
  },
} as const