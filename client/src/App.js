import React, { useState, useEffect, useRef } from "react";
const GAME_STATE = {
  PLAYING: "playing",
  GOAL: "goal",
  OFFSIDE: "offside"
};

const DEFAULT_PLAYER = { x: 150, y: 250, width: 40, height: 64, speed: 4, hasBall: true };
const DEFAULT_BALL = { x: 170, y: 250, width: 16, height: 16, vx: 0, vy: 0, radius: 8, friction: 0.92 };
const DEFAULT_GOALKEEPER = { x: 700, y: 200, width: 25, height: 40, speed: 3, direction: 1 };
const DEFAULT_DEFENDERS = [
  { x: 450, y: 120, width: 40, height: 64, speed: 1, direction: 1 },
  { x: 500, y: 350, width: 40, height: 64, speed: 1, direction: -1 }
];

const FootballGame = () => {
  const [screen, setScreen] = useState("menu");
  const [score, setScore] = useState(0);
 const [maxScore, setMaxScore] = useState(0);
  const [powerBarWidth, setPowerBarWidth] = useState("0%");

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const gameStateRef = useRef(GAME_STATE.PLAYING);
  const isChargingRef = useRef(false);
  const shotsPowerRef = useRef(0);
  const playerRef = useRef({ ...DEFAULT_PLAYER });
  const ballRef = useRef({ ...DEFAULT_BALL });
  const goalkeeperRef = useRef({ ...DEFAULT_GOALKEEPER });
  const defendersRef = useRef(JSON.parse(JSON.stringify(DEFAULT_DEFENDERS)));
  const keysRef = useRef({});
  const gameLoopIdRef = useRef(null);
  const chargeIntervalRef = useRef(null);

  const playerImg = useRef(new Image());
  const ballImg = useRef(new Image());
  const pitchImg = useRef(new Image());

  const goalArea = { x: 750, y: 160, width: 80, height: 180 };

  useEffect(() => {
    playerImg.current.src = "/assets/player.png";
    ballImg.current.src = "/assets/ball.jpeg";

    pitchImg.current.src = "/assets/pitch.png";
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/max-score")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.score === "number") {
          setMaxScore(data.score);
        }
      })
      .catch((err) => console.log("Cannot fetch max score:", err));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;
      if (key === "r" && playerRef.current.hasBall && gameStateRef.current === GAME_STATE.PLAYING) {
        e.preventDefault();
        if (checkOffside()) {
          gameStateRef.current = GAME_STATE.OFFSIDE;
        } else {
          playerRef.current.hasBall = false;
          const shootPower = 15;
          const shootAngle = keysRef.current["w"] ? -0.3 : keysRef.current["s"] ? 0.3 : 0;
          ballRef.current.vx = shootPower;
          ballRef.current.vy = shootAngle;
        }
      }
      
      if (e.key === " ") e.preventDefault();
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const checkAABB = (rect1, rect2) => (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );

  const checkOffside = () => {
    const player = playerRef.current;
    const defenders = defendersRef.current;
    const defenderPositions = defenders.map((d) => d.x).sort((a, b) => a - b);
    const secondLastDefender = defenderPositions[0];
    return player.hasBall && player.x > secondLastDefender && player.x > 600;
  };

  const resetPlay = () => {
    gameStateRef.current = GAME_STATE.PLAYING;
    playerRef.current = { ...DEFAULT_PLAYER };
    ballRef.current = { ...DEFAULT_BALL };
    goalkeeperRef.current = { ...DEFAULT_GOALKEEPER };
    defendersRef.current = JSON.parse(JSON.stringify(DEFAULT_DEFENDERS));
    isChargingRef.current = false;
    shotsPowerRef.current = 0;
    setPowerBarWidth("0%");
  };

  const gameCycle = () => {
    if (!canvasRef.current) {
      return;
    }
    if (!ctxRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const player = playerRef.current;
    const ball = ballRef.current;
    const keys = keysRef.current;

    // Player movement
    if (keys["w"] && player.y > 0) {
      player.y -= player.speed;
    }
    if (keys["s"] && player.y < canvas.height - player.height) {
      player.y += player.speed;
    }
    if (keys["a"] && player.x > 0) {
      player.x -= player.speed;
    }
    if (keys["d"] && player.x < canvas.width - player.width) {
      player.x += player.speed;
    }

    if (player.hasBall) {
      ball.x = player.x + player.width / 2 - ball.width / 2;
      ball.y = player.y - 10;
      ball.vx = 0;
      ball.vy = 0;
    }

    if (keys[" "] && player.hasBall) isChargingRef.current = true;
    if (!keys[" "] && isChargingRef.current && player.hasBall) {
      if (checkOffside()) {
        gameStateRef.current = GAME_STATE.OFFSIDE;
        isChargingRef.current = false;
        shotsPowerRef.current = 0;
        setPowerBarWidth("0%");
      } else {
        player.hasBall = false;
        const shootPower = shotsPowerRef.current > 0 ? shotsPowerRef.current : 15;
        const shootAngle = keys["w"] ? -0.3 : keys["s"] ? 0.3 : 0;
        ball.vx = shootPower;
        ball.vy = shootAngle;
        isChargingRef.current = false;
        shotsPowerRef.current = 0;
        setPowerBarWidth("0%");
      }
    }

    if (!player.hasBall) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= ball.friction;
      ball.vy *= ball.friction;

      if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -0.6;
      if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -0.6;

      ball.x = Math.max(0, Math.min(canvas.width, ball.x));
      ball.y = Math.max(0, Math.min(canvas.height, ball.y));
    }

    defendersRef.current.forEach((def) => {
      def.y += def.speed * def.direction;
      if (def.y < 50 || def.y > canvas.height - 50) def.direction *= -1;
      const distToBall = Math.hypot(def.x - ball.x, def.y - ball.y);
      if (distToBall < 150) {
        if (def.y < ball.y) def.y += def.speed;
        if (def.y > ball.y) def.y -= def.speed;
        if (def.x < ball.x) def.x += def.speed * 0.5;
      }
    });

    const goalkeeper = goalkeeperRef.current;
    const distToBall = Math.hypot(goalkeeper.x - ball.x, goalkeeper.y - ball.y);
    if (ball.vx > 1 && distToBall < 200) {
      if (goalkeeper.y < ball.y) goalkeeper.y += goalkeeper.speed;
      if (goalkeeper.y > ball.y) goalkeeper.y -= goalkeeper.speed;
    } else {
      if (goalkeeper.y < 230) goalkeeper.y += goalkeeper.speed;
      if (goalkeeper.y > 270) goalkeeper.y -= goalkeeper.speed;
    }
    goalkeeper.y = Math.max(150, Math.min(canvas.height - 50, goalkeeper.y));

    if (checkAABB(ball, goalkeeper) && !player.hasBall) {
      ball.vx *= -0.5;
      ball.vy *= (Math.random() - 0.5) * 4;
    }

    if (
      ball.x + ball.width > goalArea.x &&
      ball.x < goalArea.x + goalArea.width &&
      ball.y + ball.height > goalArea.y &&
      ball.y < goalArea.y + goalArea.height &&
      Math.abs(ball.vx) > 0.5
    ) {
      setScore((prev) => {
  const next = prev + 1;

 
  if (next > maxScore) {
    setMaxScore(next);
  }

  
  fetch("http://localhost:5000/score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ score: next })
  });

  return next;
});
      gameStateRef.current = GAME_STATE.GOAL;
      setTimeout(resetPlay, 1200);
    }

    if (gameStateRef.current === GAME_STATE.OFFSIDE) {
      setTimeout(() => {
        resetPlay();
        gameStateRef.current = GAME_STATE.PLAYING;
      }, 1200);
    }

    paint();
  };

  const paint = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) {
      return;
    }

    const player = playerRef.current;
    const ball = ballRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pitchImg.current.complete) {
      ctx.drawImage(pitchImg.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,0,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(goalArea.x, goalArea.y, goalArea.width, goalArea.height);

    if (playerImg.current.complete&&playerImg.current.naturalWidth !== 0) {
      ctx.drawImage(playerImg.current, player.x, player.y, player.width, player.height);
    } else {
      ctx.fillStyle = "#1abc9c";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    if (ballImg.current.complete&&ballImg.current.naturalWidth !== 0) {
      ctx.drawImage(ballImg.current, ball.x - ball.width / 2, ball.y - ball.height / 2, ball.width, ball.height);
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = "#e74c3c";
    defendersRef.current.forEach((def) => {
      ctx.fillRect(def.x, def.y, def.width, def.height);
    });

    ctx.fillStyle = "#f39c12";
    const goalkeeper = goalkeeperRef.current;
    ctx.fillRect(goalkeeper.x, goalkeeper.y, goalkeeper.width, goalkeeper.height);

    ctx.fillStyle = "#fff";
    ctx.font = "22px Helvetica";
    ctx.fillText(`Score: ${score}`, 14, 30);
    ctx.fillText(`Best: ${maxScore}`, 14, 58);
    ctx.fillText(`Power: ${Math.round((shotsPowerRef.current / 15) * 100)}%`, 14, 86);

    if (gameStateRef.current === GAME_STATE.OFFSIDE) {
      ctx.fillStyle = "rgba(231, 76, 60, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "30px Helvetica";
      ctx.fillText("⚠️ OFFSIDE", canvas.width / 2 - 80, canvas.height / 2);
    }
  };

  const gameLoop = () => {
    gameCycle();
    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    setScore(0);
    resetPlay();
    setScreen("game");
  };

  useEffect(() => {
    if (screen === "game") {
      setTimeout(() => {
        if (canvasRef.current && !ctxRef.current) {
          ctxRef.current = canvasRef.current.getContext("2d");
        }
        const id = requestAnimationFrame(gameLoop);
        gameLoopIdRef.current = id;
        chargeIntervalRef.current = setInterval(() => {
          if (isChargingRef.current && playerRef.current.hasBall) {
            shotsPowerRef.current = Math.min(shotsPowerRef.current + 0.3, 15);
            setPowerBarWidth(`${Math.round((shotsPowerRef.current / 15) * 100)}%`);
          }
        }, 50);
      }, 100);
    } else {
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
        gameLoopIdRef.current = null;
      }
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
        chargeIntervalRef.current = null;
      }
    }

    return () => {
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, [screen]);

  const renderMenu = () => (
    <div className="menu-screen">
      <h1>⚽ Football Pro Arena</h1>
      <p className="subtitle">Score goals and beat your own record!</p>
      <div className="menu-stats">
        <div>🏆 Best Score: <strong>{maxScore}</strong></div>
        <div>📊 Last Score: <strong>{score}</strong></div>
      </div>
      <button className="big-btn" onClick={startGame}>
        ▶ START GAME
      </button>
      <p className="help-text">⌨️ W/A/S/D move • SPACE to charge • Release to shoot</p>
    </div>
  );

  return (
    <div className="app-frame">
      {screen === "menu" && renderMenu()}
      {screen === "game" && (
        <div className="game-screen">
          <header className="game-header">
            <h2>⚽ Football Pro</h2>
            <button className="small-btn" onClick={() => setScreen("menu")}>← MENU</button>
          </header>
          <div className="game-container">
            <canvas ref={canvasRef} id="gameCanvas" width="860" height="520"></canvas>
          </div>
          <div className="hud">
            <span>Score: {score}</span>
            <span>Best: {maxScore}</span>
            <span>Power: {Math.round((shotsPowerRef.current / 15) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default FootballGame;

