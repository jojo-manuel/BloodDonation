import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import UserAvatar from "../components/UserAvatar";
import api from "../lib/api";

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
const ALNUM_SPACE_ADDR_REGEX = /^[A-Za-z0-9 ,.-]+$/;

function Navbar() {
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
      <UserAvatar />
    </nav>
  );
}

export default function DonorRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isDonor, setIsDonor] = useState(true);
  const [isAlreadyDonor, setIsAlreadyDonor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // State for pincode-based address options
  const [postOfficeOptions, setPostOfficeOptions] = useState([]);
  const [localBodyOptions, setLocalBodyOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

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
    pincode: "",
    workAddress: "",
    weight: "",
    availability: "available",
    lastDonationDate: "",
    contactPreference: "phone",
  });

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

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
          // Only show error if 401/403 or 500
          if (userError.response?.status === 401) {
            setErrors(["Authentication failed. Please log in again."]);
          } else if (userError.response?.status >= 500) {
            setErrors(["Server error occurred while fetching user data."]);
          }
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
                state: donor.houseAddress?.state || prev.state,
                pincode: donor.houseAddress?.pincode || prev.pincode,
                workAddress: donor.workAddress || prev.workAddress,
                weight: donor.weight || prev.weight,
                availability: donor.availability ? "available" : "unavailable",
                lastDonationDate: donor.lastDonatedDate ? donor.lastDonatedDate.split("T")[0] : prev.lastDonationDate,
                contactPreference: donor.contactPreference || prev.contactPreference,
              };
            });
            // Auto populate address options for existing pincode using Backend Proxy
            if (donorData.data.houseAddress?.pincode) {
              const pin = donorData.data.houseAddress.pincode;
              api.get(`/donors/address/${pin}`).then(({ data: response }) => {
                if (response && response.length > 0 && response[0].Status === 'Success') {
                  const postOffices = response[0].PostOffice;
                  if (postOffices) {
                    setPostOfficeOptions(postOffices);
                    setCityOptions([...new Set(postOffices.map(po => po.Name).filter(Boolean))]);
                    setLocalBodyOptions([...new Set(postOffices.map(po => po.Block || po.Region).filter(Boolean))]);
                  }
                }
              }).catch(console.error);
            }
          }
        } catch (donorError) {
          // 404 is expected for new donors
          if (donorError.response?.status !== 404) {
            console.error("Error fetching donor data:", donorError);
          }
          setIsAlreadyDonor(false);
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserAndDonorData:", error);
      }
    };
    fetchUserAndDonorData();
  }, []);

  const validateStep1 = () => {
    const stepErrors = [];

    if (!NAME_REGEX.test((formData.firstName || "").trim())) stepErrors.push("First name must contain only letters and spaces");
    if (!NAME_REGEX.test((formData.lastName || "").trim())) stepErrors.push("Last name must contain only letters and spaces");
    if (!PHONE_IN_REGEX.test(formData.contactNumber)) stepErrors.push("Contact number must be a valid 10-digit Indian number");
    if (!PHONE_IN_REGEX.test(formData.emergencyContactNumber)) stepErrors.push("Emergency contact must be a valid 10-digit Indian number");
    if (formData.contactNumber === formData.emergencyContactNumber) stepErrors.push("Emergency contact cannot be the same as contact number");
    if (!PINCODE_REGEX.test(formData.pincode)) stepErrors.push("Pincode must be exactly 6 digits");
    if (!BLOOD_GROUPS.includes(formData.bloodGroup)) stepErrors.push("Invalid blood group");

    const requiredFields = ["firstName", "lastName", "dob", "gender", "bloodGroup", "contactNumber", "emergencyContactNumber", "pincode"];
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        stepErrors.push(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
      }
    });

    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) stepErrors.push("Date of birth cannot be in the future");
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      if (age < 18) stepErrors.push("Donor must be at least 18 years old");
    }

    return stepErrors;
  };

  const validateForm = () => {
    const errors = validateStep1();

    // Step 2 Validation
    const requiredStep2 = ["houseName", "houseAddress", "localBody", "city", "district", "state", "workAddress", "weight"];
    requiredStep2.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        errors.push(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
      }
    });

    if (!CITY_DISTRICT_REGEX.test((formData.city || "").trim())) errors.push("City must contain only letters and spaces");
    if (!CITY_DISTRICT_REGEX.test((formData.district || "").trim())) errors.push("District must contain only letters and spaces");
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.houseName || "").trim())) errors.push("House name must valid characters");
    if (!ALNUM_SPACE_ADDR_REGEX.test((formData.workAddress || "").trim())) errors.push("Work address must valid characters");

    if (formData.weight) {
      const weightNum = Number(formData.weight);
      if (isNaN(weightNum) || weightNum <= 55 || weightNum >= 140) {
        errors.push("Weight must be between 56kg and 139kg");
      }
    }

    if (formData.lastDonationDate) {
      const lastDate = new Date(formData.lastDonationDate);
      const today = new Date();
      if (lastDate > today) errors.push("Last donation date cannot be in the future");
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const eighteenthBirthday = new Date(dobDate);
        eighteenthBirthday.setFullYear(dobDate.getFullYear() + 18);
        if (lastDate < eighteenthBirthday) errors.push("Last donation date cannot be before your 18th birthday");
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
      const config = { headers: { Authorization: token ? `Bearer ${token}` : "" } };
      const res = await api.delete("/donors/delete", config);

      if (res?.data?.success) {
        alert("✅ Donor profile deleted successfully");
        setIsAlreadyDonor(false);
        setFormData({
          firstName: "", lastName: "", dob: "", gender: "", bloodGroup: "", contactNumber: "", emergencyContactNumber: "",
          houseName: "", houseAddress: "", localBody: "", city: "", district: "", state: "", pincode: "",
          workAddress: "", weight: "", availability: "available", lastDonationDate: "", contactPreference: "phone",
        });
        navigate("/dashboard");
      } else {
        alert("❌ " + (res?.data?.message || "Failed to delete donor profile"));
      }
    } catch (err) {
      alert("❌ " + (err?.response?.data?.message || "Failed to delete donor profile"));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return dateStr;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    return dateStr;
  };

  const getFullName = () => `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const config = { headers: { Authorization: token ? `Bearer ${token}` : "" } };
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
          state: formData.state,
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

      if (res?.data?.success) {
        alert(isAlreadyDonor ? "✅ Donor details updated" : "✅ Donor details saved");

        if (window.location.port === '3000') {
          window.location.href = "http://localhost:3002/dashboard";
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrors([res?.data?.message || "Failed to save donor details"]);
      }
    } catch (err) {
      console.error(err);
      setErrors([err?.response?.data?.message || "An error occurred while saving."]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value: inputValue } = e.target;
    let processedValue = inputValue;

    if (name === "pincode") {
      processedValue = inputValue.replace(/[^0-9]/g, "").slice(0, 6);
      if (processedValue !== formData.pincode) {
        setPostOfficeOptions([]);
        setLocalBodyOptions([]);
        setCityOptions([]);
      }
    }
    if (name === "firstName" || name === "lastName") {
      processedValue = inputValue.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData((prevFormData) => ({ ...prevFormData, [name]: processedValue }));
  };

  const handlePincodeBlur = async () => {
    const pincode = formData.pincode;
    if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setAddressLoading(true);
      setPostOfficeOptions([]);
      setLocalBodyOptions([]);
      setCityOptions([]);
      try {
        // Use Backend Proxy instead of direct external call for reliability
        const { data: response } = await api.get(`/donors/address/${pincode}`);
        if (response && response.length > 0 && response[0].Status === 'Success') {
          const postOffices = response[0].PostOffice;
          if (postOffices) {
            setPostOfficeOptions(postOffices);
            const uniqueCities = [...new Set(postOffices.map(po => po.Name).filter(Boolean))];
            const uniqueLocalBodies = [...new Set(postOffices.map(po => po.Block || po.Region).filter(Boolean))];
            setCityOptions(uniqueCities);
            setLocalBodyOptions(uniqueLocalBodies);
            const district = postOffices[0].District || "";
            const state = postOffices[0].State || postOffices[0].StateName || "";

            setFormData((prev) => ({
              ...prev,
              district: district,
              state: state,
            }));
          }
        } else {
          console.error("Invalid pincode or API error (Backend Proxy)");
        }
      } catch (error) {
        console.error("Error fetching address via proxy:", error);
      } finally {
        setAddressLoading(false);
      }
    }
  };

  const handleNext = () => {
    const stepErrors = validateStep1();
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors([]);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-white/30 bg-white/30 p-6 shadow-2xl backdrop-blur-2xl transition dark:border-white/10 dark:bg-white/5 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent"
      >
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {isDonor ? "🩸 Become a Blood Donor" : "🏥 User Registration"}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 md:text-base mb-4">
            {isDonor ? "Join our heroes saving lives every day" : "Register to request blood when needed"}
          </p>

          <div className="flex justify-center items-center gap-2 mb-2">
            <div className={`h-2 w-1/3 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gray-200/20'}`} />
            <div className={`h-2 w-1/3 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gray-200/20'}`} />
          </div>
          <p className="text-xs font-semibold text-rose-300 uppercase tracking-widest">
            {step === 1 ? "Step 1: Personal Details" : "Step 2: Address & Info"}
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

        <div className={step === 1 ? "block animate-fadeIn" : "hidden"}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">First Name</label>
              <input type="text" name="firstName" placeholder="First Name" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.firstName} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Last Name</label>
              <input type="text" name="lastName" placeholder="Last Name" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.lastName} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Date of Birth</label>
              <input type="date" name="dob" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.dob} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Gender</label>
              <select name="gender" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white" value={formData.gender} onChange={handleChange} required>
                <option value="" className="text-gray-800">Select Gender</option>
                <option value="Male" className="text-gray-800">Male</option>
                <option value="Female" className="text-gray-800">Female</option>
                <option value="Other" className="text-gray-800">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Blood group</label>
              <select name="bloodGroup" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white" value={formData.bloodGroup} onChange={handleChange} required>
                <option value="" className="text-gray-800">Select Blood Group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg} className="text-gray-800">{bg}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Contact Number</label>
              <input type="tel" name="contactNumber" placeholder="10-digit Mobile Number" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.contactNumber} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">Emergency Contact</label>
              <input type="tel" name="emergencyContactNumber" placeholder="Emergency Mobile Number" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.emergencyContactNumber} onChange={handleChange} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Pincode <span className="text-xs text-rose-300">(Auto-fills Address)</span>
                {addressLoading && <span className="ml-2 text-xs text-rose-400 animate-pulse">Checking...</span>}
              </label>
              <input type="text" name="pincode" placeholder="Enter 6-digit Pincode" maxLength="6" className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-gray-900 placeholder-gray-600 shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-gray-300" value={formData.pincode} onChange={handleChange} onBlur={handlePincodeBlur} required />
              {postOfficeOptions.length > 0 && (
                <p className="mt-1 text-xs text-green-400">✅ Found {postOfficeOptions.length} area(s). Address will appear in Step 2.</p>
              )}
            </div>
          </div>
        </div>

        <div className={step === 2 ? "block animate-fadeIn" : "hidden"}>
          <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-5">
            <h4 className="mb-4 text-lg font-bold text-gray-100 border-b border-white/10 pb-2">📍 Address Details</h4>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">House Name</label>
                <input type="text" name="houseName" value={formData.houseName} onChange={handleChange} required className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-rose-500" placeholder="House Name / Number" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">House Address</label>
                <input type="text" name="houseAddress" value={formData.houseAddress} onChange={handleChange} required className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-rose-500" placeholder="Street / Road" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">Local Body</label>
                {localBodyOptions.length > 1 ? (
                  <select name="localBody" value={formData.localBody} onChange={handleChange} className="w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-rose-500"><option value="">Select Local Body</option>{localBodyOptions.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}</select>
                ) : (
                  <input type="text" name="localBody" value={formData.localBody} onChange={handleChange} className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-rose-500" />
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">City / Area</label>
                {cityOptions.length > 1 ? (
                  <select name="city" value={formData.city} onChange={handleChange} required className="w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-rose-500"><option value="">Select City/Area</option>{cityOptions.map(c => <option key={c} value={c} className="text-gray-800">{c}</option>)}</select>
                ) : (
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-rose-500" />
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">District {postOfficeOptions.length > 0 && '✅'}</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} readOnly={postOfficeOptions.length > 0 && !!formData.district} required className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-rose-500 ${postOfficeOptions.length > 0 && formData.district ? 'opacity-75' : ''}`} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">State {postOfficeOptions.length > 0 && '✅'}</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} readOnly={postOfficeOptions.length > 0 && !!formData.state} required className={`w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-rose-500 ${postOfficeOptions.length > 0 && formData.state ? 'opacity-75' : ''}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-medium text-gray-200">Work Address</label><input type="text" name="workAddress" value={formData.workAddress} onChange={handleChange} required className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10" placeholder="Office / Workplace" /></div>
            <div><label className="mb-2 block text-sm font-medium text-gray-200">Weight (kg)</label><input type="number" name="weight" value={formData.weight} onChange={handleChange} required className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10" placeholder="Weight" /></div>
            <div><label className="mb-2 block text-sm font-medium text-gray-200">Availability</label><select name="availability" value={formData.availability} onChange={handleChange} className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10"><option value="available" className="text-gray-800">Available</option><option value="unavailable" className="text-gray-800">Unavailable</option></select></div>
            <div><label className="mb-2 block text-sm font-medium text-gray-200">Last Donation (Optional)</label><input type="date" name="lastDonationDate" value={formData.lastDonationDate} onChange={handleChange} className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10" /></div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-200">Contact Preference</label>
              <select name="contactPreference" value={formData.contactPreference} onChange={handleChange} className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-white shadow-inner outline-none backdrop-blur-md focus:ring-2 focus:ring-rose-400/60 dark:border-white/10 dark:bg-white/10"><option value="phone" className="text-gray-800">Phone</option><option value="email" className="text-gray-800">Email</option></select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-4">
          {step === 1 ? (
            <button type="button" onClick={handleNext} className="w-full rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl">Next Step ➡️</button>
          ) : (
            <>
              <button type="button" onClick={handleBack} className="w-1/3 rounded-2xl bg-gray-600 px-6 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl">⬅️ Back</button>
              <button type="submit" disabled={loading} className="w-2/3 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:opacity-50">{loading ? "Submitting..." : (isAlreadyDonor ? "Update Profile" : "Register as Donor")}</button>
            </>
          )}
        </div>

        {step === 2 && isAlreadyDonor && (
          <button type="button" onClick={handleDelete} className="mt-4 w-full text-center text-sm text-red-400 hover:text-red-300 underline">Delete Profile</button>
        )}
      </form>
    </Layout>
  );
}
