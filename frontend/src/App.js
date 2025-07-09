import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'gameOver'
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const gameStateRef = useRef({
    player: {
      x: 50,
      y: 400,
      width: 30,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpPower: 15,
      onGround: false,
      color: '#FF6B6B'
    },
    camera: {
      x: 0,
      y: 0
    },
    platforms: [
      // Starting platform
      { x: 0, y: 450, width: 200, height: 20, color: '#4ECDC4' },
      
      // Level 1 platforms
      { x: 250, y: 400, width: 150, height: 20, color: '#45B7D1' },
      { x: 450, y: 350, width: 120, height: 20, color: '#45B7D1' },
      { x: 620, y: 300, width: 100, height: 20, color: '#45B7D1' },
      
      // Level 2 platforms
      { x: 780, y: 250, width: 130, height: 20, color: '#96CEB4' },
      { x: 950, y: 200, width: 110, height: 20, color: '#96CEB4' },
      { x: 1120, y: 150, width: 140, height: 20, color: '#96CEB4' },
      
      // Level 3 platforms
      { x: 1320, y: 100, width: 120, height: 20, color: '#FFEAA7' },
      { x: 1500, y: 50, width: 100, height: 20, color: '#FFEAA7' },
      
      // Final platform (top)
      { x: 1650, y: 20, width: 200, height: 20, color: '#FD79A8' }
    ],
    keys: {},
    gravity: 0.8,
    groundY: 470,
    canvasWidth: 800,
    canvasHeight: 600,
    worldWidth: 2000,
    levelHeight: 0 // Will be calculated based on highest platform
  });

  const keysRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    gameStateRef.current.canvasWidth = canvas.width;
    gameStateRef.current.canvasHeight = canvas.height;

    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    window.innerWidth <= 768;
      setIsMobile(mobile);

    const canvas = canvasRef.current;
    canvas.width = isMobile ? Math.min(window.innerWidth - 40, 800) : 800;
    canvas.height = isMobile ? Math.min(window.innerHeight * 0.6, 600) : 600;

    gameStateRef.current.canvasWidth = canvas.width;
    gameStateRef.current.canvasHeight = canvas.height;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Calculate level height based on highest platform
    const highestPlatform = gameStateRef.current.platforms.reduce((highest, platform) => 
      platform.y < highest ? platform.y : highest, 500);
    gameStateRef.current.levelHeight = highestPlatform;

    // Event listeners for keyboard input
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      keysRef.current[e.code] = true;
      e.preventDefault();
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
      keysRef.current[e.code] = false;
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const gameLoop = () => {
      update();
      render(ctx);
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', checkMobile);
    };
  }, []); 

  const update = () => {
    const gameState = gameStateRef.current;
    const player = gameState.player;
    const keys = keysRef.current;

    if (gameState.gameWon) return;

    // Calculate difficulty multiplier based on player height
    const playerHeight = gameState.groundY - player.y;
    const maxHeight = gameState.groundY - gameState.levelHeight;
    const heightProgress = Math.min(playerHeight / maxHeight, 1);
    
    // Progressive difficulty - gets more sensitive as you climb higher
    const sensitivityMultiplier = 1 + (heightProgress * 2.5); // 1x to 3.5x sensitivity
    const frictionReduction = Math.max(0.3, 0.8 - (heightProgress * 0.5)); // Less friction at height
    const jumpSensitivity = 1 + (heightProgress * 0.8); // Slightly more jump power but harder to control

    // Handle input with progressive sensitivity
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.velocityX = -player.speed * sensitivityMultiplier;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      player.velocityX = player.speed * sensitivityMultiplier;
    } else {
      player.velocityX *= frictionReduction; // Reduced friction = more sliding
    }

    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.onGround) {
      player.velocityY = -player.jumpPower * jumpSensitivity;
      player.onGround = false;
    }

    // Apply gravity
    player.velocityY += gameState.gravity;

    // Update player position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Check platform collisions
    player.onGround = false;
    
    for (let platform of gameState.platforms) {
      // Check if player is landing on platform from above
      if (player.x + player.width > platform.x && 
          player.x < platform.x + platform.width &&
          player.y + player.height > platform.y &&
          player.y + player.height < platform.y + platform.height + 10 &&
          player.velocityY > 0) {
        
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.onGround = true;
        break;
      }
    }

    // Ground collision
    if (player.y + player.height > gameState.groundY) {
      player.y = gameState.groundY - player.height;
      player.velocityY = 0;
      player.onGround = true;
    }

    // Update camera to follow player
    gameState.camera.x = player.x - gameState.canvasWidth / 2;
    gameState.camera.y = Math.max(0, player.y - gameState.canvasHeight / 2);

    // Keep camera within world bounds
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.worldWidth - gameState.canvasWidth));

    // Check win condition (reached the top platform)
    const topPlatform = gameState.platforms[gameState.platforms.length - 1];
    if (player.x + player.width > topPlatform.x && 
        player.x < topPlatform.x + topPlatform.width &&
        player.y + player.height <= topPlatform.y + 5) {
      setGameState('won');
      gameState.gameWon = true;
    }

    // Check if player fell off the world
    if (player.y > gameState.groundY + 100) {
      restartGame();
    }

    // Calculate current level based on player height
    const currentPlayerHeight = gameState.groundY - player.y;
    const newLevel = Math.floor(currentPlayerHeight / 100) + 1;
    setCurrentLevel(Math.max(1, Math.min(newLevel, 4)));

    // Clamp player within world horizontally
