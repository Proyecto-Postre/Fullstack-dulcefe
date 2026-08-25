import confetti from 'canvas-confetti'

export const useConfetti = () => {
  const triggerConfetti = (options?: confetti.Options) => {
    if (import.meta.client) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4A5D23', '#2A321B', '#a3e635', '#F4F1E1', '#D4AF37'],
        ...options,
      })
    }
  }

  const triggerCelebration = () => {
    if (import.meta.client) {
      const duration = 2 * 1000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4A5D23', '#a3e635', '#D4AF37'],
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4A5D23', '#a3e635', '#D4AF37'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }

  return {
    triggerConfetti,
    triggerCelebration,
  }
}
