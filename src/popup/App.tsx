import React from 'react'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Сапёр
        </h1>
        <p className="text-gray-600 mt-2">
          Расширение работает!
        </p>
      </div>
    </div>
  );
};

export default App;