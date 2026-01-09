import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { GameOverPage } from './pages/GameOverPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/game-over" element={<GameOverPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
