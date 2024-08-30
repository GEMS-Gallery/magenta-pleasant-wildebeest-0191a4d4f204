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
    // Implement wheel rendering logic here
    return <div className="wheel"></div>;
  };

  const renderBettingGrid = () => {
    // Implement betting grid rendering logic here
    return <div className="betting-grid"></div>;
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
