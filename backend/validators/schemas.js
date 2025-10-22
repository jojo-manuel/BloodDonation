const { z } = require('zod');

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain a special character');

// Registration can be: local by email, local by username, or google oauth
const localByEmail = z.object({
  name: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Name cannot be empty or only spaces").refine(val => {
    const parts = val.trim().split(/\s+/);
    return parts.length === 2 && /^[A-Za-z]+$/.test(parts[0]) && /^[A-Za-z]+$/.test(parts[1]);
  }, "Name must consist of first and last name, each containing only letters without spaces or symbols"),
  email: z.string().email('Invalid email format'),
  password: strongPassword,
  confirmPassword: z.string(),
  role: z.enum(['user','donor','admin']).optional(),
  provider: z.literal('local').default('local'),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const localByUsername = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: strongPassword,
  confirmPassword: z.string(),
  role: z.enum(['user','donor','admin']).optional(),
  provider: z.literal('local').default('local'),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const googleReg = z.object({
  provider: z.literal('google'),
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['user','donor','admin']).optional(),
});

const registerBody = z.union([localByEmail, localByUsername, googleReg]);

const loginBody = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((d) => !!(d.email || d.username), {
  path: ['email'],
  message: 'Email or username is required',
});

const forgotPasswordBody = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(1).optional(),
}).refine((d) => !!(d.email || d.username), {
  path: ['email'],
  message: 'Email or username is required',
});

const resetPasswordBody = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: strongPassword,
});

const firebaseAuthBody = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

const donorRegisterBody = z.object({
  name: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Name cannot be empty or only spaces"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine(val => {
    const dob = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18 && age <= 60 && dob <= today;
  }, "Donor must be between 18 and 60 years old and date of birth cannot be in the future"),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-'], 'Invalid blood group'),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Contact number must be a valid 10-digit Indian number starting with 6-9').refine(val => val.trim().length === 10, "Contact number cannot be empty or only spaces"),
  emergencyContactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Emergency contact must be a valid 10-digit Indian number starting with 6-9').refine(val => val.trim().length === 10, "Emergency contact cannot be empty or only spaces"),
  houseAddress: z.object({
    houseName: z.string().min(1).max(100).refine(val => val.trim().length > 0, "House name cannot be empty or only spaces"),
    houseAddress: z.string().max(200).optional(), // Made optional - will be auto-filled
    localBody: z.string().max(100).optional(), // Made optional - will be auto-filled
    city: z.string().max(50).optional(), // Made optional - will be auto-filled
    district: z.string().max(50).optional(), // Made optional - will be auto-filled
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits').refine(val => val.trim().length === 6, "Pincode cannot be empty or only spaces"),
  }),
  workAddress: z.string().min(3).max(200).refine(val => val.trim().length > 0, "Work address cannot be empty or only spaces"),
  weight: z.number().min(55.1, "Weight must be above 55kg").max(139.999, "Weight must be less than 140kg"),
  availability: z.boolean(),
  lastDonatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine(val => {
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, "Last donation date cannot be in the future").optional(),
  contactPreference: z.enum(['phone','email','any']).default('any'),
  phone: z.string().min(5).max(20).optional(),
}).refine((data) => data.contactNumber !== data.emergencyContactNumber, {
  path: ['emergencyContactNumber'],
  message: 'Emergency contact cannot be same as contact number',
});

const userUpdateBody = z.object({
  name: z.string().min(3).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number').optional(),
  address: z.string().min(3).max(300).optional(),
});

const bloodBankRegisterBody = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: strongPassword,
  name: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Name cannot be empty or only spaces").optional(),
  address: z.string().min(3).max(300).refine(val => val.trim().length > 0, "Address cannot be empty or only spaces").optional(),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Contact number must be a valid 10-digit Indian number').optional(),
  district: z.string().min(3).max(50).refine(val => val.trim().length > 0, "District cannot be empty or only spaces").optional(),
  licenseNumber: z.string().min(5).max(50).refine(val => val.trim().length > 0, "License number cannot be empty or only spaces").optional(),
});

const bloodBankSubmitDetailsBody = z.object({
  name: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Name cannot be empty or only spaces"),
  address: z.string().min(3).max(300).refine(val => val.trim().length > 0, "Address cannot be empty or only spaces"),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Contact number must be a valid 10-digit Indian number'),
  district: z.string().min(3).max(50).refine(val => val.trim().length > 0, "District cannot be empty or only spaces"),
  licenseNumber: z.string().min(5).max(50).refine(val => val.trim().length > 0, "License number cannot be empty or only spaces"),
});

const patientAddBody = z.object({
  patientName: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Patient name cannot be empty or only spaces"),
  address: z.string().min(3).max(300).refine(val => val.trim().length > 0, "Address cannot be empty or only spaces"),
  bloodGroup: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-'], 'Invalid blood group'),
  mrid: z.string().min(1).max(50).refine(val => val.trim().length > 0, "MRID cannot be empty or only spaces"),
  requiredUnits: z.number().int().min(1, 'Required units must be at least 1'),
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine(val => new Date(val) >= new Date(), "Required date cannot be in the past"),
  bloodBankId: z.string().optional(), // For admin use
});

const patientUpdateBody = z.object({
  patientName: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Patient name cannot be empty or only spaces").optional(),
  address: z.string().min(3).max(300).refine(val => val.trim().length > 0, "Address cannot be empty or only spaces").optional(),
  bloodGroup: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-'], 'Invalid blood group').optional(),
  requiredUnits: z.number().int().min(1, 'Required units must be at least 1').optional(),
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine(val => new Date(val) >= new Date(), "Required date cannot be in the past").optional(),
});

const adminRegisterBody = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: strongPassword,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const setStatusBody = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

const requestDonationBody = z.object({
  donorId: z.string().min(1, 'Donor ID is required'),
  message: z.string().max(500, 'Message too long').optional(),
});

const updateAvailabilityBody = z.object({
  availability: z.boolean('Availability must be boolean'),
});

const completeProfileBody = z.object({
  name: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Name cannot be empty or only spaces"),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number'),
});

module.exports = {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody,
  firebaseAuthBody,
  donorRegisterBody,
  userUpdateBody,
  bloodBankRegisterBody,
  bloodBankSubmitDetailsBody,
  patientAddBody,
  patientUpdateBody,
  adminRegisterBody,
  setStatusBody,
  requestDonationBody,
  updateAvailabilityBody,
  completeProfileBody,
};
