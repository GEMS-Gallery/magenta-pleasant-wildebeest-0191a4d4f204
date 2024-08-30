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

const App: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [lastSpinResult, setLastSpinResult] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<number>(1);
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBalance();
    fetchLastSpinResult();
  }, []);

  const fetchBalance = async () => {
    const result = await backend.getBalance();
    setBalance(Number(result));
  };

  const fetchLastSpinResult = async () => {
    const result = await backend.getLastSpinResult();
    setLastSpinResult(result[0] !== null ? Number(result[0]) : null);
  };

  const placeBet = async (betType: string) => {
    if (balance < selectedChip) {
      alert('Insufficient balance');
      return;
    }
    const newBets = { ...bets };
    newBets[betType] = (newBets[betType] || 0) + selectedChip;
    setBets(newBets);
    await backend.placeBet(betType, BigInt(selectedChip));
    fetchBalance();
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

  const spin = async () => {
    setIsSpinning(true);
    spinWheel();
    const result = await backend.spin();
    const winningNumber = Number(result.ok);
    setTimeout(() => {
      setLastSpinResult(winningNumber);
      setBets({});
      fetchBalance();
      setIsSpinning(false);
    }, 4000);
  };

  const renderWheel = () => {
    return (
      <div className="wheel" ref={wheelRef}>
        <div className="wheel-inner"></div>
        <div ref={ballRef} className="ball"></div>
      </div>
    );
  };

  const renderBettingGrid = () => {
    const numbers = Array.from({ length: 36 }, (_, i) => i + 1);
    return (
      <div className="betting-grid">
        <div className="bet-box green" onClick={() => placeBet('0')}>0</div>
        {numbers.map(number => (
          <div
            key={number}
            className={`bet-box ${redNumbers.includes(number) ? 'red' : 'black'}`}
            onClick={() => placeBet(number.toString())}
          >
            {number}
          </div>
        ))}
        <div className="bet-box" onClick={() => placeBet('1st12')}>1st 12</div>
        <div className="bet-box" onClick={() => placeBet('2nd12')}>2nd 12</div>
        <div className="bet-box" onClick={() => placeBet('3rd12')}>3rd 12</div>
        <div className="bet-box" onClick={() => placeBet('1-18')}>1-18</div>
        <div className="bet-box" onClick={() => placeBet('even')}>Even</div>
        <div className="bet-box red" onClick={() => placeBet('red')}>Red</div>
        <div className="bet-box black" onClick={() => placeBet('black')}>Black</div>
        <div className="bet-box" onClick={() => placeBet('odd')}>Odd</div>
        <div className="bet-box" onClick={() => placeBet('19-36')}>19-36</div>
      </div>
    );
  };

  const getResultColor = (number: number) => {
    if (number === 0) return 'green';
    return redNumbers.includes(number) ? 'red' : 'black';
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
        </div>
        <div className="betting-area">
          {renderBettingGrid()}
          <div className="chip-rack">
            {[1, 5, 10, 25, 100].map((value) => (
              <div key={value} className="chip-stack">
                <button
                  className={`chip-button chip-${value}`}
                  onClick={() => setSelectedChip(value)}
                >
                  ${value}
                </button>
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
