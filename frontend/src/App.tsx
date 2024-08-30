import React, { useState, useEffect, useRef } from 'react';
import { backend } from '../declarations/backend';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress } from '@mui/material';
import Modal from 'react-modal';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffd700',
    },
    background: {
      default: '#1a1a2e',
      paper: '#16213e',
    },
  },
});

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface ChipPosition {
  betType: string;
  amount: number;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [lastSpinResult, setLastSpinResult] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<number>(1);
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [chipPositions, setChipPositions] = useState<ChipPosition[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<number[]>([]);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBalance();
    fetchLastSpinResult();
    fetchSpinHistory();
  }, []);

  const fetchBalance = async () => {
    const result = await backend.getBalance();
    setBalance(Number(result));
  };

  const fetchLastSpinResult = async () => {
    const result = await backend.getLastSpinResult();
    setLastSpinResult(result[0] !== null ? Number(result[0]) : null);
  };

  const fetchSpinHistory = async () => {
    const history = await backend.getSpinHistory();
    setSpinHistory(history.map(Number));
  };

  const placeBet = (betType: string, amount: number, x: number, y: number) => {
    const newBets = { ...bets };
    newBets[betType] = (newBets[betType] || 0) + amount;
    setBets(newBets);
    setChipPositions(prevPositions => [...prevPositions, { betType, amount, x, y }]);
  };

  const handleChipDrag = (e: React.DragEvent<HTMLDivElement>, chipValue: number) => {
    e.dataTransfer.setData('text/plain', chipValue.toString());
  };

  const handleChipDrop = (e: React.DragEvent<HTMLDivElement>, betType: string) => {
    e.preventDefault();
    const chipValue = Number(e.dataTransfer.getData('text'));
    const tableRect = tableRef.current?.getBoundingClientRect();
    const dropRect = e.currentTarget.getBoundingClientRect();
    
    if (tableRect) {
      const x = e.clientX - tableRect.left;
      const y = e.clientY - tableRect.top;
      placeBet(betType, chipValue, x, y);
    }
  };

  const spinWheel = () => {
    if (wheelRef.current && ballRef.current) {
      wheelRef.current.classList.add('spinning');
      ballRef.current.classList.add('spinning');
      setTimeout(() => {
        if (wheelRef.current && ballRef.current) {
          wheelRef.current.classList.remove('spinning');
          ballRef.current.classList.remove('spinning');
        }
      }, 4000);
    }
  };

  const simulateRandomNumberGeneration = () => {
    let count = 0;
    const interval = setInterval(() => {
      const randomNum = Math.floor(Math.random() * 37);
      setRandomNumber(randomNum);
      count++;
      if (count >= 20) {
        clearInterval(interval);
        setRandomNumber(null);
      }
    }, 100);
  };

  const spin = async () => {
    if (Object.keys(bets).length === 0) {
      alert('Please place a bet before spinning.');
      return;
    }

    setIsSpinning(true);
    spinWheel();
    simulateRandomNumberGeneration();

    try {
      await backend.placeMultipleBets(Object.entries(bets).map(([betType, amount]) => [betType, BigInt(amount)]));
      const result = await backend.spin();
      const winningNumber = Number(result.ok);
      setTimeout(() => {
        setLastSpinResult(winningNumber);
        setSpinHistory(prevHistory => [winningNumber, ...prevHistory.slice(0, 9)]);
        setBets({});
        setChipPositions([]);
        fetchBalance();
        setIsSpinning(false);
        setRandomNumber(winningNumber);
      }, 4000);
    } catch (error) {
      console.error('Error during spin:', error);
      setIsSpinning(false);
      alert('An error occurred while spinning. Please try again.');
    }
  };

  const renderWheel = () => {
    return (
      <div className="wheel" ref={wheelRef}>
        <div className="wheel-inner"></div>
        <div ref={ballRef} className="ball"></div>
        {randomNumber !== null && (
          <div className="random-number-display" style={{ color: getResultColor(randomNumber) }}>
            {randomNumber}
          </div>
        )}
      </div>
    );
  };

  const renderBettingTable = () => {
    const numbers = Array.from({ length: 36 }, (_, i) => i + 1);
    return (
      <div className="roulette-table" ref={tableRef}>
        <div className="bet-box green" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '0')}>0</div>
        {numbers.map(number => (
          <div
            key={number}
            className={`bet-box ${redNumbers.includes(number) ? 'red' : 'black'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleChipDrop(e, number.toString())}
          >
            {number}
          </div>
        ))}
        <div className="bet-box dozen" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '1st12')}>1st 12</div>
        <div className="bet-box dozen" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '2nd12')}>2nd 12</div>
        <div className="bet-box dozen" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '3rd12')}>3rd 12</div>
        <div className="bet-box column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '2to1_first')}>2 to 1</div>
        <div className="bet-box column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '2to1_second')}>2 to 1</div>
        <div className="bet-box column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '2to1_third')}>2 to 1</div>
        <div className="bet-box half" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '1-18')}>1-18</div>
        <div className="bet-box half" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, 'even')}>Even</div>
        <div className="bet-box half red" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, 'red')}>Red</div>
        <div className="bet-box half black" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, 'black')}>Black</div>
        <div className="bet-box half" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, 'odd')}>Odd</div>
        <div className="bet-box half" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleChipDrop(e, '19-36')}>19-36</div>
        {chipPositions.map((chip, index) => (
          <div
            key={index}
            className={`chip chip-${chip.amount} chip-on-table`}
            style={{ left: `${chip.x}px`, top: `${chip.y}px` }}
          >
            ${chip.amount}
          </div>
        ))}
      </div>
    );
  };

  const getResultColor = (number: number) => {
    if (number === 0) return 'green';
    return redNumbers.includes(number) ? 'red' : 'black';
  };

  const renderSpinHistory = () => {
    return (
      <div className="spin-history">
        <h3>Spin History</h3>
        <ul>
          {spinHistory.map((number, index) => (
            <li key={index} className={getResultColor(number)}>
              {number} ({getResultColor(number)})
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="game-container">
        <div className="left-panel">
          <div className="balance-display">Balance: ${balance}</div>
          <div className="wheel-container">
            {renderWheel()}
          </div>
          <div id="result">
            {isSpinning ? (
              <CircularProgress />
            ) : lastSpinResult !== null ? (
              `Last spin: ${lastSpinResult} (${getResultColor(lastSpinResult)})`
            ) : (
              ''
            )}
          </div>
          {renderSpinHistory()}
        </div>
        <div className="betting-area">
          {renderBettingTable()}
          <div className="chip-rack">
            {[1, 5, 10, 25, 100].map((value) => (
              <div key={value} className="chip-stack">
                <div
                  className={`chip chip-${value}`}
                  draggable
                  onDragStart={(e) => handleChipDrag(e, value)}
                >
                  ${value}
                </div>
              </div>
            ))}
          </div>
          <button id="spinButton" onClick={spin} disabled={isSpinning}>
            {isSpinning ? 'Spinning...' : 'SPIN'}
          </button>
        </div>
      </div>
      <button onClick={() => setShowRules(true)}>Rules</button>
      <Modal
        isOpen={showRules}
        onRequestClose={() => setShowRules(false)}
        contentLabel="Roulette Rules"
      >
        <h2>Roulette Rules</h2>
        {/* Add roulette rules content here */}
        <button onClick={() => setShowRules(false)}>Close</button>
      </Modal>
    </ThemeProvider>
  );
};

export default App;
