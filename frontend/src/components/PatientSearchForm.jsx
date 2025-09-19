import React from 'react';

const PatientSearchForm = ({
  searchPatientName,
  setSearchPatientName,
  searchPatientBloodGroup,
  setSearchPatientBloodGroup,
  searchPatientUnits,
  setSearchPatientUnits,
  searchPatientDate,
  setSearchPatientDate,
  searchPatientMRID,
  setSearchPatientMRID,
  showDropdown,
  setShowDropdown,
  onClear
}) => {
  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
      <form className="max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchPatientName}
            onChange={(e) => setSearchPatientName(e.target.value)}
            className="flex-1 p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Search by MRID..."
            value={searchPatientMRID}
            onChange={(e) => setSearchPatientMRID(e.target.value)}
            className="flex-1 p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
          />
          <label htmlFor="blood-group-dropdown" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Blood Group</label>
          <button
            id="blood-group-dropdown-button"
            data-dropdown-toggle="dropdown"
            className="shrink-0 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {searchPatientBloodGroup || "All Blood Groups"}
            <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
            </svg>
          </button>
          {showDropdown && (
            <div id="blood-group-dropdown" className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 mt-10">
              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="blood-group-dropdown-button">
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup(""); setShowDropdown(false); }}
                  >
                    All Blood Groups
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("A+"); setShowDropdown(false); }}
                  >
                    A+
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("A-"); setShowDropdown(false); }}
                  >
                    A-
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("B+"); setShowDropdown(false); }}
                  >
                    B+
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("B-"); setShowDropdown(false); }}
                  >
                    B-
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("AB+"); setShowDropdown(false); }}
                  >
                    AB+
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("AB-"); setShowDropdown(false); }}
                  >
                    AB-
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("O+"); setShowDropdown(false); }}
                  >
                    O+
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => { setSearchPatientBloodGroup("O-"); setShowDropdown(false); }}
                  >
                    O-
                  </button>
                </li>
              </ul>
            </div>
          )}
          <input
            type="number"
            placeholder="Units required..."
            value={searchPatientUnits}
            onChange={(e) => setSearchPatientUnits(e.target.value)}
            className="flex-1 p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
          />
          <input
            type="date"
            value={searchPatientDate}
            onChange={(e) => setSearchPatientDate(e.target.value)}
            className="flex-1 p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500"
          />
          <button
            type="button"
            onClick={onClear}
            className="p-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
            <span className="sr-only">Clear</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientSearchForm;
