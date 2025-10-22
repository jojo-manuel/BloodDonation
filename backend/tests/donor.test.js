const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../Models/User');
const Donor = require('../Models/donor');

// Increase Jest timeout for database operations
jest.setTimeout(30000);

let token;
let userId;

beforeAll(async () => {
  // Connect to test database
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set. Please set it to your cloud MongoDB URI.');
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user and get token
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'user',
      provider: 'local',
    });
  expect(userRes.statusCode).toBe(201);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testuser@example.com',
      password: 'Password123',
    });
  expect(loginRes.statusCode).toBe(200);
  token = loginRes.body.data.accessToken;
  userId = loginRes.body.data.user.id;
}, 60000);

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({ email: 'testuser@example.com' });
  await Donor.deleteMany({ userId });
  await mongoose.connection.close();
}, 60000);

describe('Donor Registration and Search', () => {
  test('Register donor profile', async () => {
    const res = await request(app)
      .post('/api/donors/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test User',
        dob: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        emergencyContactNumber: '0987654321',
        phone: '1112223333',
        houseAddress: {
          houseName: 'Test House',
          houseAddress: '123 Test St',
          localBody: 'Test Local Body',
          city: 'Test City',
          district: 'Test District',
          pincode: '123456',
        },
        workAddress: 'Test Work Address',
        availability: true,
        lastDonatedDate: '2023-01-01T00:00:00.000Z',
        contactPreference: 'phone',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Donor registered/);
  });

  test('Search donors', async () => {
    const res = await request(app)
      .get('/api/donors/search')
      .query({ bloodGroup: 'A+', city: 'Test City' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });
});