if (player.x < 0) {
  player.x = 0;
  player.velocityX = 0;
}
if (player.x + player.width > gameState.worldWidth) {
  player.x = gameState.worldWidth - player.width;
  player.velocityX = 0;
}

// Clamp player within world vertically (top)
if (player.y < 0) {
  player.y = 0;
  player.velocityY = 0;
}

// Update camera to follow player
gameState.camera.x = player.x - gameState.canvasWidth / 2;
gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.worldWidth - gameState.canvasWidth));

gameState.camera.y = player.y - gameState.canvasHeight / 2;
gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.groundY - gameState.canvasHeight));

  };

  const render = (ctx) => {
    const gameState = gameStateRef.current;
    const player = gameState.player;
    const camera = gameState.camera;

    // Clear canvas
    ctx.clearRect(0, 0, gameState.canvasWidth, gameState.canvasHeight);

    // Save context for camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, gameState.canvasHeight);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(camera.x, camera.y, gameState.canvasWidth, gameState.canvasHeight);

    // Draw platforms
    gameState.platforms.forEach(platform => {
      ctx.fillStyle = platform.color;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add platform border
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, gameState.groundY, gameState.worldWidth, 200);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player border
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    // Draw simple face on player
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(player.x + 8, player.y + 8, 4, 4); // Left eye
    ctx.fillRect(player.x + 18, player.y + 8, 4, 4); // Right eye
    ctx.fillRect(player.x + 10, player.y + 20, 10, 2); // Mouth

    // Restore context
    ctx.restore();
  };

  const restartGame = () => {
    gameStateRef.current.player = {
      x: 50,
      y: 400,
      width: 30,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpPower: 15,
      onGround: false,
      color: '#FF6B6B'
    };
    gameStateRef.current.camera = { x: 0, y: 0 };
    gameStateRef.current.gameWon = false;
    setGameState('playing');
    setCurrentLevel(1);
  };
  // Mobile touch controls
  const handleTouchStart = (e, action) => {
    e.preventDefault();
    keysRef.current[action] = true;
  };

  const handleTouchEnd = (e, action) => {
    e.preventDefault();
    keysRef.current[action] = false;
  };

  const handleJump = (e) => {
    e.preventDefault();
    keysRef.current['Space'] = true;
    setTimeout(() => {
      keysRef.current['Space'] = false;
    }, 100);
  }; 
  return (
    <div className="game-container">
      <div className="game-ui">
        <div className="level-indicator">Level: {currentLevel}</div>
        <div className="sensitivity-indicator">
          <span style={{ 
            color: currentLevel > 2 ? '#ff6b6b' : currentLevel > 1 ? '#feca57' : '#4ecdc4',
            fontWeight: 'bold' 
          }}>
            {currentLevel <= 1 ? 'Normal Controls' : 
             currentLevel <= 2 ? 'Getting Slippery!' : 
             currentLevel <= 3 ? 'Very Slippery!' : 'SUPER SLIPPERY!'}
          </span>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={isMobile ? Math.min(window.innerWidth - 40, 800) : 800}
        height={isMobile ? Math.min(window.innerHeight * 0.6, 600) : 600}
        className="game-canvas"
      />
       {/* Mobile Touch Controls */}
       {isMobile && (
        <div className="mobile-controls">
          <div className="movement-controls">
            <button 
              className="control-button left-button"
              onTouchStart={(e) => handleTouchStart(e, 'ArrowLeft')}
              onTouchEnd={(e) => handleTouchEnd(e, 'ArrowLeft')}
              onMouseDown={(e) => handleTouchStart(e, 'ArrowLeft')}
              onMouseUp={(e) => handleTouchEnd(e, 'ArrowLeft')}
              onMouseLeave={(e) => handleTouchEnd(e, 'ArrowLeft')}
            >
              ←
            </button>
            <button 
              className="control-button right-button"
              onTouchStart={(e) => handleTouchStart(e, 'ArrowRight')}
              onTouchEnd={(e) => handleTouchEnd(e, 'ArrowRight')}
              onMouseDown={(e) => handleTouchStart(e, 'ArrowRight')}
              onMouseUp={(e) => handleTouchEnd(e, 'ArrowRight')}
              onMouseLeave={(e) => handleTouchEnd(e, 'ArrowRight')}
            >
              →
            </button>
            <button 
              className="control-button jump-button"
              onTouchStart={handleJump}
              //onMouseDown={handleJump}
            >
              JUMP
            </button>
          </div>
          
        </div>
      )}
      {gameState === 'won' && (
        <div className="victory-screen">
          <h1>🎉 Congratulations! 🎉</h1>
          <p>You reached the top!</p>
          <button onClick={restartGame} className="restart-button">
            Play Again
          </button>
        </div>
      )}
      
      <div className="game-footer">
        <p>Jump through the floor levels to reach the top!</p>
      </div>
    </div>
  );
};

export default App;