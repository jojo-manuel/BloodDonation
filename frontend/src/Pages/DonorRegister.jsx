// Pages/DonorRegister.jsx
// Donor profile form for authenticated users; submits to /donors/register.

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          <span className="text-xl" role="img" aria-label="Blood drop">🩸</span>
        </div>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent dark:from-rose-300 dark:to-amber-200">Blood Donation</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">Connect. Donate. Save lives.</p>
        </div>
      </Link>
      <button
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm backdrop-blur-md transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        aria-label="Toggle dark mode"
      >
        <span className="h-4 w-4" aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
        <span>{isDark ? "Dark" : "Light"} mode</span>
      </button>
    </nav>
  );
}

import Layout from "../components/Layout";

// Allowed values and regex patterns for client-side validation
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const NAME_REGEX = /^[A-Za-z\s]*$/;                               // letters and spaces only
const CITY_DISTRICT_REGEX = /^[A-Za-z\s]{2,50}$/;                 // letters and spaces
const ALNUM_SPACE_ADDR_REGEX = /^[A-Za-z0-9\s.,-]{3,200}$/;       // letters/numbers/spaces with , . -
const PHONE_IN_REGEX = /^[6-9]\d{9}$/;                            // Indian 10-digit starting 6-9
const PINCODE_REGEX = /^\d{6}$/;

