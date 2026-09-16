/* eslint-disable */
// Curated theme palettes applied in one tap from the Simple editor.
// Each palette carries theme colors plus the matching active-page background,
// so buttons, text and page background always stay harmonious.

export const CURATED_PALETTES = [
  {
    id: 'terracota',
    name: 'Terracota',
    colors: { primary: '#C0563D', secondary: '#E8A87C', background: '#FDF6EC', text: '#3A2E2A' },
    pageBg: { type: 'color', value: '#FDF6EC' },
  },
  {
    id: 'bosque',
    name: 'Bosque',
    colors: { primary: '#2D6A4F', secondary: '#74A57F', background: '#F4F7F2', text: '#1B2A22' },
    pageBg: { type: 'color', value: '#F4F7F2' },
  },
  {
    id: 'oceano',
    name: 'Océano',
    colors: { primary: '#1B7FA6', secondary: '#63C5DA', background: '#F0F8FB', text: '#123240' },
    pageBg: { type: 'color', value: '#F0F8FB' },
  },
  {
    id: 'noche',
    name: 'Noche',
    colors: { primary: '#D9A441', secondary: '#7C8DA6', background: '#141A24', text: '#F2EFE6' },
    pageBg: { type: 'color', value: '#141A24' },
  },
  {
    id: 'crema',
    name: 'Crema',
    colors: { primary: '#B08968', secondary: '#DDB892', background: '#FAF3E7', text: '#4A3F35' },
    pageBg: { type: 'color', value: '#FAF3E7' },
  },
  {
    id: 'vino',
    name: 'Vino',
    colors: { primary: '#7B2D43', secondary: '#C98A7D', background: '#FBF3EF', text: '#332126' },
    pageBg: { type: 'color', value: '#FBF3EF' },
  },
  {
    id: 'oliva',
    name: 'Oliva',
    colors: { primary: '#6B7F3E', secondary: '#C9C27A', background: '#F7F6EC', text: '#2E3121' },
    pageBg: { type: 'color', value: '#F7F6EC' },
  },
  {
    id: 'grafito',
    name: 'Grafito',
    colors: { primary: '#414E5C', secondary: '#8FA3B3', background: '#EDEFF1', text: '#1C232B' },
    pageBg: { type: 'color', value: '#EDEFF1' },
  },
];

export function getPaletteById(id) {
  return CURATED_PALETTES.find((palette) => palette.id === id) || null;
}

export default CURATED_PALETTES;
