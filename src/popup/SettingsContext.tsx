import { createContext, useContext } from 'react';
import { Difficulty } from './minesweeperLogic';

interface GameSettings {
  width: number;
  height: number;
  withTimer: boolean;
  cellSize: number;
  timerDuration: number;
  difficulty: Difficulty;
}

const SettingsContext = createContext<{
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
} | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};

export default SettingsContext;
export type { GameSettings };