export default function DonorRegister() {
  const navigate = useNavigate();
  const [isDonor, setIsDonor] = React.useState(true);
  const [isAlreadyDonor, setIsAlreadyDonor] = React.useState(false);
  const [errors, setErrors] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    contactNumber: "",
    emergencyContactNumber: "",
    houseName: "",
    houseAddress: "",
    localBody: "",
    city: "",
    district: "",
    pincode: "",
    workAddress: "",
    weight: "",
    availability: "available",
    lastDonationDate: "",
    contactPreference: "phone",
  });

  useEffect(() => {
    const fetchUserAndDonorData = async () => {
      try {
        // Fetch user data
        try {
          const { data: userData } = await api.get('/users/me');
          if (userData.success) {
            setFormData(prev => {
              const fullName = userData.data.name || "";
              const [firstName, ...lastNameParts] = fullName.split(" ");
              const lastName = lastNameParts.join(" ");
              return {
                ...prev,
                firstName,
                lastName,
                contactNumber: userData.data.phone || "",
              };
            });
          } else {
            throw new Error('Failed to fetch user profile data');
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          if (userError.response?.status === 401) {
            setErrors(['Authentication failed. Please log in again.']);
          } else if (userError.response?.status === 403) {
            setErrors(['Access denied. You do not have permission to access this resource.']);
          } else if (userError.response?.status >= 500) {
            setErrors(['Server error occurred while fetching user data. Please try again later.']);
          } else {
            setErrors(['Failed to load user profile. Please refresh the page and try again.']);
          }
          return;
        }

        // Fetch existing donor data if available
        try {
          const { data: donorData } = await api.get('/donors/me');
          if (donorData.success) {
            setIsAlreadyDonor(true);
            // Populate form with existing donor data
            const donor = donorData.data;
            setFormData(prev => {
              const fullName = donor.name || "";
              const [firstName, ...lastNameParts] = fullName.split(" ");
              const lastName = lastNameParts.join(" ");
              return {
                ...prev,
                firstName,
                lastName,
                dob: donor.dob ? donor.dob.split('T')[0] : prev.dob,
                gender: donor.gender || prev.gender,
                bloodGroup: donor.bloodGroup || prev.bloodGroup,
                contactNumber: donor.contactNumber || prev.contactNumber,
                emergencyContactNumber: donor.emergencyContactNumber || prev.emergencyContactNumber,
                houseName: donor.houseAddress?.houseName || prev.houseName,
                houseAddress: donor.houseAddress?.houseAddress || prev.houseAddress,
                localBody: donor.houseAddress?.localBody || prev.localBody,
                city: donor.houseAddress?.city || prev.city,
                district: donor.houseAddress?.district || prev.district,
                pincode: donor.houseAddress?.pincode || prev.pincode,
                workAddress: donor.workAddress || prev.workAddress,
                weight: donor.weight || prev.weight,
                availability: donor.availability ? "available" : "unavailable",
                lastDonationDate: donor.lastDonatedDate ? donor.lastDonatedDate.split('T')[0] : prev.lastDonationDate,
                contactPreference: donor.contactPreference || prev.contactPreference,
              };
            });
          } else {
            throw new Error('Failed to fetch donor profile data');
          }
        } catch (donorError) {
          // User is not a donor, which is fine - don't show error for this
          if (donorError.response?.status !== 404) {
            console.error('Error fetching donor data:', donorError);
            if (donorError.response?.status === 401) {
              setErrors(['Authentication failed while fetching donor data. Please log in again.']);
            } else if (donorError.response?.status === 403) {
              setErrors(['Access denied while fetching donor data.']);
            } else if (donorError.response?.status >= 500) {
              setErrors(['Server error occurred while fetching donor data. Please try again later.']);
            } else {
              setErrors(['Failed to load donor profile. Please refresh the page and try again.']);
            }
          }
          setIsAlreadyDonor(false);
        }
      } catch (error) {
        console.error('Unexpected error in fetchUserAndDonorData:', error);
        setErrors(['An unexpected error occurred while loading your data. Please refresh the page and try again.']);
      }
    };
    fetchUserAndDonorData();
  }, []);

  const validateForm = () => {
    const errors = [];

    // Blood group whitelist
    if (!BLOOD_GROUPS.includes(formData.bloodGroup)) {
      errors.push("Invalid blood group. Allowed: " + BLOOD_GROUPS.join(", "));
    }

    // First and last name: only letters/spaces
    if (!NAME_REGEX.test((formData.firstName || "").trim())) {
      errors.push("First name must contain only letters and spaces");
    }
    if (!NAME_REGEX.test((formData.lastName || "").trim())) {
      errors.push("Last name must contain only letters and spaces");
    }

    // Phone numbers: Indian range (10 digits starting with 6-9)
    if (!PHONE_IN_REGEX.test(formData.contactNumber)) {
      errors.push("Contact number must be a valid Indian number (10 digits, starts with 6-9)");
    }
    if (!PHONE_IN_REGEX.test(formData.emergencyContactNumber)) {
      errors.push("Emergency contact must be a valid Indian number (10 digits, starts with 6-9)");
    }
    if (formData.contactNumber === formData.emergencyContactNumber) {
      errors.push("Emergency contact cannot be the same as contact number");
    }

    // Pincode validation (6 digits)
    if (!PINCODE_REGEX.test(formData.pincode)) {
      errors.push("Pincode must be exactly 6 digits");
    }

    // City/District: names only
    if (!CITY_DISTRICT_REGEX.test((formData.city || "").trim())) {
      errors.push("City must contain only letters and spaces");
    }
    if (!CITY_DISTRICT_REGEX.test((formData.district || "").trim())) {
      errors.push("District must contain only letters and spaces");
    }

    // House and work address fields: alnum + , . - allowed
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.houseName || "").trim())) {
      errors.push("House name must contain only letters, numbers, spaces or , . -");
    }
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.houseAddress || "").trim())) {
      errors.push("House address must contain only letters, numbers, spaces or , . -");
    }
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.localBody || "").trim())) {
      errors.push("Local body must contain only letters, numbers, spaces or , . -");
    }
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.workAddress || "").trim())) {
      errors.push("Work address must contain only letters, numbers, spaces or , . -");
    }

    // Required fields
    const requiredFields = ['firstName', 'lastName', 'dob', 'gender', 'bloodGroup', 'contactNumber', 'emergencyContactNumber', 'houseName', 'houseAddress', 'localBody', 'city', 'district', 'pincode', 'workAddress', 'weight'];
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    });

    // Validate no fields with only spaces
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() === '') {
        errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} cannot be empty or only spaces`);
      }
    });

    // Validate dob: no future date and age >= 18
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        errors.push("Date of birth cannot be in the future");
      }
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.push("Donor must be at least 18 years old");
      }
    }

    // Validate lastDonationDate: any date after donor reached 18 years of age
    if (formData.lastDonationDate) {
      const lastDate = new Date(formData.lastDonationDate);
      const today = new Date();

      // Check if date is in the future (not allowed)
      if (lastDate > today) {
        errors.push("Last donation date cannot be in the future");
      }

      // If DOB is provided, check that donation date is not before 18th birthday
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const eighteenthBirthday = new Date(dobDate);
        eighteenthBirthday.setFullYear(dobDate.getFullYear() + 18);

        if (lastDate < eighteenthBirthday) {
          errors.push("Last donation date cannot be before your 18th birthday");
        }
      }
    }

    // Validate weight > 55kg and < 140kg
    if (formData.weight) {
      const weightNum = Number(formData.weight);
      if (isNaN(weightNum) || weightNum <= 55 || weightNum >= 140) {
        errors.push("Weight must be between 56kg and 139kg");
      }
    }

    return errors;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return dateStr;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [dd, mm, yyyy] = dateStr.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }
    return dateStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        try {
          // Add token from localStorage to Authorization header
          const token = localStorage.getItem('accessToken');
          const config = {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          };
          const payload = {
            name: getFullName(),
            dob: formatDate(formData.dob),
            gender: formData.gender,
            bloodGroup: formData.bloodGroup,
            contactNumber: formData.contactNumber,
            emergencyContactNumber: formData.emergencyContactNumber,
            houseAddress: {
              houseName: formData.houseName,
              houseAddress: formData.houseAddress,
              localBody: formData.localBody,
              city: formData.city,
              district: formData.district,
              pincode: formData.pincode,
            },
            workAddress: formData.workAddress,
            weight: parseFloat(formData.weight),
            availability: formData.availability === "available",
            contactPreference: formData.contactPreference,
            ...(formData.lastDonationDate && { lastDonatedDate: formatDate(formData.lastDonationDate) }),
          };

          let res;
          if (isAlreadyDonor) {
            // Update existing donor profile
            res = await api.put("/donors/update", payload, config);
          } else {
            // Register new donor profile
            res = await api.post("/donors/register", payload, config);
          }

          const successMsg = isAlreadyDonor ? "✅ Donor details updated" : "✅ Donor details saved";
          const errorMsg = isAlreadyDonor ? "Failed to update donor details" : "Failed to save donor details";

          if (res?.data?.success) {
            alert(successMsg);
            // Redirect to donor CRUD page after successful registration/update
            navigate('/donor-crud');
            break;
          } else {
            setErrors([res?.data?.message || errorMsg]);
            break;
          }
        } catch (err) {
          attempt++;
          if (attempt >= maxAttempts) {
            let errorMessages = [];

            if (err?.response?.status === 400) {
              // Validation errors
              if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                errorMessages = err.response.data.errors.map(e => e.message || e);
              } else {
                errorMessages = [err.response.data.message || "Invalid data provided. Please check your input."];
              }
            } else if (err?.response?.status === 401) {
              errorMessages = ["Authentication failed. Please log in again."];
            } else if (err?.response?.status === 403) {
              errorMessages = ["Access denied. You do not have permission to perform this action."];
            } else if (err?.response?.status === 409) {
              errorMessages = ["A donor profile already exists for this user."];
            } else if (err?.response?.status === 422) {
              errorMessages = ["Data validation failed. Please check all required fields."];
            } else if (err?.response?.status >= 500) {
              errorMessages = ["Server error occurred. Please try again later."];
            } else if (!err?.response) {
              errorMessages = ["Network error. Please check your internet connection and try again."];
            } else {
              const errorMsg = isAlreadyDonor ? "Failed to update donor details" : "Failed to save donor details";
              errorMessages = [err?.response?.data?.message || errorMsg];
            }

            setErrors(errorMessages);
            break;
          }
        }
      } catch (outerErr) {
        setErrors(["Unexpected error occurred: " + outerErr.message]);
        break;
      }
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value: inputValue } = e.target;
    let processedValue = inputValue;

    if (name === 'firstName' || name === 'lastName') {
      // Only allow letters and spaces
      processedValue = inputValue.replace(/[^a-zA-Z\s]/g, '');
      // Convert to sentence case: first letter capital, rest lower
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1).toLowerCase();
    }

    if (name === 'district' || name === 'city') {
      // Capitalize first letter for district and city
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1).toLowerCase();
    }

    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: processedValue
    }));
  };

  // Combine firstName and lastName into name for backend
  const getFullName = () => {
    return `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your donor profile? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      };

      const res = await api.delete("/donors/delete", config);

      if (res?.data?.success) {
        alert("✅ Donor profile deleted successfully");
        setIsAlreadyDonor(false);
        // Reset form data
        setFormData({
          firstName: "",
          lastName: "",
          dob: "",
          gender: "",
          bloodGroup: "",
          contactNumber: "",
          emergencyContactNumber: "",
          houseName: "",
          houseAddress: "",
          localBody: "",
          city: "",
          district: "",
          pincode: "",
          workAddress: "",
          weight: "",
          availability: "available",
          lastDonationDate: "",
          contactPreference: "phone",
        });
        navigate('/dashboard');
      } else {
        alert("❌ " + (res?.data?.message || "Failed to delete donor profile"));
      }
    } catch (err) {
      let msg = err?.response?.data?.message || "Failed to delete donor profile";
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map(e => e.message).join("\n");
      }
      alert("❌ " + msg);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => setIsDonor(true)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              isDonor ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {isAlreadyDonor ? "Edit Donor Details" : "Become a Donor"}
          </button>
          <button
            onClick={() => setIsDonor(false)}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              !isDonor ? "bg-pink-600 text-white" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            User Registration
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {isDonor ? "🩸 Become a Blood Donor" : "🏥 User Registration"}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">
            {isDonor ? "Join our heroes saving lives every day" : "Register to request blood when needed"}
          </p>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center mb-2">
              <span className="text-red-600 dark:text-red-400 text-lg mr-2">⚠️</span>
              <h3 className="text-red-800 dark:text-red-200 font-semibold">
                Please fix the following errors:
              </h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              title="Only letters and spaces allowed"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Date of Birth</label>
            <input
              type="date"
              name="dob"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Gender</label>
            <select
              name="gender"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="" className="text-gray-800">Select Gender</option>
              <option value="Male" className="text-gray-800">Male</option>
              <option value="Female" className="text-gray-800">Female</option>
              <option value="Other" className="text-gray-800">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood group</label>
            <select
              name="bloodGroup"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              <option value="" className="text-gray-800">Select Blood Group</option>
              <option value="A+" className="text-gray-800">A+</option>
              <option value="A-" className="text-gray-800">A-</option>
              <option value="B+" className="text-gray-800">B+</option>
              <option value="B-" className="text-gray-800">B-</option>
              <option value="AB+" className="text-gray-800">AB+</option>
              <option value="AB-" className="text-gray-800">AB-</option>
              <option value="O+" className="text-gray-800">O+</option>
              <option value="O-" className="text-gray-800">O-</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency Contact Number</label>
            <input
              type="tel"
              name="emergencyContactNumber"
              placeholder="Emergency Contact Number"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Name</label>
            <input
              type="text"
              name="houseName"
              placeholder="House Name"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.houseName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">House Address</label>
            <input
              type="text"
              name="houseAddress"
              placeholder="House Address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.houseAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Local Body</label>
            <input
              type="text"
              name="localBody"
              placeholder="Local Body"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.localBody}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">City</label>
            <input
              type="text"
              name="city"
              placeholder="City"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">District</label>
            <input
              type="text"
              name="district"
              placeholder="District"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.district}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Pincode</label>
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.pincode}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Work Address</label>
            <input
              type="text"
              name="workAddress"
              placeholder="Work Address"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.workAddress}
              onChange={handleChange}
              required
            />
          </div>

          {isDonor && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="Weight in kg"
                  min="56"
                  max="139"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Availability</label>
                <select
                  name="availability"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  value={formData.availability}
                  onChange={handleChange}
                  required
                >
                  <option value="available" className="text-gray-800">Available</option>
                  <option value="unavailable" className="text-gray-800">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last donation date</label>
                <input
                  type="date"
                  name="lastDonationDate"
                  className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                  value={formData.lastDonationDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact preference</label>
            <select
              name="contactPreference"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
              value={formData.contactPreference}
              onChange={handleChange}
              required
            >
              <option value="phone" className="text-gray-800">Phone</option>
              <option value="email" className="text-gray-800">Email</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              isDonor ? 'Save Donor Details 🩸' : 'Save User Details 🏥'
            )}
          </button>

          {isDonor && isAlreadyDonor && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-red-500/30 active:scale-[0.99]"
            >
              Delete Donor Profile 🗑️
            </button>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">{isDonor ? 'By registering, you agree to donate blood when needed and meet all health requirements.' : 'By registering, you agree to our terms and conditions for blood requests.'}</p>
          <div className="mt-2">
            <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              ← Back to Home
            </Link>
          </div>
        </div>
      </form>
    </Layout>
  );
}
