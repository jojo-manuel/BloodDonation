import React, { useState } from 'react';

const UserSearchForm = ({
  searchRole,
  setSearchRole,
  searchUsername,
  setSearchUsername,
  searchUserDate,
  setSearchUserDate,
  searchEmail,
  setSearchEmail,
  onClear
}) => {
  const [emailError, setEmailError] = useState('');

  // Updated email regex to only accept emails in the format: local-part@domain.tld
  // where local-part: alphanumeric and some special chars, domain: alphanumeric and hyphens, tld: 2-6 letters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}$/;

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setSearchEmail(value);

    if (value && !emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
      <form className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={handleEmailChange}
              className={`w-full p-2.5 text-sm text-gray-900 bg-gray-50 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500 ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Search by role..."
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={searchUserDate}
              onChange={(e) => setSearchUserDate(e.target.value)}
              className="w-full p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <svg className="w-4 h-4 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserSearchForm;
