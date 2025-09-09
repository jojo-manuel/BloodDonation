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
  name: z.string().min(3).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string().min(1),
  contactNumber: z.string().regex(/^[0-9]{10}$/),
  emergencyContactNumber: z.string().regex(/^[0-9]{10}$/),
  houseAddress: z.object({
    houseName: z.string().min(1).max(100),
    houseAddress: z.string().min(3).max(200),
    localBody: z.string().min(3).max(100),
    city: z.string().min(3).max(50),
    district: z.string().min(3).max(50),
    pincode: z.string().regex(/^[0-9]{6}$/),
  }),
  workAddress: z.string().min(3).max(200),
  availability: z.boolean(),
  lastDonatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  contactPreference: z.enum(['phone','email','any']).default('any'),
  phone: z.string().min(5).max(20).optional(),
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






