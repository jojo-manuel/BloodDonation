import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api, { getAddressByPostalCode, getAddressFromPincodeAPI } from "../lib/api";

// Allowed values and regex patterns for client-side validation
const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const NAME_REGEX = /^[A-Za-z ]+$/;
const PHONE_IN_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;
const CITY_DISTRICT_REGEX = /^[A-Za-z ]+$/;
const ALNUM_SPACE_ADDR_REGEX = /^[A-Za-z0-9 ,.\-]+$/;

function Navbar({ isDark, toggleTheme }) {
  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
      <Link to="" className="flex items-center gap-3">
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

export default function DonorRegister() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isDonor, setIsDonor] = useState(true);
  const [isAlreadyDonor, setIsAlreadyDonor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
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
    state: "",
    postalCode: "",
    pincode: "",
    workAddress: "",
    weight: "",
    availability: "available",
    lastDonationDate: "",
    contactPreference: "phone",
  });

  const toggleTheme = () => setIsDark((v) => !v);

  useEffect(() => {
    const fetchUserAndDonorData = async () => {
      try {
        // Fetch user data
        try {
          const { data: userData } = await api.get("/users/me");
          if (userData.success) {
            setFormData((prev) => {
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
            throw new Error("Failed to fetch user profile data");
          }
        } catch (userError) {
          console.error("Error fetching user data:", userError);
          if (userError.response?.status === 401) {
            setErrors(["Authentication failed. Please log in again."]);
          } else if (userError.response?.status === 403) {
            setErrors(["Access denied. You do not have permission to access this resource."]);
          } else if (userError.response?.status >= 500) {
            setErrors(["Server error occurred while fetching user data. Please try again later."]);
          } else {
            setErrors(["Failed to load user profile. Please refresh the page and try again."]);
          }
          return;
        }

        // Fetch existing donor data if available
        try {
          const { data: donorData } = await api.get("/donors/me");
          if (donorData.success) {
            setIsAlreadyDonor(true);
            const donor = donorData.data;
            setFormData((prev) => {
              const fullName = donor.name || "";
              const [firstName, ...lastNameParts] = fullName.split(" ");
              const lastName = lastNameParts.join(" ");
              return {
                ...prev,
                firstName,
                lastName,
                dob: donor.dob ? donor.dob.split("T")[0] : prev.dob,
                gender: donor.gender || prev.gender,
                bloodGroup: donor.bloodGroup || prev.bloodGroup,
                contactNumber: donor.contactNumber || prev.contactNumber,
                emergencyContactNumber: donor.emergencyContactNumber || prev.emergencyContactNumber,
                houseName: donor.houseAddress?.houseName || prev.houseName,
                houseAddress: donor.houseAddress?.houseAddress || prev.houseAddress,
                localBody: donor.houseAddress?.localBody || prev.localBody,
                city: donor.houseAddress?.city || prev.city,
                district: donor.houseAddress?.district || prev.district,
                postalCode: donor.houseAddress?.postalCode || prev.postalCode,
                pincode: donor.houseAddress?.pincode || prev.pincode,
                workAddress: donor.workAddress || prev.workAddress,
                weight: donor.weight || prev.weight,
                availability: donor.availability ? "available" : "unavailable",
                lastDonationDate: donor.lastDonatedDate ? donor.lastDonatedDate.split("T")[0] : prev.lastDonationDate,
                contactPreference: donor.contactPreference || prev.contactPreference,
              };
            });
          } else {
            throw new Error("Failed to fetch donor profile data");
          }
        } catch (donorError) {
          if (donorError.response?.status !== 404) {
            console.error("Error fetching donor data:", donorError);
            if (donorError.response?.status === 401) {
              setErrors(["Authentication failed while fetching donor data. Please log in again."]);
            } else if (donorError.response?.status === 403) {
              setErrors(["Access denied. You do not have permission to access this resource."]);
            } else if (donorError.response?.status >= 500) {
              setErrors(["Server error occurred while fetching donor data. Please try again later."]);
            } else {
              setErrors(["Failed to load donor profile. Please refresh the page and try again."]);
            }
          }
          setIsAlreadyDonor(false);
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserAndDonorData:", error);
        setErrors(["An unexpected error occurred while loading your data. Please refresh the page and try again."]);
      }
    };
    fetchUserAndDonorData();
  }, []);

  const validateForm = () => {
    const errors = [];

    if (!BLOOD_GROUPS.includes(formData.bloodGroup)) {
      errors.push("Invalid blood group. Allowed: " + BLOOD_GROUPS.join(", "));
    }

    if (!NAME_REGEX.test((formData.firstName || "").trim())) {
      errors.push("First name must contain only letters and spaces");
    }
    if (!NAME_REGEX.test((formData.lastName || "").trim())) {
      errors.push("Last name must contain only letters and spaces");
    }

    if (!PHONE_IN_REGEX.test(formData.contactNumber)) {
      errors.push("Contact number must be a valid Indian number (10 digits, starts with 6-9)");
    }
    if (!PHONE_IN_REGEX.test(formData.emergencyContactNumber)) {
      errors.push("Emergency contact must be a valid Indian number (10 digits, starts with 6-9)");
    }
    if (formData.contactNumber === formData.emergencyContactNumber) {
      errors.push("Emergency contact cannot be the same as contact number");
    }


    if (!PINCODE_REGEX.test(formData.pincode)) {
      errors.push("Pincode must be exactly 6 digits");
    }

    if (!CITY_DISTRICT_REGEX.test((formData.city || "").trim())) {
      errors.push("City must contain only letters and spaces");
    }
    if (!CITY_DISTRICT_REGEX.test((formData.district || "").trim())) {
      errors.push("District must contain only letters and spaces");
    }

    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.houseName || "").trim())) {
      errors.push("House name must contain only letters, numbers, spaces or , . -");
    }
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.workAddress || "").trim())) {
      errors.push("Work address must contain only letters, numbers, spaces or , . -");
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "dob",
      "gender",
      "bloodGroup",
      "contactNumber",
      "emergencyContactNumber",
      "houseName",
      "pincode",
      "workAddress",
      "weight",
    ];
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    });

    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() === "") {
        errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} cannot be empty or only spaces`);
      }
    });

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

    if (formData.lastDonationDate) {
      const lastDate = new Date(formData.lastDonationDate);
      const today = new Date();
      if (lastDate > today) {
        errors.push("Last donation date cannot be in the future");
      }
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const eighteenthBirthday = new Date(dobDate);
        eighteenthBirthday.setFullYear(dobDate.getFullYear() + 18);
        if (lastDate < eighteenthBirthday) {
          errors.push("Last donation date cannot be before your 18th birthday");
        }
      }
    }

    if (formData.weight) {
      const weightNum = Number(formData.weight);
      if (isNaN(weightNum) || weightNum <= 55 || weightNum >= 140) {
        errors.push("Weight must be between 56kg and 139kg");
      }
    }

    return errors;
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your donor profile? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      const res = await api.delete("/donors/delete", config);

      if (res?.data?.success) {
        alert("✅ Donor profile deleted successfully");
        setIsAlreadyDonor(false);
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
          postalCode: "",
          pincode: "",
          workAddress: "",
          weight: "",
          availability: "available",
          lastDonationDate: "",
          contactPreference: "phone",
        });
        navigate("/dashboard");
      } else {
        alert("❌ " + (res?.data?.message || "Failed to delete donor profile"));
      }
    } catch (err) {
      let msg = err?.response?.data?.message || "Failed to delete donor profile";
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map((e) => e.message).join("\n");
      }
      alert("❌ " + msg);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return dateStr;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [dd, mm, yyyy] = dateStr.split("-");
      return `${yyyy}-${mm}-${dd}`.replace(/\n/g, "");
    }
    return dateStr.replace(/\n/g, "");
  };

  const getFullName = () => {
    return `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
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
          const token = localStorage.getItem("accessToken");
          const config = {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
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
              postalCode: formData.postalCode,
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
            res = await api.put("/donors/update", payload, config);
          } else {
            res = await api.post("/donors/register", payload, config);
          }

          const successMsg = isAlreadyDonor ? "✅ Donor details updated" : "✅ Donor details saved";
          const errorMsg = isAlreadyDonor ? "Failed to update donor details" : "Failed to save donor details";

          if (res?.data?.success) {
            alert(successMsg);
            navigate("/donor-crud");
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
              if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                errorMessages = err.response.data.errors.map((e) => e.message || e);
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
    if (name === "firstName" || name === "lastName") {
      processedValue = inputValue.replace(/[^a-zA-Z\s]/g, "");
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1).toLowerCase();
    }
    if (name === "district" || name === "city" || name === "state") {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1).toLowerCase();
    }
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: processedValue,
    }));
  };

  const handlePincodeBlur = async () => {
    const pincode = formData.pincode;
    if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setAddressLoading(true);
      try {
        const response = await getAddressFromPincodeAPI(pincode);
        if (response && response.length > 0 && response[0].PostOffice && response[0].PostOffice.length > 0) {
          const postOffice = response[0].PostOffice[0];
          setFormData((prev) => ({
            ...prev,
            city: postOffice.Name || prev.city,
            district: postOffice.District || prev.district,
            state: postOffice.StateName || prev.state,
          }));
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        setAddressLoading(false);
      }
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
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {isDonor ? "🩸 Become a Blood Donor" : "🏥 User Registration"}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base">
            {isDonor ? "Join our heroes saving lives every day" : "Register to request blood when needed"}
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center mb-2">
              <span className="text-red-600 dark:text-red-400 text-lg mr-2">⚠️</span>
              <h3 className="text-red-800 dark:text-red-200 font-semibold">Please fix the following errors:</h3>
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
            <div className="flex gap-2">
              <input
                type="tel"
                name="contactNumber"
                placeholder="Contact Number"
                className="flex-1 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency Contact Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                name="emergencyContactNumber"
                placeholder="Emergency Contact Number"
                className="flex-1 rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                required
              />
            </div>
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
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">State</label>
            <input
              type="text"
              name="state"
              placeholder="State"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.state}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Pincode</label>
            <input
              type="text"
              name="pincode"
              placeholder="Pincode (6 digits)"
              pattern="[0-9]{6}"
              maxLength="6"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handlePincodeBlur}
              required
              title="Pincode must be exactly 6 digits"
            />
            {formData.pincode && !/^[0-9]{6}$/.test(formData.pincode) && (
              <p className="mt-1 text-xs text-red-500">⚠️ Pincode must be exactly 6 digits</p>
            )}
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Weight (in kg)</label>
            <input
              type="number"
              name="weight"
              placeholder="Weight"
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
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last Donation Date (Optional)</label>
            <input
              type="date"
              name="lastDonationDate"
              className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300"
              value={formData.lastDonationDate}
              onChange={handleChange}
              min={formData.dob ? (() => {
                const dobDate = new Date(formData.dob);
                dobDate.setFullYear(dobDate.getFullYear() + 18);
                return dobDate.toISOString().split('T')[0];
              })() : ''}
              max={new Date().toISOString().split('T')[0]}
              title={formData.dob ? "Select a date between when you turned 18 and today" : "Please select date of birth first"}
            />
            {formData.lastDonationDate && formData.dob && (() => {
              const donationDate = new Date(formData.lastDonationDate);
              const dobDate = new Date(formData.dob);
              const today = new Date();
              const age18Date = new Date(dobDate);
              age18Date.setFullYear(age18Date.getFullYear() + 18);
              
              if (donationDate < age18Date) {
                return <p className="mt-1 text-xs text-red-500">⚠️ Donation date must be after you turned 18</p>;
              }
              if (donationDate > today) {
                return <p className="mt-1 text-xs text-red-500">⚠️ Donation date cannot be in the future</p>;
              }
              return null;
            })()}
            {formData.lastDonationDate && !formData.dob && (
              <p className="mt-1 text-xs text-yellow-500">⚠️ Please select your date of birth first</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.dob ? `You turned 18 on ${(() => {
                const dobDate = new Date(formData.dob);
                dobDate.setFullYear(dobDate.getFullYear() + 18);
                return dobDate.toLocaleDateString();
              })()}` : 'Enter date of birth to see when you turned 18'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Preference</label>
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

        <div className="mt-8 flex justify-between">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Submitting..." : (isAlreadyDonor ? "Update Profile" : "Register as Donor")}
          </button>
          {isAlreadyDonor && (
            <button
              type="button"
              onClick={handleDelete}
              className="ml-4 rounded-2xl bg-red-800 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Delete Profile
            </button>
          )}
        </div>
      </form>
    </Layout>
  );
}
