import { useEffect, useRef, useState } from 'react';

export default function useGameLogic(options = {}) {
  const { difficulty = 'medium', paused = false, theme = 'sunset' } = options;
  const gameAreaRef = useRef(null);

  const BASKET_WIDTH = 80;
  const BASKET_HEIGHT = 16;
  const BASKET_MAX_SPEED = 420; // default cap
  const BASKET_ACCEL = 1200; // default accel
  const BASKET_FRICTION = 1400; // default friction
  const BASKET_MIN_START = 120; // ensure immediate movement on key press
  const OBJECT_SIZE = 16;
  const BASE_OBJECT_SPEED = 220; // fallback
  const SPAWN_INTERVAL = 850; // ms

  const DIFFICULTY_CONFIG = {
    easy: { baseObjectSpeed: 160, baseSpawnInterval: 950 },
    medium: { baseObjectSpeed: 220, baseSpawnInterval: 850 },
    hard: { baseObjectSpeed: 280, baseSpawnInterval: 700 },
  };

  const PHYSICS_CONFIG = {
    // Easy: more acceleration, less friction, higher minStart to avoid "sticky" feel
    easy: { accel: 2200, friction: 900, max: 600, minStart: 220 },
    medium: { accel: 1600, friction: 1200, max: 520, minStart: 160 },
    hard: { accel: 1400, friction: 1500, max: 500, minStart: 140 },
  };

  const PALETTES = {
    sunset: ['#ffbe3d', '#ff7a00', '#ff9e2c', '#ffd166'],
    forest: ['#3ddc97', '#2eb872', '#2d6a4f', '#74c69d'],
    ocean: ['#2d6cdf', '#3bb2ff', '#29c7fa', '#00a8e8'],
    neon: ['#ff3d7f', '#8d3dff', '#2d6cdf', '#00e5ff'],
    night: ['#ffd166', '#06d6a0', '#ef476f', '#118ab2'],
  };

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [basketX, setBasketX] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [objects, setObjects] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeUp, setTimeUp] = useState(false);

  // refs for optimized loop without re-creating closures
  const basketXRef = useRef(0);
  const basketVxRef = useRef(0);
  const objectsRef = useRef([]);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const timeLeftRef = useRef(60);
  const timeUpRef = useRef(false);
  const audioPrimedRef = useRef(false);
  const lastAudioPlayRef = useRef(0);
  const audioCtxRef = useRef(null);
  const pausedRef = useRef(false);
  const difficultyRef = useRef('medium');
  const themeRef = useRef('sunset');

  const keysRef = useRef({ left: false, right: false });
  const lastSpawnRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    measure();

    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keep refs updated from options so loop reads latest values
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);
  useEffect(() => {
    difficultyRef.current = difficulty || 'medium';
  }, [difficulty]);
  useEffect(() => {
    themeRef.current = theme || 'sunset';
  }, [theme]);

  useEffect(() => {
    if (dimensions.width > 0) {
      const initial = Math.floor((dimensions.width - BASKET_WIDTH) / 2);
      const clamped = Math.max(0, Math.min(dimensions.width - BASKET_WIDTH, basketXRef.current || initial));
      basketXRef.current = clamped;
      basketVxRef.current = 0; // reset velocity on resize to avoid sliding out
      setBasketX(clamped);
      gameOverRef.current = false;
      setGameOver(false);
      // Reset timer
      timeLeftRef.current = 60;
      setTimeLeft(60);
      timeUpRef.current = false;
      setTimeUp(false);
    }
  }, [dimensions.width]);

  useEffect(() => {
    const onKeyDown = (e) => {
      // Prevent default scrolling on arrow keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }
      // Prime WebAudio context on first user interaction
      if (!audioPrimedRef.current) {
        audioPrimedRef.current = true;
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          audioCtxRef.current.resume().catch(() => {});
        } catch (_) {}
      }
      if (e.key === 'ArrowLeft') {
        keysRef.current.left = true;
        // immediate responsiveness: kick velocity toward left
        const phys = PHYSICS_CONFIG[difficultyRef.current] || PHYSICS_CONFIG.medium;
        const min = phys.minStart || BASKET_MIN_START;
        if (basketVxRef.current > -min) basketVxRef.current = -min;
      }
      if (e.key === 'ArrowRight') {
        keysRef.current.right = true;
        const phys = PHYSICS_CONFIG[difficultyRef.current] || PHYSICS_CONFIG.medium;
        const min = phys.minStart || BASKET_MIN_START;
        if (basketVxRef.current < min) basketVxRef.current = min;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const loop = (time) => {
      const last = lastTimeRef.current || time;
      const dt = Math.min(0.05, (time - last) / 1000); // cap dt to avoid jumps
      lastTimeRef.current = time;

      const { width, height } = dimensions;
      if (width === 0 || height === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Handle paused or game-over state: keep scheduling but skip updates
      if (pausedRef.current || gameOverRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Count down timer during active play
      if (!timeUpRef.current) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
        setTimeLeft(Math.ceil(timeLeftRef.current));
        if (timeLeftRef.current <= 0) {
          timeUpRef.current = true;
          setTimeUp(true);
          gameOverRef.current = true;
          setGameOver(true);
        }
      }

      // Smooth basket physics: difficulty-based acceleration + friction
      const phys = PHYSICS_CONFIG[difficultyRef.current] || PHYSICS_CONFIG.medium;
      let vx = basketVxRef.current;
      if (keysRef.current.left) {
        if (Math.abs(vx) < phys.minStart) vx = -phys.minStart;
        vx -= (phys.accel || BASKET_ACCEL) * dt;
      }
      if (keysRef.current.right) {
        if (Math.abs(vx) < phys.minStart) vx = phys.minStart;
        vx += (phys.accel || BASKET_ACCEL) * dt;
      }
      if (!keysRef.current.left && !keysRef.current.right) {
        const fr = phys.friction || BASKET_FRICTION;
        if (vx > 0) vx = Math.max(0, vx - fr * dt);
        if (vx < 0) vx = Math.min(0, vx + fr * dt);
      }
      // Clamp velocity
      const vmax = phys.max || BASKET_MAX_SPEED;
      vx = Math.max(-vmax, Math.min(vmax, vx));
      let nextBasketX = basketXRef.current + vx * dt;
      nextBasketX = Math.max(0, Math.min(width - BASKET_WIDTH, nextBasketX));
      
      // If clamped at edges, zero velocity to avoid jitter
      if (nextBasketX <= 0 || nextBasketX >= width - BASKET_WIDTH) {
        vx = 0;
      }
      basketVxRef.current = vx;
      basketXRef.current = nextBasketX;
      setBasketX(nextBasketX);

      // Base difficulty settings
      const cfg = DIFFICULTY_CONFIG[difficultyRef.current] || DIFFICULTY_CONFIG.medium;
      const scoreScale = 1 + Math.floor(scoreRef.current / 10) * 0.08; // +8% per 10
      const spawnScale = 1 + Math.floor(scoreRef.current / 10) * 0.05; // faster spawns with score

      // Spawn new objects with varying speeds and shapes
      const effectiveInterval = (cfg.baseSpawnInterval || SPAWN_INTERVAL) / spawnScale;
      const shouldSpawn = time - (lastSpawnRef.current || 0) >= effectiveInterval;
      let nextObjects = objectsRef.current;
      if (shouldSpawn) {
        lastSpawnRef.current = time;
        const newId = ++idRef.current;
        // size and position
        const size = Math.floor(12 + Math.random() * 16); // 12..28 px
        const x = Math.max(0, Math.min(width - size, Math.floor(Math.random() * (width - size))));
        const shapeRoll = Math.random();
        const shape = shapeRoll < 0.34 ? 'circle' : shapeRoll < 0.67 ? 'square' : 'star';
        const palette = PALETTES[themeRef.current] || PALETTES.sunset;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const baseSpeed = cfg.baseObjectSpeed || BASE_OBJECT_SPEED;
        const sizeFactor = 16 / size; // larger objects fall slightly slower
        const speed = baseSpeed * (0.85 + Math.random() * 0.3) * scoreScale * sizeFactor;
        const newObj = { id: newId, x, y: -size, shape, speed, size, color };
        nextObjects = [...nextObjects, newObj];
      }

      const basketRect = {
        x: nextBasketX,
        y: height - BASKET_HEIGHT,
        w: BASKET_WIDTH,
        h: BASKET_HEIGHT,
      };

      let caught = 0;
      let missed = 0;
      nextObjects = nextObjects
        .map((o) => {
          const ny = o.y + (o.speed || BASE_OBJECT_SPEED) * dt;
          let caughtFlag = o.caught || false;
          let caughtTime = o.caughtTime || 0;

          if (!caughtFlag) {
            const objRect = { x: o.x, y: ny, w: o.size || OBJECT_SIZE, h: o.size || OBJECT_SIZE };
            const overlaps =
              objRect.x < basketRect.x + basketRect.w &&
              objRect.x + objRect.w > basketRect.x &&
              objRect.y < basketRect.y + basketRect.h &&
              objRect.y + objRect.h > basketRect.y;
            if (overlaps) {
              caughtFlag = true;
              caughtTime = time;
              caught += 1;
              // Play soft bump via WebAudio (throttled)
              try {
                const now = time;
                if (now - (lastAudioPlayRef.current || 0) > 120) {
                  lastAudioPlayRef.current = now;
                  if (!audioCtxRef.current) {
                    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                  }
                  const ctx = audioCtxRef.current;
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  // Soft bump envelope
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
                  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(180, ctx.currentTime);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.14);
                }
              } catch (_) {}
            }
          }

          return { ...o, y: ny, caught: caughtFlag, caughtTime };
        })
        .filter((o) => {
          if (o.caught) {
            return time - (o.caughtTime || 0) < 220; // brief bounce then remove
          }
          const stillVisible = o.y <= height;
          if (!stillVisible) missed += 1;
          return stillVisible;
        });

      // Update score: only count catches, no subtraction on miss
      if (caught > 0) {
        scoreRef.current = scoreRef.current + caught;
        setScore(scoreRef.current);
      }
      // Ignore misses for lives; no lives system in timer-only mode
      objectsRef.current = nextObjects;
      setObjects(nextObjects);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dimensions.width, dimensions.height]);

  return {
    gameAreaRef,
    basketX,
    basketWidth: BASKET_WIDTH,
    basketHeight: BASKET_HEIGHT,
    score,
    objects,
    areaWidth: dimensions.width,
    areaHeight: dimensions.height,
    gameOver,
    timeLeft,
    timeUp,
    resetGame: () => {
      // Reset all gameplay state
      scoreRef.current = 0;
      setScore(0);
      objectsRef.current = [];
      setObjects([]);
      lastSpawnRef.current = 0;
      gameOverRef.current = false;
      setGameOver(false);
      timeLeftRef.current = 60;
      setTimeLeft(60);
      timeUpRef.current = false;
      setTimeUp(false);
      // center basket
      const width = dimensions.width;
      if (width > 0) {
        const initial = Math.floor((width - BASKET_WIDTH) / 2);
        basketXRef.current = initial;
        basketVxRef.current = 0;
        setBasketX(initial);
      }
    },
  };
}