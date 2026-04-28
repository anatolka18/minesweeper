import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-amber-50">
      <header className="flex justify-center px-6 py-4 border-b border-amber-200">
        <h1 className="text-2xl font-bold text-gray-800">Настройки игры</h1>
      </header>

      <main className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-lg space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Ширина поля (X)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={50}
                value={settings.width}
                onChange={(e) => setSettings({ ...settings, width: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                5…50
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Высота поля (Y)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={50}
                value={settings.height}
                onChange={(e) => setSettings({ ...settings, height: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                5…50
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Размер клетки (px)
            </label>
            <div className="relative">
              <input
                type="number"
                min={15}
                max={35}
                value={settings.cellSize}
                onChange={(e) => setSettings({ ...settings, cellSize: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                15…35
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-lg font-medium text-gray-700 mb-2">Сложность</div>
            <div className="flex gap-6 items-center"> 
              <label className="flex items-center gap-3 text-base"> 
                <input
                  type="radio"
                  name="difficulty"
                  value="light"
                  checked={settings.difficulty === 'light'}
                  onChange={() => setSettings({ ...settings, difficulty: 'light' })}
                  className="h-6 w-6 text-amber-600" 
                />
                <span className="text-gray-700">Light --- 10%</span>
              </label>
              <label className="flex items-center gap-3 text-base">
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={settings.difficulty === 'normal'}
                  onChange={() => setSettings({ ...settings, difficulty: 'normal' })}
                  className="h-6 w-6 text-amber-600"
                />
                <span className="text-gray-700">Normal --- 15%</span>
              </label>
              <label className="flex items-center gap-3 text-base">
                <input
                  type="radio"
                  name="difficulty"
                  value="extreme"
                  checked={settings.difficulty === 'extreme'}
                  onChange={() => setSettings({ ...settings, difficulty: 'extreme' })}
                  className="h-6 w-6 text-amber-600"
                />
                <span className="text-gray-700">Extreme --- 20%</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="withTimer"
              checked={settings.withTimer}
              onChange={(e) => setSettings({ ...settings, withTimer: e.target.checked })}
              className="h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-400"
            />
            <label htmlFor="withTimer" className="text-lg text-gray-700">
              Игра со временем
            </label>
          </div>

          {settings.withTimer && (
            <div className="flex items-center justify-between">
              <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
                Время на игру (сек)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={999}
                  value={settings.timerDuration}
                  onChange={(e) => setSettings({ ...settings, timerDuration: +e.target.value })}
                  className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  10…999
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/game')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-md text-xl font-semibold transition-colors"
          >
            Начать игру
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;