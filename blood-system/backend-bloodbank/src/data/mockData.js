const bcrypt = require('bcryptjs');

// Shared mock data store
const mockData = {
  users: [
    {
      _id: '1',
      username: 'bloodbank_admin',
      email: 'admin@bloodbank.com',
      password: '$2a$12$iai.zkP56UOK52R9bzV4RuYON6k6MXhDUNjekpsqhwytfii0CusfG', // hashed 'password123'
      name: 'Blood Bank Admin',
      role: 'bloodbank',
      bloodBankId: 'bloodbank1',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '2',
      username: 'store_manager1',
      email: 'store@bloodbank.com',
      password: '$2a$12$uiYtds7V3wNibeIAyJ14e.yRIeYpxYUzwfg2HiynRPTHdmjQyk9mW', // hashed 'password123'
      name: 'Store Manager',
      role: 'store_manager',
      bloodBankId: 'bloodbank1',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '3',
      username: 'doctor1',
      email: 'doctor@bloodbank.com',
      password: '$2a$12$goqkfeuiGj2B.7MJSwPNXeRUvimnfTNdUwGwIiyGGL2BnzZDHB3US', // hashed 'password123'
      name: 'Dr. Smith',
      role: 'doctor',
      bloodBankId: 'bloodbank1',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    {
      _id: '4',
      username: 'frontdesk1',
      email: 'frontdesk@bloodbank.com',
      password: '$2a$12$QqVm0ZuvOSxVDe/i8zT6JeD0OzZkH8SioktC7/v0kgX9Ino/nhOa2', // hashed 'password123'
      name: 'Front Desk Staff',
      role: 'frontdesk',
      bloodBankId: 'bloodbank1',
      isActive: true,
      createdAt: new Date('2024-01-01')
    }
  ],

  inventory: [
    {
      _id: '1',
      bloodGroup: 'A+',
      donationType: 'whole_blood',
      firstSerialNumber: 1001,
      lastSerialNumber: 1005,
      unitsCount: 5,
      collectionDate: new Date('2024-01-15'),
      expiryDate: new Date('2024-02-15'),
      donorName: 'John Doe',
      status: 'available',
      location: 'Refrigerator A, Shelf 1',
      temperature: '2-6°C',
      notes: 'Good quality donation'
    },
    {
      _id: '2',
      bloodGroup: 'O-',
      donationType: 'whole_blood',
      firstSerialNumber: 2001,
      lastSerialNumber: 2003,
      unitsCount: 3,
      collectionDate: new Date('2024-01-20'),
      expiryDate: new Date('2024-01-30'),
      donorName: 'Jane Smith',
      status: 'available',
      location: 'Refrigerator B, Shelf 2',
      temperature: '2-6°C',
      notes: 'Expiring soon'
    }
  ],

  bookings: [
    {
      _id: '1',
      bookingId: 'BOOK001',
      donorName: 'John Doe',
      patientName: 'Patient Smith',
      patientMRID: 'MR001',
      bloodGroup: 'A+',
      date: new Date(),
      time: '10:00 AM',
      status: 'pending'
    },
    {
      _id: '2',
      bookingId: 'BOOK002',
      donorName: 'Jane Smith',
      patientName: 'Patient Jones',
      patientMRID: 'MR002',
      bloodGroup: 'O-',
      date: new Date(),
      time: '2:00 PM',
      status: 'confirmed'
    }
  ],

  patients: [
    {
      _id: '1',
      name: 'Patient Smith',
      mrid: 'MR001',
      bloodGroup: 'A+',
      unitsRequired: 2,
      unitsReceived: 0,
      dateNeeded: new Date(),
      isFulfilled: false,
      address: {
        houseName: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    },
    {
      _id: '2',
      name: 'Patient Jones',
      mrid: 'MR002',
      bloodGroup: 'O-',
      unitsRequired: 1,
      unitsReceived: 1,
      dateNeeded: new Date(),
      isFulfilled: true,
      address: {
        houseName: '456 Oak Ave',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    }
  ]
};

// Helper functions
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const generateUsername = (name) => {
  const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
  let username = baseUsername;
  let counter = 1;
  
  // Ensure unique username
  while (mockData.users.find(user => user.username === username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// CRUD operations for users/staff
const userOperations = {
  // Get all staff (exclude admin users)
  getStaff: (bloodBankId) => {
    return mockData.users.filter(user => 
      user.bloodBankId === bloodBankId && 
      ['frontdesk', 'doctor', 'bleeding_staff', 'store_staff', 'centrifuge_staff', 'store_manager'].includes(user.role)
    );
  },

  // Create new staff member
  createStaff: async (staffData, createdBy) => {
    const username = generateUsername(staffData.name);
    const password = generatePassword();
    const hashedPassword = await hashPassword(password);

    const newStaff = {
      _id: generateId(),
      username,
      email: staffData.email || null,
      password: hashedPassword,
      name: staffData.name,
      role: staffData.role,
      bloodBankId: staffData.bloodBankId,
      phone: staffData.phone || null,
      isActive: true,
      createdAt: new Date(),
      createdBy
    };

    mockData.users.push(newStaff);

    return {
      user: {
        _id: newStaff._id,
        username: newStaff.username,
        email: newStaff.email,
        name: newStaff.name,
        role: newStaff.role,
        phone: newStaff.phone,
        isActive: newStaff.isActive,
        createdAt: newStaff.createdAt
      },
      credentials: {
        username,
        password
      }
    };
  },

  // Update staff member
  updateStaff: (staffId, updates) => {
    const staffIndex = mockData.users.findIndex(user => user._id === staffId);
    if (staffIndex === -1) return null;

    const allowedUpdates = ['name', 'email', 'phone', 'role', 'isActive'];
    const filteredUpdates = {};
    
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    Object.assign(mockData.users[staffIndex], filteredUpdates);
    return mockData.users[staffIndex];
  },

  // Delete staff member
  deleteStaff: (staffId) => {
    const staffIndex = mockData.users.findIndex(user => user._id === staffId);
    if (staffIndex === -1) return false;

    mockData.users.splice(staffIndex, 1);
    return true;
  },

  // Find user by ID
  findById: (userId) => {
    return mockData.users.find(user => user._id === userId);
  },

  // Find user by username or email
  findByCredentials: (identifier) => {
    return mockData.users.find(user => 
      user.username === identifier || user.email === identifier
    );
  }
};

// CRUD operations for inventory
const inventoryOperations = {
  getAll: (bloodBankId, filters = {}) => {
    let items = mockData.inventory.filter(item => item.bloodBankId === bloodBankId || !item.bloodBankId);
    
    // Apply filters
    if (filters.bloodGroup && filters.bloodGroup !== 'all') {
      items = items.filter(item => item.bloodGroup === filters.bloodGroup);
    }
    
    if (filters.status && filters.status !== 'all') {
      items = items.filter(item => item.status === filters.status);
    }
    
    if (filters.search) {
      items = items.filter(item =>
        item.donorName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.firstSerialNumber.toString().includes(filters.search) ||
        item.lastSerialNumber.toString().includes(filters.search)
      );
    }
    
    return items;
  },

  create: (inventoryData) => {
    const newItem = {
      _id: generateId(),
      ...inventoryData,
      unitsCount: inventoryData.lastSerialNumber - inventoryData.firstSerialNumber + 1,
      createdAt: new Date()
    };
    
    mockData.inventory.push(newItem);
    return newItem;
  },

  update: (itemId, updates) => {
    const itemIndex = mockData.inventory.findIndex(item => item._id === itemId);
    if (itemIndex === -1) return null;

    Object.assign(mockData.inventory[itemIndex], updates);
    
    // Recalculate units count if serial numbers changed
    if (updates.firstSerialNumber || updates.lastSerialNumber) {
      mockData.inventory[itemIndex].unitsCount = 
        mockData.inventory[itemIndex].lastSerialNumber - mockData.inventory[itemIndex].firstSerialNumber + 1;
    }
    
    return mockData.inventory[itemIndex];
  },

  delete: (itemId) => {
    const itemIndex = mockData.inventory.findIndex(item => item._id === itemId);
    if (itemIndex === -1) return false;

    mockData.inventory.splice(itemIndex, 1);
    return true;
  }
};

// CRUD operations for patients
const patientOperations = {
  getAll: (bloodBankId, filters = {}) => {
    let patients = mockData.patients.filter(patient => patient.bloodBankId === bloodBankId || !patient.bloodBankId);
    
    // Apply filters
    if (filters.bloodGroup && filters.bloodGroup !== 'all') {
      patients = patients.filter(patient => patient.bloodGroup === filters.bloodGroup);
    }
    
    if (filters.fulfilled !== undefined) {
      patients = patients.filter(patient => patient.isFulfilled === (filters.fulfilled === 'true'));
    }
    
    if (filters.search) {
      patients = patients.filter(patient =>
        patient.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        patient.mrid.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return patients;
  },

  create: (patientData) => {
    const newPatient = {
      _id: generateId(),
      ...patientData,
      unitsReceived: 0,
      isFulfilled: false,
      createdAt: new Date()
    };
    
    mockData.patients.push(newPatient);
    return newPatient;
  },

  update: (patientId, updates) => {
    const patientIndex = mockData.patients.findIndex(patient => patient._id === patientId);
    if (patientIndex === -1) return null;

    Object.assign(mockData.patients[patientIndex], updates);
    return mockData.patients[patientIndex];
  },

  delete: (patientId) => {
    const patientIndex = mockData.patients.findIndex(patient => patient._id === patientId);
    if (patientIndex === -1) return false;

    mockData.patients.splice(patientIndex, 1);
    return true;
  }
};

module.exports = {
  mockData,
  userOperations,
  inventoryOperations,
  patientOperations,
  generateId,
  generateUsername,
  generatePassword,
  hashPassword
};