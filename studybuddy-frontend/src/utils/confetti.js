import confetti from 'canvas-confetti';

export function fireCelebration() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#8B5CF6', '#A78BFA', '#34D399'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#C4B5FD', '#8B5CF6', '#FBBF24'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#8B5CF6', '#34D399', '#60A5FA'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function fireMiniBurst(x = 0.5, y = 0.5) {
  confetti({
    particleCount: 40,
    spread: 50,
    origin: { x, y },
    colors: ['#8B5CF6', '#34D399', '#A78BFA'],
    zIndex: 9999,
  });
}
