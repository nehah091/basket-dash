import React, { useState } from 'react';
import Basket from './components/Basket.jsx';
import FallingObject from './components/FallingObject.jsx';
import useGameLogic from './hooks/useGameLogic.js';

function App() {
  const [difficulty, setDifficulty] = useState('medium');
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState('sunset');
  const [basketVariant, setBasketVariant] = useState('classic');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [confetti, setConfetti] = useState([]);
  const [nextMilestone, setNextMilestone] = useState(10);
  const {
    gameAreaRef,
    basketX,
    basketWidth,
    basketHeight,
    score,
    objects,
    gameOver,
    timeLeft,
    timeUp,
    resetGame,
  } = useGameLogic({ difficulty, paused, theme });

  // Trigger non-blocking celebration when hitting score milestones
  React.useEffect(() => {
    if (!gameOver && score >= nextMilestone) {
      const messages = ['Well done!', 'Awesome!', 'Great job!', 'Fantastic!', 'Superb!'];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setCelebrationMessage(msg);
      setShowCelebration(true);
      // Generate confetti pieces
      const pieces = Array.from({ length: 36 }).map(() => {
        const left = Math.random() * 100; // percent
        const colorPool = ['#ffbe3d', '#2d6cdf', '#ef476f', '#06d6a0', '#118ab2'];
        const color = colorPool[Math.floor(Math.random() * colorPool.length)];
        const isBalloon = Math.random() < 0.25;
        return { left, color, balloon: isBalloon };
      });
      setConfetti(pieces);
      // Hide after 2.5s, advance milestone
      const t = setTimeout(() => setShowCelebration(false), 2500);
      setNextMilestone((m) => m + 10);
      return () => clearTimeout(t);
    }
  }, [score, gameOver, nextMilestone]);

  // End-of-round encouraging message based on score bands
  const endMessage = React.useMemo(() => {
    if (!timeUp) return '';
    if (score >= 40) return 'Awesome! You smashed it!';
    if (score >= 25) return 'Well done! Great catching!';
    if (score >= 10) return 'Nice work! Keep it up!';
    return 'Good try! Keep practicing!';
  }, [timeUp, score]);

  
  return (
    <div className="app">
      <div className="logo" aria-label="Basket Dash logo">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
          <rect x="10" y="44" width="44" height="8" rx="4" fill="#2d6cdf" />
          <circle cx="34" cy="20" r="8" fill="#ffbe3d" />
        </svg>
        <h1 className="title">Basket Dash</h1>
      </div>
      <p className="instructions">Use LEFT and RIGHT arrow keys to move the basket.</p>
      <div className="controls" role="group" aria-label="Game controls">
        <label htmlFor="difficulty" style={{ marginRight: 8 }}>Difficulty:</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          aria-label="Select difficulty"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <label htmlFor="theme" style={{ marginLeft: 12 }}>Theme:</label>
        <select
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Select theme"
        >
          <option value="sunset">Sunset</option>
          <option value="forest">Forest</option>
          <option value="ocean">Ocean</option>
          <option value="neon">Neon</option>
          <option value="night">Night</option>
        </select>
        <label htmlFor="basket" style={{ marginLeft: 12 }}>Basket:</label>
        <select
          id="basket"
          value={basketVariant}
          onChange={(e) => setBasketVariant(e.target.value)}
          aria-label="Select basket style"
        >
          <option value="classic">Classic</option>
          <option value="neon">Neon</option>
          <option value="dark">Dark</option>
          <option value="glass">Glass</option>
        </select>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          style={{ marginLeft: 12 }}
          aria-pressed={paused}
          aria-label={paused ? 'Resume game' : 'Pause game'}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <p className="score">Score: {score} &nbsp; • &nbsp; Time: {timeLeft}s</p>
      <div ref={gameAreaRef} className={`game-area theme-${theme}`}>
        <Basket x={basketX} width={basketWidth} height={basketHeight} variant={basketVariant} />
        {objects.map((o) => (
          <FallingObject key={o.id} x={o.x} y={o.y} size={o.size || 16} color={o.color} caught={o.caught} shape={o.shape} />
        ))}
        {timeUp && (
          <div className="overlay game-over-overlay" role="dialog" aria-label="Time Up">
            <div className="overlay-card">
              <h2>Time Up</h2>
              <p className="overlay-message" aria-live="polite">{endMessage}</p>
              <p>Score: {score}</p>
              <button className="overlay-button" onClick={resetGame}>Replay</button>
            </div>
          </div>
        )}
        {showCelebration && (
          <div className="overlay celebration-overlay" aria-hidden="true">
            <div className="celebration-message">{celebrationMessage}</div>
            {confetti.map((c, idx) => (
              c.balloon ? (
                <div key={idx} className="balloon" style={{ left: `${c.left}%`, background: c.color }} />
              ) : (
                <div key={idx} className="confetti-piece" style={{ left: `${c.left}%`, background: c.color }} />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;