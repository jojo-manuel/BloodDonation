import React from 'react';

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mb-4 w-full max-w-md rounded border border-gray-300 px-4 py-2 shadow-sm focus:border-pink-500 focus:ring focus:ring-pink-300 focus:ring-opacity-50 transition"
    />
  );
}
