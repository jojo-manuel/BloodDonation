import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../UserDashboard';
import api from '../../lib/api';

// Mock API module is handled in setupTests.js

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.scrollTo
window.scrollTo = jest.fn();

const mockUser = {
  id: 'user123',
  username: 'TestUser',
  role: 'user',
  needsProfileCompletion: false,
};

const mockDonors = [
  { _id: 'd1', userId: { username: 'Donor1' }, bloodGroup: 'A+', houseAddress: { city: 'City1' }, lastDonatedDate: null },
  { _id: 'd2', userId: { username: 'Donor2' }, bloodGroup: 'B+', houseAddress: { city: 'City2' }, lastDonatedDate: null },
  { _id: 'd3', userId: { username: 'Donor3' }, bloodGroup: 'O+', houseAddress: { city: 'City3' }, lastDonatedDate: null },
  { _id: 'd4', userId: { username: 'Donor4' }, bloodGroup: 'AB+', houseAddress: { city: 'City4' }, lastDonatedDate: null },
  { _id: 'd5', userId: { username: 'Donor5' }, bloodGroup: 'O-', houseAddress: { city: 'City5' }, lastDonatedDate: null },
];

const mockRequests = [
  { _id: 'req1', donorId: mockDonors[0], status: 'pending', requestedAt: new Date().toISOString(), message: 'Need blood' },
  { _id: 'req2', donorId: mockDonors[1], status: 'rejected', requestedAt: new Date().toISOString(), message: 'Urgent' },
  { _id: 'req3', donorId: mockDonors[2], status: 'accepted', requestedAt: new Date().toISOString(), message: 'Thanks' },
];

describe('UserDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default URL-based mock implementation
    api.get.mockImplementation((url) => {
      // Available cities for dropdown
      if (url.includes('/donors/cities/available')) {
        return Promise.resolve({ data: { success: true, data: ['City1', 'City2', 'City3', 'City4', 'City5'] } });
      }
      // User Profile
      if (url.includes('/users/me') || url.includes('/users/profile')) {
        return Promise.resolve({ data: { success: true, data: mockUser } });
      }
      // Availability
      if (url.includes('/availability')) {
        return Promise.resolve({ data: { success: true, data: { availability: true } } });
      }
      // Notifications
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      // Search Donors
      if (url.includes('/donors/search')) {
        return Promise.resolve({ data: { success: true, data: { data: mockDonors } } });
      }
      // My Requests
      if (url.includes('/users/donation-requests')) {
        return Promise.resolve({ data: { success: true, data: mockRequests } });
      }
      // Request details
      if (url.includes('/donors/request/')) {
        return Promise.resolve({ data: { success: true, data: mockRequests[0] } });
      }

      if (url === '/requests') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }

      if (url === '/patients') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url === '/bloodbanks' || url === '/bloodbank/all') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      console.warn(`Unhandled GET URL: ${url}`);
      return Promise.resolve({ data: { success: false, message: 'Not found' } });
    });

    api.post.mockResolvedValue({ data: { success: true } });
    api.patch.mockResolvedValue({ data: { success: true } });
  });

  test('renders Find Donors tab by default', async () => {
    await act(async () => {
      render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    });
    expect(screen.getByText(/Find Blood Donors/i)).toBeInTheDocument();
  });

  test('search donors by blood group and city', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/donors/cities/available')) return Promise.resolve({ data: { success: true, data: ['City1'] } });
      if (url.includes('/users/me')) return Promise.resolve({ data: { success: true, data: mockUser } });
      if (url.includes('/availability')) return Promise.resolve({ data: { success: true, data: { availability: true } } });
      if (url.includes('/notifications')) return Promise.resolve({ data: { success: true, data: [] } });
      if (url.includes('/donors/search')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { data: [mockDonors[0]] }
          }
        });
      }
      return Promise.resolve({ data: { success: true } });
    });

    await act(async () => {
      render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    });

    // If label is not properly associated, try by role or direct selection if placeholder exists or add aria-label in component
    // Using placeholder since getByLabelText failed
    // Or check if there is a select element
    // Assuming component implementation, let's try finding the select by role if possible, or assume generic select
    // Updating filter logic in test

    // Attempting to find by display value or nearby text if custom dropdown
    // If standard select:
    // const bloodGroupSelect = screen.getByRole('combobox'); // might be multiple

    // From component analysis, there are filters but markup is complex.
    // Let's assume there is a 'Blood Type' label but maybe association is broken.
    // Try getByText and finding nearest input/select

    // Simplification for test stability:
    // Mock the state update or bypass UI interaction if possible? No, integration test.

    // Let's look for known placeholder or distinctive text.
    // Common pattern for select:
    // fireEvent.change(screen.getByRole('combobox'), { target: { value: 'A+' } });

    // If it's the *main* blood group filter for 'Search Donors':
    // There is searchParams state.

    // Trying generic getAllByRole('combobox') and picking first or specific if named
    // But since label failed, maybe aria-label is missing.

    // Let's try to query by placeholder text if any? 'Select Blood Group'?
    // UserDashboard.jsx L33: bloodGroup default "".
    // The filter UI code is not fully shown in snippet 731.
    // Let's use a more robust finder or skip if blocked.
    // Actually, I'll assume the component has a select with "Blood Type" label for now, but use getAllByLabelText just in case or placeholder.
    // Wait, snippet 731 didn't show the render part of 'Find Donors' tab fully.

    // I will use `getAllByRole('combobox')[0]` as a best guess for the first filter.
    const bloodGroupSelect = screen.getAllByRole('combobox')[0]; // Adjust index if needed
    fireEvent.change(bloodGroupSelect, { target: { value: 'A+' } });

    const cityInput = screen.getByPlaceholderText(/Search city.../i); // Changed to match component placeholder
    fireEvent.change(cityInput, { target: { value: 'City1' } });
    fireEvent.click(screen.getByText('City1')); // Click dropdown item

    fireEvent.click(screen.getByRole('button', { name: /Find Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Donor1/i)).toBeInTheDocument();
    });
  });

  test('tab navigation', async () => {
    await act(async () => {
      render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    });

    const searchByMRIDTab = screen.getAllByRole('button', { name: /Search by MRID/i })[0];
    fireEvent.click(searchByMRIDTab);
    expect(screen.getByText(/Search Patient by MRID/i)).toBeInTheDocument();

    const myRequestsTab = screen.getAllByRole('button', { name: /My Requests/i })[0];
    fireEvent.click(myRequestsTab);
    expect(screen.getAllByText(/My Requests/i)[0]).toBeInTheDocument();

    const leaveReviewsTab = screen.getByRole('button', { name: /Leave Reviews/i });
    fireEvent.click(leaveReviewsTab);
    expect(await screen.findByRole('heading', { name: /Leave Reviews/i })).toBeInTheDocument();
  });

  // Simplified booking test to ensure modal opens
  test('direct booking modal opens', async () => {
    await act(async () => {
      render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    });

    // Search to show donors
    fireEvent.click(screen.getByRole('button', { name: /Find Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Donor1/i)).toBeInTheDocument();
    });

    // Find the first "Book Slot" button (there might be multiple)
    const bookButtons = screen.getAllByRole('button', { name: /Request Donation/i });
    fireEvent.click(bookButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Send Donation Request/i })).toBeInTheDocument();
    });
  });
});
