import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4A5D23',     // Verde Militar Dulce Fe (Botánico)
          secondary: '#2A321B',   // Verde Oscuro Olivo (Alto contraste)
          cream: '#F4F1E1',       // Fondo Crema Cálido (Body)
          accent: '#C5A059',      // Dorado / Miel Pastelero
        },
        surface: '#FFFFFF',       // Fondo Blanco puro (Cards, Modales, Inputs)
        status: {
          danger: '#991B1B',      // Rojo carmesí para acciones destructivas
          success: '#a3e635',     // Verde lima neón para márgenes positivos
          warning: '#D97706',     // Ámbar para pendientes y advertencias
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(42, 50, 27, 0.05)',
        'soft-md': '0 4px 16px -4px rgba(42, 50, 27, 0.08)',
        'soft-lg': '0 8px 24px -6px rgba(42, 50, 27, 0.12)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        }
      },
      animation: {
        pop: 'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        wiggle: 'wiggle 0.3s ease-in-out infinite',
      }
    }
  }
}
