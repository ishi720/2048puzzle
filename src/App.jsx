import React, { useEffect, useRef, useState } from 'react';

const Game2048 = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameState = useRef({
    grid: [],
    score: 0,
    gameOver: false,
    tiles: [], // アニメーション用のタイル情報
    newTiles: [] // 新しく追加されたタイル
  });
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    let p5Instance = null;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const sketch = (p) => {
        const size = 4;
        let tileSize;
        let gap;
        const animationSpeed = 0.2;
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
          const baseTile = 100;
          const baseGap = 10;

          // スマホでも表示が切れないように画面幅に応じて縮小
          const maxWidth = Math.min(window.innerWidth * 0.9, 450); // 最大450px, 画面の90%以内
          const scale = maxWidth / (4 * baseTile + 5 * baseGap);

          tileSize = baseTile * scale;
          gap = baseGap * scale;

          p.createCanvas(4 * tileSize + 5 * gap, 4 * tileSize + 5 * gap);
          initGame();
        };

        const initGame = () => {
          gameState.current.grid = Array(size).fill(null).map(() => Array(size).fill(0));
          gameState.current.score = 0;
          gameState.current.gameOver = false;
          gameState.current.tiles = [];
          gameState.current.newTiles = [];
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
            const val = Math.random() < 0.9 ? 2 : 4;
            gameState.current.grid[i][j] = val;
            // 新しいタイルをマーク（スケールアニメーション用）
            gameState.current.newTiles.push({ i, j, scale: 0, val });
          }
        };

        const move = (direction) => {
          const oldGrid = JSON.parse(JSON.stringify(gameState.current.grid));
          let moved = false;
          const newGrid = JSON.parse(JSON.stringify(gameState.current.grid));
          const movements = []; // タイルの移動情報

          const moveLeft = () => {
            for (let i = 0; i < size; i++) {
              let arr = newGrid[i].filter(val => val !== 0);
              const original = [...newGrid[i]];

              // 移動前の位置を記録
              let fromPositions = [];
              for (let j = 0; j < size; j++) {
                if (original[j] !== 0) {
                  fromPositions.push({ val: original[j], from: j });
                }
              }

              let toIndex = 0;
              for (let j = 0; j < arr.length; j++) {
                if (j < arr.length - 1 && arr[j] === arr[j + 1]) {
                  arr[j] *= 2;
                  gameState.current.score += arr[j];
                  arr.splice(j + 1, 1);
                  moved = true;
                }
              }

              // 移動情報を記録
              for (let k = 0; k < arr.length; k++) {
                if (fromPositions[k]) {
                  movements.push({
                    row: i,
                    fromCol: fromPositions[k].from,
                    toCol: k,
                    val: arr[k]
                  });
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
            // アニメーション用のタイル情報を設定
            gameState.current.tiles = [];
            for (let i = 0; i < size; i++) {
              for (let j = 0; j < size; j++) {
                if (oldGrid[i][j] !== 0) {
                  // 移動先を探す
                  let targetI = i;
                  let targetJ = j;

                  if (newGrid[i][j] !== oldGrid[i][j] || newGrid[i][j] === 0) {
                    // タイルが移動または合体した
                    for (let ni = 0; ni < size; ni++) {
                      for (let nj = 0; nj < size; nj++) {
                        if (direction === 'left' && ni === i && nj <= j) {
                          if (newGrid[ni][nj] !== 0) {
                            targetI = ni;
                            targetJ = nj;
                          }
                        } else if (direction === 'right' && ni === i && nj >= j) {
                          if (newGrid[ni][nj] !== 0) {
                            targetI = ni;
                            targetJ = nj;
                          }
                        } else if (direction === 'up' && nj === j && ni <= i) {
                          if (newGrid[ni][nj] !== 0) {
                            targetI = ni;
                            targetJ = nj;
                          }
                        } else if (direction === 'down' && nj === j && ni >= i) {
                          if (newGrid[ni][nj] !== 0) {
                            targetI = ni;
                            targetJ = nj;
                          }
                        }
                      }
                    }
                  }

                  gameState.current.tiles.push({
                    val: oldGrid[i][j],
                    fromI: i,
                    fromJ: j,
                    toI: targetI,
                    toJ: targetJ,
                    progress: 0
                  });
                }
              }
            }

            gameState.current.grid = newGrid;
            setTimeout(() => {
              addNewTile();
              setScore(gameState.current.score);
              checkGameOver();
            }, 150);
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

        const getTilePosition = (row, col) => {
          return {
            x: gap + col * (tileSize + gap),
            y: gap + row * (tileSize + gap)
          };
        };

        p.draw = () => {
          p.background('#bbada0');

          // 背景のグリッドを描画
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              const { x, y } = getTilePosition(i, j);
              p.fill(colors[0]);
              p.noStroke();
              p.rect(x, y, tileSize, tileSize, 5);
            }
          }

          // アニメーション中のタイルを描画
          if (gameState.current.tiles.length > 0) {
            let allComplete = true;

            for (let tile of gameState.current.tiles) {
              if (tile.progress < 1) {
                allComplete = false;
                tile.progress += animationSpeed;
                if (tile.progress > 1) tile.progress = 1;
              }

              const fromPos = getTilePosition(tile.fromI, tile.fromJ);
              const toPos = getTilePosition(tile.toI, tile.toJ);

              const x = p.lerp(fromPos.x, toPos.x, tile.progress);
              const y = p.lerp(fromPos.y, toPos.y, tile.progress);

              p.fill(colors[tile.val] || '#3c3a32');
              p.noStroke();
              p.rect(x, y, tileSize, tileSize, 5);

              p.fill(tile.val <= 4 ? '#776e65' : '#f9f6f2');
              p.textAlign(p.CENTER, p.CENTER);
              p.textSize(tile.val < 100 ? 48 : tile.val < 1000 ? 36 : 30);
              p.textStyle(p.BOLD);
              p.text(tile.val, x + tileSize / 2, y + tileSize / 2);
            }

            if (allComplete) {
              gameState.current.tiles = [];
            }
          } else {
            // 通常の描画
            for (let i = 0; i < size; i++) {
              for (let j = 0; j < size; j++) {
                const val = gameState.current.grid[i][j];
                if (val !== 0) {
                  const { x, y } = getTilePosition(i, j);

                  // 新しいタイルのスケールアニメーション
                  let scale = 1;
                  const newTileIndex = gameState.current.newTiles.findIndex(t => t.i === i && t.j === j);
                  if (newTileIndex !== -1) {
                    const newTile = gameState.current.newTiles[newTileIndex];
                    newTile.scale += 0.15;
                    if (newTile.scale > 1) {
                      newTile.scale = 1;
                      gameState.current.newTiles.splice(newTileIndex, 1);
                    }
                    scale = newTile.scale;
                  }

                  p.push();
                  p.translate(x + tileSize / 2, y + tileSize / 2);
                  p.scale(scale);
                  p.translate(-tileSize / 2, -tileSize / 2);

                  p.fill(colors[val] || '#3c3a32');
                  p.noStroke();
                  p.rect(0, 0, tileSize, tileSize, 5);

                  p.fill(val <= 4 ? '#776e65' : '#f9f6f2');
                  p.textAlign(p.CENTER, p.CENTER);
                  p.textSize(val < 100 ? 48 : val < 1000 ? 36 : 30);
                  p.textStyle(p.BOLD);
                  p.text(val, tileSize / 2, tileSize / 2);

                  p.pop();
                }
              }
            }
          }
        };


        p.keyPressed = () => {
          if (gameState.current.gameOver || gameState.current.tiles.length > 0) return;

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

        // タッチ操作用の変数
        let touchStartX = null;
        let touchStartY = null;
        let isTouchInCanvas = false;

        p.touchStarted = () => {
          if (gameState.current.gameOver || gameState.current.tiles.length > 0) return;

          // canvas内のタッチのみ反応
          if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            touchStartX = p.mouseX;
            touchStartY = p.mouseY;
            isTouchInCanvas = true;
            return false; // デフォルトの動作を防ぐ
          }
        };

        p.touchEnded = () => {
          if (gameState.current.gameOver || gameState.current.tiles.length > 0) return;

          // canvas内のタッチのみ反応
          if (isTouchInCanvas && touchStartX !== null && touchStartY !== null) {
            const touchEndX = p.mouseX;
            const touchEndY = p.mouseY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              // 横方向のスワイプ
              if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                  move('right');
                } else {
                  move('left');
                }
              }
            } else {
              // 縦方向のスワイプ
              if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                  move('down');
                } else {
                  move('up');
                }
              }
            }
            // リセット
            touchStartX = null;
            touchStartY = null;
            isTouchInCanvas = false;
            
            return false; // デフォルトの動作を防ぐ
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
        padding: '32px'
      }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          background: 'white',
          padding: '16px',
          borderRadius: '8px'
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

        <button
          onClick={() => setShowRules(true)}
          style={{
            marginBottom: '16px',
            background: '#fbbf24',
            color: '#1f2937',
            fontWeight: 'bold',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ルールを表示
        </button>

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


      </div>
      {showRules && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          width: '85%',
          maxWidth: '500px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 'bold' }}>ルール</h2>
          <p>1. 矢印キーまたはスワイプでタイルを動かします。</p>
          <p>2. 同じ数字がぶつかると合体して2倍になります。</p>
          <p>3. 動かすたびに新しいタイル（2 または 4）が出現します。</p>
          <p>4. 2048 を作れるように目指しましょう。</p>
          <p>5. 動かせなくなったらゲームオーバーです。</p>

          <button
            onClick={() => setShowRules(false)}
            style={{
              marginTop: '16px',
              width: '100%',
              background: '#f97316',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default Game2048;