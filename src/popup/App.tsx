import React, { useState } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SettingsContext, { GameSettings } from './SettingsContext';
import SettingsPage from './SettingsPage';
import GamePage from './GamePage';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>({
    width: 20,
    height: 20,
    withTimer: false,
    cellSize: 25,
    timerDuration: 999,
    difficulty: 'normal',
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SettingsPage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </MemoryRouter>
    </SettingsContext.Provider>
  );
};

export default App;