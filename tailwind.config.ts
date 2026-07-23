import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
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
