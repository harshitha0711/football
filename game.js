const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_STATE = {
  PLAYING: "playing",
  GOAL: "goal",
  OFFSIDE: "offside",
  GAME_OVER: "gameOver"
};

const playerImg = new Image();
playerImg.src = "assets/player.png";
const ballImg = new Image();
ballImg.src = "assets/ball.jpeg";
const pitchImg = new Image();
pitchImg.src = "assets/pitch.png";

let imagesLoaded = 0;
const totalImages = 3;
let gameLoopStarted = false;

playerImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === totalImages && !gameLoopStarted) {
    gameLoopStarted = true;
    gameLoop();
  }
};
ballImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === totalImages && !gameLoopStarted) {
    gameLoopStarted = true;
    gameLoop();
  }
};
pitchImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === totalImages && !gameLoopStarted) {
    gameLoopStarted = true;
    gameLoop();
  }
};

let gameState = GAME_STATE.PLAYING;
let score = 0;
let shotsPower = 0;
let isCharging = false;

const player = {
  x: 150,
  y: 250,
  width: 40,
  height: 64,
  speed: 4,
  hasBall: true
};

const ball = {
  x: 170,
  y: 250,
  width: 16,
  height: 16,
  vx: 0,
  vy: 0,
  radius: 8,
  friction: 0.92
};

const goalkeeper = {
  x: 700,
  y: 200,
  width: 25,
  height: 40,
  speed: 3,
  direction: 1
};

const defenders = [
  { x: 450, y: 120, width: 40, height: 64, speed: 1, direction: 1 },
  { x: 500, y: 350, width: 40, height: 64, speed: 1, direction: -1 }
];

const goal = {
  x: 750,
  y: 160,
  width: 80,
  height: 180
};

let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " " || e.key.toLowerCase() === "r") e.preventDefault();

  if (e.key.toLowerCase() === "r" && player.hasBall && gameState === GAME_STATE.PLAYING) {
    if (checkOffside()) {
      gameState = GAME_STATE.OFFSIDE;
      return;
    }

    player.hasBall = false;
    const shootPower = shotsPower > 0 ? shotsPower : 15;
    const shootAngle = keys["w"] ? -0.3 : keys["s"] ? 0.3 : 0;
    ball.vx = shootPower;
    ball.vy = shootAngle;
    isCharging = false;
    shotsPower = 0;
    document.getElementById("powerBar").style.width = "0%";
  }
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function movePlayer() {
  if (keys["w"] && player.y > 0) player.y -= player.speed;
  if (keys["s"] && player.y < canvas.height - player.height) player.y += player.speed;
  if (keys["a"] && player.x > 0) player.x -= player.speed;
  if (keys["d"] && player.x < canvas.width - player.width) player.x += player.speed;

  if (player.hasBall) {
    ball.x = player.x + player.width / 2 - ball.width / 2;
    ball.y = player.y - 10;
    ball.vx = 0;
    ball.vy = 0;
  }
}

function defendersAI() {
  defenders.forEach(def => {
    def.y += def.speed * def.direction;
    if (def.y < 50 || def.y > canvas.height - 50) {
      def.direction *= -1;
    }

    const distToBall = Math.hypot(def.x - ball.x, def.y - ball.y);
    if (distToBall < 150) {
      if (def.y < ball.y) def.y += def.speed;
      if (def.y > ball.y) def.y -= def.speed;
      if (def.x < ball.x) def.x += def.speed * 0.5;
    }
  });
}

function goalkeeperAI() {
  const distToBall = Math.hypot(goalkeeper.x - ball.x, goalkeeper.y - ball.y);

  if (ball.vx > 1 && distToBall < 200) {
    if (goalkeeper.y < ball.y) goalkeeper.y += goalkeeper.speed;
    if (goalkeeper.y > ball.y) goalkeeper.y -= goalkeeper.speed;
  } else {
    if (goalkeeper.y < 230) goalkeeper.y += goalkeeper.speed;
    if (goalkeeper.y > 270) goalkeeper.y -= goalkeeper.speed;
  }

  goalkeeper.y = Math.max(150, Math.min(canvas.height - 50, goalkeeper.y));
}

function updateBall() {
  if (!player.hasBall) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    if (ball.x < 0) ball.vx *= -0.6;
    if (ball.x > canvas.width) ball.vx *= -0.6;
    if (ball.y < 0) ball.vy *= -0.6;
    if (ball.y > canvas.height) ball.vy *= -0.6;

    ball.x = Math.max(0, Math.min(canvas.width, ball.x));
    ball.y = Math.max(0, Math.min(canvas.height, ball.y));
  }
}

