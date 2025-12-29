import { useState, useEffect, useRef } from 'react';

export default function AirportSearch({ label, value, onChange, placeholder }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search airports when search term changes
  useEffect(() => {
    const searchAirports = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/airports?search=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching airports:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAirports, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (airport) => {
    onChange({
      lat: airport.latitude,
      lon: airport.longitude,
      name: `${airport.name} (${airport.iata_code || airport.icao_code})`,
      code: airport.iata_code || airport.icao_code,
      city: airport.city,
      country: airport.country
    });
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const displayValue = value && value.name ? value.name : '';

  return (
    <div className="airport-search" ref={dropdownRef}>
      <label>{label}</label>
      <div className="search-input-container">
        <input
          type="text"
          className="airport-search-input"
          placeholder={placeholder || "Search by airport code, name, or city..."}
          value={searchTerm || displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        {isLoading && <div className="search-spinner">Searching...</div>}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="airport-dropdown">
          {results.map((airport) => (
            <div
              key={airport.iata_code || airport.icao_code}
              className="airport-item"
              onClick={() => handleSelect(airport)}
            >
              <div className="airport-code">
                {airport.iata_code || airport.icao_code}
              </div>
              <div className="airport-details">
                <div className="airport-name">{airport.name}</div>
                <div className="airport-location">
                  {airport.city}, {airport.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value && value.lat && (
        <div className="selected-airport-info">
          <small>
            {value.city && value.country && `${value.city}, ${value.country} • `}
            Lat: {parseFloat(value.lat).toFixed(4)}, Lon: {parseFloat(value.lon).toFixed(4)}
          </small>
        </div>
      )}
    </div>
  );
}
