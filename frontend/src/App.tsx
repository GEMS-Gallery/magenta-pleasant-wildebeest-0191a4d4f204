import React, { useState, useEffect } from 'react';
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

const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33,
  1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12,
  35, 3, 26
];

const App: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [lastSpinResult, setLastSpinResult] = useState<number | null>(null);
  const [selectedChip, setSelectedChip] = useState<number>(1);
  const [bets, setBets] = useState<{ [key: string]: number }>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

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

  const spin = async () => {
    setIsSpinning(true);
    const result = await backend.spin();
    setLastSpinResult(Number(result.ok));
    setBets({});
    fetchBalance();
    setIsSpinning(false);
  };

  const renderWheel = () => {
    return (
      <div className="wheel">
        <div className="wheel-inner"></div>
        {wheelNumbers.map((number, index) => {
          const angle = index * 360 / 37;
          return (
            <div
              key={number}
              className={`number-slot ${number === 0 ? 'green' : (number % 2 === 0 ? 'black' : 'red')}`}
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {number}
            </div>
          );
        })}
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
            className={`bet-box ${number % 2 === 0 ? 'black' : 'red'}`}
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="game-container">
        <div className="left-panel">
          <div className="balance-display">Balance: ${balance}</div>
          <div className="wheel-container">
            {renderWheel()}
            <div className="ball"></div>
            <div id="winning-number">{lastSpinResult !== null ? lastSpinResult : ''}</div>
          </div>
          <div id="result">
            {isSpinning ? <CircularProgress /> : lastSpinResult !== null ? `Last spin: ${lastSpinResult}` : ''}
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