function checkCollisions() {
  const distToBall = Math.hypot(player.x - ball.x, player.y - ball.y);
  if (distToBall < 30 && !player.hasBall) {
    player.hasBall = true;
    ball.vx = 0;
    ball.vy = 0;
  }

  defenders.forEach(def => {
    const dist = Math.hypot(def.x - ball.x, def.y - ball.y);
    if (dist < 25 && player.hasBall) {
      player.hasBall = false;
      ball.vx = (ball.x - def.x) * 0.15;
      ball.vy = (ball.y - def.y) * 0.15;
    }
  });

  if (checkAABB(ball, goalkeeper) && player.hasBall === false) {
    const bounce = 0.5;
    ball.vx *= -bounce;
    ball.vy *= (Math.random() - 0.5) * 4;
  }
}

function checkGoal() {
  if (
    ball.x + ball.width > goal.x &&
    ball.x < goal.x + goal.width &&
    ball.y + ball.height > goal.y &&
    ball.y < goal.y + goal.height &&
    Math.abs(ball.vx) > 0.5
  ) {
    gameState = GAME_STATE.GOAL;
    score += 1;
  }
}

function checkOffside() {
  const defenderPositions = defenders.map(d => d.x).sort((a, b) => a - b);
  const secondLastDefender = defenderPositions[0];

  if (player.hasBall && player.x > secondLastDefender && player.x > 600) {
    return true;
  }
  return false;
}

function checkAABB(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function resetPlay() {
  gameState = GAME_STATE.PLAYING;
  player.x = 150;
  player.y = 250;
  player.hasBall = true;
  ball.x = 170;
  ball.y = 250;
  ball.vx = 0;
  ball.vy = 0;
  isCharging = false;
  shotsPower = 0;
  document.getElementById("powerBar").style.width = "0%";
}

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "f") {
    isCharging = true;
  }
});

document.addEventListener("keyup", e => {
  if (e.key.toLowerCase() === "f" && isCharging) {
    if (player.hasBall && gameState === GAME_STATE.PLAYING) {
      if (checkOffside()) {
        gameState = GAME_STATE.OFFSIDE;
        isCharging = false;
        shotsPower = 0;
        document.getElementById("powerBar").style.width = "0%";
        return;
      }

      player.hasBall = false;
      const shootPower = shotsPower > 0 ? shotsPower : 15;
      const shootAngle = keys["w"] ? -0.3 : keys["s"] ? 0.3 : 0;
      ball.vx = shootPower;
      ball.vy = shootAngle;
      isCharging = false;
      shotsPower = 0;
      document.getElementById("powerBar").style.width = "0%";
    }
  }
});

setInterval(() => {
  if (isCharging && player.hasBall) {
    shotsPower = Math.min(shotsPower + 0.3, 12);
    document.getElementById("powerBar").style.width = (shotsPower / 12) * 100 + "%";
  }
}, 50);

function draw() {
  if (pitchImg.complete) {
    ctx.drawImage(pitchImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(720, 170, 80, 160);
  ctx.strokeRect(0, 170, 80, 160);

  ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  if (ballImg.complete) {
    ctx.drawImage(ballImg, ball.x - ball.width / 2, ball.y - ball.height / 2, ball.width, ball.height);
  } else {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "red";
  defenders.forEach(d => {
    ctx.fillRect(d.x, d.y, d.width, d.height);
  });

  ctx.fillStyle = "#ff6600";
  ctx.fillRect(goalkeeper.x, goalkeeper.y, goalkeeper.width, goalkeeper.height);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Power: ${Math.round((shotsPower / 12) * 100)}%`, 20, 60);

  if (checkOffside()) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.font = "16px Arial";
    ctx.fillText("⚠️ OFFSIDE POSITION", player.x - 60, player.y - 20);
  }

  ctx.font = "bold 24px Arial";
  if (gameState === GAME_STATE.GOAL) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "gold";
    ctx.fillText("🎉 GOAL! 🎉", canvas.width / 2 - 100, canvas.height / 2);
  } else if (gameState === GAME_STATE.OFFSIDE) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fillText("🚩 OFFSIDE!", canvas.width / 2 - 90, canvas.height / 2);
  }
}

function gameLoop() {
  movePlayer();
  if (gameState === GAME_STATE.PLAYING) {
    defendersAI();
    goalkeeperAI();
    updateBall();
    checkCollisions();
    checkGoal();
  }

  if (gameState === GAME_STATE.GOAL || gameState === GAME_STATE.OFFSIDE) {
    setTimeout(() => resetPlay(), 2000);
  }

  draw();
  requestAnimationFrame(gameLoop);
}
