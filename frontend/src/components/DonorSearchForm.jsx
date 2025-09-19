import React, { useState } from 'react';

const DonorSearchForm = ({
  searchBloodGroup,
  setSearchBloodGroup,
  searchPlace,
  setSearchPlace,
  searchEmail,
  setSearchEmail,
  showDropdown,
  setShowDropdown,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <label htmlFor="search-dropdown" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Blood Group</label>
            <button
              id="dropdown-button"
              data-dropdown-toggle="dropdown"
              className="w-full shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {searchBloodGroup || "All Blood Groups"}
              <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>
            {showDropdown && (
              <div id="dropdown" className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-full dark:bg-gray-700 mt-1">
                <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-button">
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup(""); setShowDropdown(false); }}
                    >
                      All Blood Groups
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("A+"); setShowDropdown(false); }}
                    >
                      A+
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("A-"); setShowDropdown(false); }}
                    >
                      A-
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("B+"); setShowDropdown(false); }}
                    >
                      B+
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("B-"); setShowDropdown(false); }}
                    >
                      B-
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("AB+"); setShowDropdown(false); }}
                    >
                      AB+
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("AB-"); setShowDropdown(false); }}
                    >
                      AB-
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("O+"); setShowDropdown(false); }}
                    >
                      O+
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => { setSearchBloodGroup("O-"); setShowDropdown(false); }}
                    >
                      O-
                    </button>
                  </li>
                </ul>
              </div>
            )}
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
          <div className="relative">
            <input
              type="search"
              id="search-place"
              className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
              placeholder="Search by place (address, district, state)..."
              value={searchPlace}
              onChange={(e) => setSearchPlace(e.target.value)}
            />
            <button
              type="button"
              className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={onClear}
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
              <span className="sr-only">Clear</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DonorSearchForm;
