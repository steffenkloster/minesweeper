import './App.css';
import "xp.css/dist/XP.css";
import { useState } from 'react';

function App() {
  const cellColors = ['#1400FB', '#047E00', '#FE0200', '#050080', '#7D0101', '#008080', '#000000', '#808080'];
  const getEmptyBoard = () => {
    const newBoard = [];
    Array.from({ length: size.x }, (_, gX) => {
      newBoard[gX] = [];
      Array.from({ length: size.y }, (_, gY) => {
        newBoard[gX][gY] = {
          x: gX,
          y: gY,
          toggled: false,
          flagged: false,
          bomb: false,
          bombsAround: 0
        };
      });
    });

    return newBoard;
  };

  const [settingsWindowVisible, setSettingsWindowVisible] = useState(false);
  const [windowVisible, setWindowVisible] = useState(true);
  const [size, setBoardSize] = useState({ x: 20, y: 20 });
  const [bombs, setBombsAmount] = useState(30);
  const [board, setBoard] = useState(getEmptyBoard());
  const [gameState, setGameState] = useState('idle');

  const flagCell = (x, y) => {
    if (typeof x == 'object') {
      x.preventDefault();
    }

    const target = (typeof x == 'object' ? x.target : document.querySelector(`.x${x}-y${y}`));
    x = parseInt(target.getAttribute('x'));
    y = parseInt(target.getAttribute('y'));

    const cell = board[x][y];
    if (cell.toggled) {
      return;
    }

    const newBoard = [...board];
    newBoard[x][y] = {
      ...cell,
      flagged: !cell.flagged
    };

    if (hasWon(newBoard)) {
      setGameState('won');
    }

    setBoard(newBoard);
  }

  const toggleCell = (x, y) => {
    const target = (typeof x == 'object' ? x.target : document.querySelector(`.x${x}-y${y}`));
    x = parseInt(target.getAttribute('x'));
    y = parseInt(target.getAttribute('y'));

    if (gameState === 'idle' || board.length === 0) {
      fillBoard(x, y);
      setGameState('started');
    }

    if (!['idle', 'started'].includes(gameState)) {
      return;
    }

    const cell = board[x][y];
    if (cell.flagged) {
      return;
    }

    const newBoard = [...board];

    if (cell.toggled && cell.bombsAround > 0) {
      const cellsAround = getCellsAround(board, cell.x, cell.y);
      const flaggedCells = cellsAround.filter(cell => cell.flagged);
      if (cell.bombsAround === flaggedCells.length) {
        toggleEmptyCellsAround(newBoard, cell);
      }
    }

    newBoard[x][y] = {
      ...cell,
      toggled: true
    };

    if (!cell.bomb && cell.bombsAround == 0) {
      toggleEmptyCellsAround(newBoard, cell);
    }

    if (cell.bomb) {
      setGameState('dead');
    }
    else if (hasWon(newBoard)) {
      setGameState('won');
    }

    setBoard(newBoard);
  };

  const resetGame = () => {
    setBoard(getEmptyBoard());
    setGameState('idle');
  };

  const hasWon = (board) => {
    const onlyBombsLeft = board.reduce((prev, cells) => prev + cells.filter(cell => !cell.toggled).length, 0) === bombs;
    const allBombsFlagged = board.reduce((prev, cells) => prev + cells.filter(cell => cell.flagged && cell.bomb).length, 0) === bombs;
    return onlyBombsLeft || allBombsFlagged;
  };

  const fillBoard = (x, y) => {
    const newBoard = [...board];

    let bombsLeft = bombs;
    while (bombsLeft > 0) {
      const bombX = getRandomInt(size.x - 1);
      const bombY = getRandomInt(size.y - 1);
      if ((bombX === x && bombY === y) || newBoard[bombX][bombY] === true) {
        continue;
      }

      newBoard[bombX][bombY].bomb = true;
      bombsLeft--;
    }

    Array.from({ length: size.x }, (_, gX) => {
      Array.from({ length: size.y }, (_, gY) => {
        const cellsAround = getCellsAround(newBoard, gX, gY);
        const bombsAround = cellsAround.filter(cell => cell.bomb);
        newBoard[gX][gY].bombsAround = bombsAround.length;
      });
    });

    setBoard(newBoard);
  };

  const toggleEmptyCellsAround = (board, cell) => {
    const cellsArround = getCellsAround(board, cell.x, cell.y);
    const untoggledCells = cellsArround.filter(cell => !cell.toggled);
    untoggledCells.forEach(untoggledCell => {
      if (untoggledCell.flagged) {
        return;
      }

      untoggledCell.toggled = true;
      if (untoggledCell.bombsAround === 0) {
        toggleEmptyCellsAround(board, untoggledCell);
      }
    })
  };

  const getCellsAround = (array, i, j) => {
    const rowLimit = array.length - 1;
    const columnLimit = array[0].length - 1;
    const results = [];

    for (let x = Math.max(0, i - 1); x <= Math.min(i + 1, rowLimit); x++) {
      for (let y = Math.max(0, j - 1); y <= Math.min(j + 1, columnLimit); y++) {
        if (x !== i || y !== j) {
          results.push(array[x][y]);
        }
      }
    }

    return results;
  };

  const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
  }

  const toggleFullscreen = () => {
    const element = document.documentElement;
    const requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
    if (requestMethod) {
      requestMethod.call(element);
    }
  };

  return (
    <div className="App select-none">
      <div className='fixed top-0 left-0 w-24 m-3 flex flex-col items-center text-white' onDoubleClick={() => setWindowVisible(true)}>
        <img src="/desktop-icon.png" alt="image" className="w-12 h-12" />
        <div className='cursor-default'>
          <span style={{ textShadow: '1px 1px 2px black' }}>Minesweeper</span>
        </div>
      </div>
      <div className={`${windowVisible ? 'block' : 'hidden'}`}>
        <div className='window w-min absolute left-1/2 top-1/2' style={{ transform: 'translate(-50%,-50%)' }}>
          <div className='title-bar' style={{ height: '30px' }}>
            <div className='title-bar-text pointer-events-none select-none'>
              Minesweeper
            </div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize" onClick={toggleFullscreen}></button>
              <button aria-label="Close" onClick={() => {
                setWindowVisible(false);
                resetGame();
              }}></button>
            </div>
          </div>
          <div className='window-body' style={{ margin: '3px', marginBottom: '0', marginTop: '0', textAlign: 'left' }}>
            <div className='controlpanel bg-[#EBE9D8] flex text-black'>
              <div onClick={() => setSettingsWindowVisible(true)}>
                Game
              </div>
              <div>
                Help
              </div>
            </div>

            <div className='border-4 border-white' style={{ borderStyle: 'outset' }}>
              <div className='bg-[#C0C0C0] p-2 flex flex-col gap-y-2'>
                <div className='border-2 p-1 flex justify-between text-red-600' style={{ borderStyle: 'inset', fontFamily: 'dismay' }}>
                  <div className='border bg-black text-4xl leading-4 h-8 flex items-center justify-center pl-0.5 pt-0.5 relative' style={{ borderStyle: 'inset' }}>
                    <div className='absolute top-2 left-0.5 opacity-40'>
                      888
                    </div>
                    <div className=''>
                      000
                    </div>
                  </div>

                  <div className={`border-2 text-xl px-1 cursor-pointer game-button ${gameState}`} onClick={resetGame}>

                  </div>

                  <div className='border bg-black text-4xl leading-4 h-8 flex items-center justify-center pl-0.5 pt-0.5 relative' style={{ borderStyle: 'inset' }}>
                    <div className='absolute top-2 left-0.5 opacity-40'>
                      888
                    </div>
                    <div className=''>
                      000
                    </div>
                  </div>
                </div>
                <div className='border-4 border-r-white border-b-white' style={{ borderStyle: 'inset' }}>
                  {
                    board.map((row, x) =>
                      <div className='flex' key={`row-${x}`}>
                        {
                          row.map((cell, y) => {
                            return (
                              <div key={`${x}-${y}`} x={x} y={y} className={`cell x${x}-y${y} ${cell.toggled ? `toggled ${cell.bomb ? 'bomb' : ''}` : (cell.flagged ? 'flagged' : '')}`} onClick={toggleCell} onContextMenu={flagCell} style={{ color: !cell.toggled || cell.bombsAround === 0 || cell.bomb ? 'black' : cellColors[cell.bombsAround - 1] }}>
                                {cell ? (cell.toggled ? (cell.bomb ? '*' : (cell.bombsAround > 0 ? cell.bombsAround : '')) : (cell.flagged ? '`' : '')) : ''}
                              </div>
                            );
                          }
                          )
                        }
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`window w-min absolute left-1/2 top-1/2 ${settingsWindowVisible ? 'block' : 'hidden'}`} style={{ transform: 'translate(-50%,-50%)' }}>
          <div className='title-bar' style={{ height: '30px' }}>
            <div className='title-bar-text pointer-events-none select-none'>
              Settings
            </div>
            <div className="title-bar-controls">
              <button aria-label="Close" onClick={() => setSettingsWindowVisible(false)}></button>
            </div>
          </div>
          <div className='window-body flex flex-col gap-y-2'>
            <div>Select difficulty</div>

            <div>
              <div className="field-row">
                <input id="radio5" type="radio" name="first-example" />
                <label htmlFor="radio5">Beginner</label>
              </div>
              <div className="field-row">
                <input id="radio6" type="radio" name="first-example" />
                <label htmlFor="radio6">Intermediate</label>
              </div>
              <div className="field-row">
                <input id="radio7" type="radio" name="first-example" />
                <label htmlFor="radio7">Expert</label>
              </div>
            </div>

            <div className='flex gap-x-2'>
              <button>Save</button>
              <button onClick={() => setSettingsWindowVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
