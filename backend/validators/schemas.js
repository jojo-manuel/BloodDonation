const { z } = require('zod');

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

// Registration can be: local by email, local by username, or google oauth
const localByEmail = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
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
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['user','donor','admin']).optional(),
});

const registerBody = z.union([localByEmail, localByUsername, googleReg]);

const loginBody = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine((d) => !!(d.email || d.username), {
  path: ['email'],
  message: 'Email or username is required',
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
  bloodGroup: z.string().min(1),
  contactNumber: z.string().regex(/^[0-9]{10}$/).refine(val => val.trim().length === 10, "Contact number cannot be empty or only spaces"),
  emergencyContactNumber: z.string().regex(/^[0-9]{10}$/).refine(val => val.trim().length === 10, "Emergency contact cannot be empty or only spaces"),
  houseAddress: z.object({
    houseName: z.string().min(1).max(100).refine(val => val.trim().length > 0, "House name cannot be empty or only spaces"),
    houseAddress: z.string().min(3).max(200).refine(val => val.trim().length > 0, "House address cannot be empty or only spaces"),
    localBody: z.string().min(3).max(100).refine(val => val.trim().length > 0, "Local body cannot be empty or only spaces"),
    city: z.string().min(3).max(50).refine(val => val.trim().length > 0, "City cannot be empty or only spaces"),
    district: z.string().min(3).max(50).refine(val => val.trim().length > 0, "District cannot be empty or only spaces"),
    pincode: z.string().regex(/^[0-9]{6}$/).refine(val => val.trim().length === 6, "Pincode cannot be empty or only spaces"),
  }),
  workAddress: z.string().min(3).max(200).refine(val => val.trim().length > 0, "Work address cannot be empty or only spaces"),
  weight: z.number().min(55.1, "Weight must be above 55kg"),
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
  phone: z.string().min(5).max(20).optional(),
  address: z.string().min(3).max(300).optional(),
});

module.exports = {
  registerBody,
  loginBody,
  donorRegisterBody,
  userUpdateBody,
};






