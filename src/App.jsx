import React, { useEffect, useRef, useState } from 'react';

const Game2048 = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameState = useRef({
    grid: [],
    score: 0,
    gameOver: false
  });

  useEffect(() => {
    let p5Instance = null;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const sketch = (p) => {
        const size = 4;
        const tileSize = 100;
        const gap = 10;
        const colors = {
          0: '#cdc1b4',
          2: '#eee4da',
          4: '#ede0c8',
          8: '#f2b179',
          16: '#f59563',
          32: '#f67c5f',
          64: '#f65e3b',
          128: '#edcf72',
          256: '#edcc61',
          512: '#edc850',
          1024: '#edc53f',
          2048: '#edc22e'
        };

        p.setup = () => {
          p.createCanvas(size * tileSize + (size + 1) * gap, size * tileSize + (size + 1) * gap);
          initGame();
        };

        const initGame = () => {
          gameState.current.grid = Array(size).fill(null).map(() => Array(size).fill(0));
          gameState.current.score = 0;
          gameState.current.gameOver = false;
          setScore(0);
          setGameOver(false);
          addNewTile();
          addNewTile();
        };

        const addNewTile = () => {
          const empty = [];
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              if (gameState.current.grid[i][j] === 0) {
                empty.push({ i, j });
              }
            }
          }
          if (empty.length > 0) {
            const { i, j } = empty[Math.floor(Math.random() * empty.length)];
            gameState.current.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
          }
        };

        const move = (direction) => {
          let moved = false;
          const newGrid = JSON.parse(JSON.stringify(gameState.current.grid));

          const moveLeft = () => {
            for (let i = 0; i < size; i++) {
              let arr = newGrid[i].filter(val => val !== 0);
              for (let j = 0; j < arr.length - 1; j++) {
                if (arr[j] === arr[j + 1]) {
                  arr[j] *= 2;
                  gameState.current.score += arr[j];
                  arr.splice(j + 1, 1);
                  moved = true;
                }
              }
              while (arr.length < size) arr.push(0);
              if (JSON.stringify(arr) !== JSON.stringify(newGrid[i])) moved = true;
              newGrid[i] = arr;
            }
          };

          const transpose = () => {
            for (let i = 0; i < size; i++) {
              for (let j = i + 1; j < size; j++) {
                [newGrid[i][j], newGrid[j][i]] = [newGrid[j][i], newGrid[i][j]];
              }
            }
          };

          const reverse = () => {
            for (let i = 0; i < size; i++) {
              newGrid[i].reverse();
            }
          };

          if (direction === 'left') {
            moveLeft();
          } else if (direction === 'right') {
            reverse();
            moveLeft();
            reverse();
          } else if (direction === 'up') {
            transpose();
            moveLeft();
            transpose();
          } else if (direction === 'down') {
            transpose();
            reverse();
            moveLeft();
            reverse();
            transpose();
          }

          if (moved) {
            gameState.current.grid = newGrid;
            addNewTile();
            setScore(gameState.current.score);
            checkGameOver();
          }
        };

        const checkGameOver = () => {
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              if (gameState.current.grid[i][j] === 0) return;
              if (i < size - 1 && gameState.current.grid[i][j] === gameState.current.grid[i + 1][j]) return;
              if (j < size - 1 && gameState.current.grid[i][j] === gameState.current.grid[i][j + 1]) return;
            }
          }
          gameState.current.gameOver = true;
          setGameOver(true);
        };

        p.draw = () => {
          p.background('#bbada0');

          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              const x = gap + j * (tileSize + gap);
              const y = gap + i * (tileSize + gap);
              const val = gameState.current.grid[i][j];

              p.fill(colors[val] || '#3c3a32');
              p.noStroke();
              p.rect(x, y, tileSize, tileSize, 5);

              if (val !== 0) {
                p.fill(val <= 4 ? '#776e65' : '#f9f6f2');
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(val < 100 ? 48 : val < 1000 ? 36 : 30);
                p.textStyle(p.BOLD);
                p.text(val, x + tileSize / 2, y + tileSize / 2);
              }
            }
          }
        };

        p.keyPressed = () => {
          if (gameState.current.gameOver) return;

          if (p.keyCode === p.LEFT_ARROW) {
            move('left');
          } else if (p.keyCode === p.RIGHT_ARROW) {
            move('right');
          } else if (p.keyCode === p.UP_ARROW) {
            move('up');
          } else if (p.keyCode === p.DOWN_ARROW) {
            move('down');
          }
        };

        window.resetGame = initGame;
      };

      p5Instance = new p5(sketch, canvasRef.current);
    };

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      window.resetGame = null;
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fffbeb, #fed7aa)',
      padding: '32px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>2048</h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '14px',
              color: '#4b5563',
              marginBottom: '4px'
            }}>スコア</div>
            <div style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#ea580c'
            }}>{score}</div>
          </div>
        </div>

        <div ref={canvasRef} style={{ marginBottom: '16px' }} />

        {gameOver && (
          <div style={{
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <p style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '8px'
            }}>ゲームオーバー！</p>
          </div>
        )}

        <button
          onClick={() => window.resetGame && window.resetGame()}
          style={{
            width: '100%',
            background: '#f97316',
            color: 'white',
            fontWeight: 'bold',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#ea580c'}
          onMouseOut={(e) => e.target.style.background = '#f97316'}
        >
          新しいゲーム
        </button>

        <div style={{
          marginTop: '24px',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          <p style={{ marginBottom: '8px' }}>🎮 矢印キーで操作</p>
          <p>同じ数字のタイルを合わせて2048を目指そう！</p>
        </div>
      </div>
    </div>
  );
};

export default Game2048;