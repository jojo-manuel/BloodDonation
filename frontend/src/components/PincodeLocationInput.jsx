// PincodeLocationInput Component
// Auto-fills location fields when a valid pincode is entered

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getLocationByPincode } from '../lib/pincodeApi';

// Custom debounce function
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
}

/**
 * Pincode input component that auto-fills location fields
 * 
 * @param {object} props
 * @param {function} props.onLocationChange - Callback when location is fetched (receives { pincode, city, district, state, area })
 * @param {string} props.initialPincode - Initial pincode value
 * @param {string} props.className - Additional CSS classes for the container
 * @param {boolean} props.showAllFields - Whether to show all location fields (default: true)
 * @param {boolean} props.disabled - Whether the input is disabled
 */
export default function PincodeLocationInput({
    onLocationChange,
    initialPincode = '',
    className = '',
    showAllFields = true,
    disabled = false
}) {
    const [pincode, setPincode] = useState(initialPincode);
    const [location, setLocation] = useState({
        area: '',
        city: '',
        district: '',
        state: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Function to fetch location
    const doFetchLocation = useCallback(async (pincodeValue) => {
        if (!pincodeValue || pincodeValue.length !== 6) {
            setLocation({ area: '', city: '', district: '', state: '', country: '' });
            setError('');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await getLocationByPincode(pincodeValue);
            const newLocation = {
                area: data.area || '',
                city: data.city || '',
                district: data.district || '',
                state: data.state || '',
                country: data.country || 'India'
            };
            setLocation(newLocation);

            // Notify parent component
            if (onLocationChange) {
                onLocationChange({
                    pincode: pincodeValue,
                    ...newLocation
                });
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch location');
            setLocation({ area: '', city: '', district: '', state: '', country: '' });
        } finally {
            setLoading(false);
        }
    }, [onLocationChange]);

    // Debounced version
    const fetchLocation = useDebounce(doFetchLocation, 500);

    const handlePincodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
        setPincode(value);
        fetchLocation(value);
    };

    return (
        <div className={`pincode-location-input ${className}`}>
            {/* Pincode Input */}
            <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-200">
                    Pincode <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit pincode"
                        className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-pink-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                        value={pincode}
                        onChange={handlePincodeChange}
                        maxLength={6}
                        disabled={disabled}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="animate-spin text-pink-400">⏳</span>
                        </div>
                    )}
                </div>
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>

            {/* Auto-filled Location Fields */}
            {showAllFields && pincode.length === 6 && !error && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-fadeIn">
                    {/* Area/Post Office */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-200">Area/Locality</label>
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-gray-400 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                            value={location.area}
                            readOnly
                            disabled
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-200">City/Block</label>
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-gray-400 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                            value={location.city}
                            readOnly
                            disabled
                        />
                    </div>

                    {/* District */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-200">District</label>
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-gray-400 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                            value={location.district}
                            readOnly
                            disabled
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-200">State</label>
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-gray-400 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                            value={location.state}
                            readOnly
                            disabled
                        />
                    </div>
                </div>
            )}

            {/* Success indicator */}
            {location.state && !loading && !error && (
                <div className="mt-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm flex items-center gap-2">
                    <span>✅</span>
                    <span>Location found: {location.area}, {location.district}, {location.state}</span>
                </div>
            )}
        </div>
    );
}
