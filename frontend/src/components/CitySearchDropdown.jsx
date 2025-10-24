import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

/**
 * CitySearchDropdown Component
 * 
 * A smart city search dropdown with KNN-based autocomplete filtering.
 * Features:
 * - Fetches available cities from the backend
 * - KNN algorithm to find and rank similar cities based on edit distance
 * - Real-time filtering as user types
 * - Dropdown with selectable options
 * - Keyboard navigation support
 */

// Calculate Levenshtein distance (edit distance) between two strings
const levenshteinDistance = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null)
  );
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[s2.length][s1.length];
};

// KNN-based city filtering algorithm
const filterCitiesKNN = (cities, query, k = 10) => {
  if (!query || query.trim() === '') {
    return cities.slice(0, k);
  }
  
  const queryLower = query.toLowerCase();
  
  // Calculate scores for each city
  const scoredCities = cities.map(city => {
    const cityLower = city.toLowerCase();
    
    // Priority 1: Exact match
    if (cityLower === queryLower) {
      return { city, score: 0, priority: 1 };
    }
    
    // Priority 2: Starts with query
    if (cityLower.startsWith(queryLower)) {
      return { city, score: cityLower.length - queryLower.length, priority: 2 };
    }
    
    // Priority 3: Contains query
    if (cityLower.includes(queryLower)) {
      const index = cityLower.indexOf(queryLower);
      return { city, score: index + cityLower.length, priority: 3 };
    }
    
    // Priority 4: Similar based on edit distance (KNN)
    const distance = levenshteinDistance(queryLower, cityLower);
    return { city, score: distance, priority: 4 };
  });
  
  // Sort by priority first, then by score
  scoredCities.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.score - b.score;
  });
  
  // Return top k results
  return scoredCities.slice(0, k).map(item => item.city);
};

const CitySearchDropdown = ({ value, onChange, placeholder = "Search city...", className = "" }) => {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch available cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/donors/cities/available');
        if (response.data.success) {
          setCities(response.data.data);
          setFilteredCities(response.data.data.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter cities using KNN algorithm when input changes
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredCities(cities.slice(0, 10));
    } else {
      const filtered = filterCitiesKNN(cities, inputValue, 10);
      setFilteredCities(filtered);
    }
    setSelectedIndex(-1);
  }, [inputValue, cities]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onChange(newValue);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setInputValue(city);
    setIsOpen(false);
    onChange(city);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCities.length) {
          handleCitySelect(filteredCities[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full ${className}`}
          disabled={loading}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        {!loading && inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-white/30 dark:border-white/10 backdrop-blur-lg max-h-64 overflow-y-auto">
          <div className="py-2">
            {filteredCities.map((city, index) => (
              <button
                key={index}
                type="button"
                data-index={index}
                onClick={() => handleCitySelect(city)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  index === selectedIndex
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-600 dark:text-pink-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="font-medium">{city}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue && filteredCities.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-white/30 dark:border-white/10 backdrop-blur-lg p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No cities found matching "{inputValue}"
          </p>
        </div>
      )}
    </div>
  );
};

export default CitySearchDropdown;

