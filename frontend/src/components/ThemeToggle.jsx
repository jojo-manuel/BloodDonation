import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggleTheme('default')}
        className={`px-3 py-1 rounded ${theme === 'default' ? 'bg-pink-600 text-white' : 'bg-purple-600 text-gray-300'}`}
      >
        Default
      </button>
      <button
        onClick={() => toggleTheme('dark')}
        className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-pink-600 text-white' : 'bg-purple-600 text-gray-300'}`}
      >
        Dark
      </button>
    </div>
  );
};

export default ThemeToggle;
