/** @type {import('tailwindcss').Config} */
const token = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        fondo: token('fondo'),
        superficie: token('superficie'),
        borde: token('borde'),
        texto: token('texto'),
        suave: token('suave'),
        marca: token('marca'),
        acento: token('acento'),
        ok: token('ok'),
        peligro: token('peligro'),
      },
      borderRadius: { tarjeta: 'var(--radio)' },
      boxShadow: { suave: 'var(--sombra)', flota: 'var(--sombra-flota)' },
      keyframes: {
        aparecer: { from: { opacity: '0', transform: 'scale(.6)' }, to: { opacity: '1', transform: 'scale(1)' } },
        subir: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        pulso: { '0%,100%': { opacity: '.5' }, '50%': { opacity: '1' } },
      },
      animation: { aparecer: 'aparecer .35s ease-out both', subir: 'subir .4s ease-out both', pulso: 'pulso 1.6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
