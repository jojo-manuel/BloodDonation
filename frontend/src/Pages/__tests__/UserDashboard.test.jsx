import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../UserDashboard';

jest.mock('../../lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

const api = require('../../lib/api');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location

describe('UserDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders Find Donors tab by default', () => {
    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    expect(screen.getByText(/Find Blood Donors/i)).toBeInTheDocument();
  });

  test('search donors by blood group and city', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { data: [{ _id: '1', userId: { username: 'Donor1' }, bloodGroup: 'A+', houseAddress: { city: 'City1' }, lastDonatedDate: null }] }
      }
    });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/Blood Type/i), { target: { value: 'A+' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter city/i), { target: { value: 'City1' } });
    fireEvent.click(screen.getByRole('button', { name: /Search Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Available Donors/i)).toBeInTheDocument();
      expect(screen.getByText(/Donor1/i)).toBeInTheDocument();
    });
  });

  test('fetch patient by MRID and search donors', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/donors/searchByMrid/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              data: [{ _id: '2', userId: { username: 'Donor2' }, bloodGroup: 'B+', houseAddress: { city: 'City2' }, lastDonatedDate: null }],
              total: 1,
              pages: 1,
              page: 1,
            },
          },
        });
      }
      return Promise.resolve({ data: { success: false } });
    });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Search by MRID/i }));

    const mridInput = screen.getByLabelText(/Patient MRID/i);
    fireEvent.change(mridInput, { target: { value: 'MRID123' } });

    fireEvent.click(screen.getByRole('button', { name: /Search Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Donors for MRID/i)).toBeInTheDocument();
      expect(screen.getByText(/Donor2/i)).toBeInTheDocument();
    });
  });

  test('send donation request', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    // Simulate sending request by calling handleRequest directly or clicking request button
    // For simplicity, call handleRequest via button click in Find Donors tab

    // Mock donors in state by searching first
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { data: [{ _id: '3', userId: { username: 'Donor3' }, bloodGroup: 'O+', houseAddress: { city: 'City3' }, lastDonatedDate: null }] }
      }
    });

    fireEvent.click(screen.getByRole('button', { name: /Search Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Donor3/i)).toBeInTheDocument();
    });

    const requestButton = screen.getByRole('button', { name: /Request/i });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/donation-requests', expect.any(Object));
    });
  });

  test('profile dropdown toggle and availability toggle', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'donor', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.patch.mockResolvedValue({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText(/User1/i)).toBeInTheDocument();
    });

    const profileButton = screen.getByRole('button', { name: /US/i });
    fireEvent.click(profileButton);

    const availabilityCheckbox = screen.getByRole('checkbox');
    fireEvent.click(availabilityCheckbox);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/me/availability', expect.any(Object));
    });
  });

  test('profile completion modal submission', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User2', role: 'donor', needsProfileCompletion: true }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.post.mockResolvedValueOnce({ data: { success: true, data: { username: 'User2', role: 'donor', needsProfileCompletion: false } } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '1234567890' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/me/complete-profile', { name: 'Test User', phone: '1234567890' });
      expect(screen.queryByText(/Complete Your Profile/i)).not.toBeInTheDocument();
    });
  });

  test('tab navigation', () => {
    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    const searchByMRIDTab = screen.getByRole('button', { name: /Search by MRID/i });
    fireEvent.click(searchByMRIDTab);
    expect(screen.getByText(/Search Patient by MRID/i)).toBeInTheDocument();

    const myRequestsTab = screen.getByRole('button', { name: /My Requests/i });
    fireEvent.click(myRequestsTab);
    expect(screen.getByText(/My Requests/i)).toBeInTheDocument();

    const leaveReviewsTab = screen.getByRole('button', { name: /Leave Reviews/i });
    fireEvent.click(leaveReviewsTab);
    expect(screen.getByText(/Leave Reviews/i)).toBeInTheDocument();
  });

  test('logout clears localStorage and redirects', () => {
    localStorage.setItem('token', 'testtoken');

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('respond to request - accept', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'donor', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{
          _id: 'req1',
          donorId: { _id: 'donor1', userId: { username: 'Donor1' }, bloodGroup: 'A+' },
          status: 'pending',
          requestedAt: new Date().toISOString(),
          message: 'Test message'
        }]
      }
    });
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Wait for requests to load
    await waitFor(() => {
      expect(screen.getByText(/My Requests/i)).toBeInTheDocument();
    });

    // Switch to My Requests tab
    const myRequestsTab = screen.getByRole('button', { name: /My Requests/i });
    fireEvent.click(myRequestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Donor1/i)).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/donors/respond-request', {
        requestId: 'req1',
        response: 'accepted'
      });
    });
  });

  test('respond to request - reject', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'donor', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{
          _id: 'req2',
          donorId: { _id: 'donor2', userId: { username: 'Donor2' }, bloodGroup: 'B+' },
          status: 'pending',
          requestedAt: new Date().toISOString(),
          message: 'Test message'
        }]
      }
    });
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Switch to My Requests tab
    const myRequestsTab = screen.getByRole('button', { name: /My Requests/i });
    fireEvent.click(myRequestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Donor2/i)).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /Reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/donors/respond-request', {
        requestId: 'req2',
        response: 'rejected'
      });
    });
  });

  test('booking button shows for accepted requests', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'donor', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{
          _id: 'req3',
          donorId: { _id: 'donor3', userId: { username: 'Donor3' }, bloodGroup: 'O+' },
          status: 'accepted',
          requestedAt: new Date().toISOString(),
          message: 'Test message'
        }]
      }
    });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Switch to My Requests tab
    const myRequestsTab = screen.getByRole('button', { name: /My Requests/i });
    fireEvent.click(myRequestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Donor3/i)).toBeInTheDocument();
    });

    const bookSlotButton = screen.getByRole('button', { name: /Book Slot/i });
    expect(bookSlotButton).toBeInTheDocument();
  });

  test('booking modal opens and submits', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'donor', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: true }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [{
          _id: 'req4',
          donorId: { _id: 'donor4', userId: { username: 'Donor4' }, bloodGroup: 'AB+' },
          status: 'accepted',
          requestedAt: new Date().toISOString(),
          message: 'Test message',
          patientId: {
            name: 'Patient1',
            bloodBankId: { name: 'BloodBank1', address: 'Address1' },
            unitsNeeded: 2
          }
        }]
      }
    });
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Switch to My Requests tab
    const myRequestsTab = screen.getByRole('button', { name: /My Requests/i });
    fireEvent.click(myRequestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Donor4/i)).toBeInTheDocument();
    });

    const bookSlotButton = screen.getByRole('button', { name: /Book Slot/i });
    fireEvent.click(bookSlotButton);

    await waitFor(() => {
      expect(screen.getByText(/Select Date and Time for Donation/i)).toBeInTheDocument();
    });

    // Fill form
    const dateInput = screen.getByLabelText(/Date/i);
    const timeInput = screen.getByLabelText(/Time/i);
    fireEvent.change(dateInput, { target: { value: '2023-12-25' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/book-slot', {
        requestId: 'req4',
        requestedDate: '2023-12-25',
        requestedTime: '10:00'
      });
    });
  });

  test('direct booking modal opens and submits', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { username: 'User1', role: 'user', needsProfileCompletion: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { availability: false }
      }
    });
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { data: [{ _id: 'donor5', userId: { username: 'Donor5' }, bloodGroup: 'O-', houseAddress: { city: 'City5' }, lastDonatedDate: null }] }
      }
    });
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<BrowserRouter><UserDashboard /></BrowserRouter>);

    // Search for donors
    fireEvent.click(screen.getByRole('button', { name: /Search Donors/i }));

    await waitFor(() => {
      expect(screen.getByText(/Donor5/i)).toBeInTheDocument();
    });

    const bookSlotButton = screen.getByRole('button', { name: /Book Slot/i });
    fireEvent.click(bookSlotButton);

    await waitFor(() => {
      expect(screen.getByText(/Book Donation Slot Directly/i)).toBeInTheDocument();
    });

    // Fill form
    const dateInput = screen.getByLabelText(/Date/i);
    const timeInput = screen.getByLabelText(/Time/i);
    fireEvent.change(dateInput, { target: { value: '2023-12-26' } });
    fireEvent.change(timeInput, { target: { value: '11:00' } });

    const submitButton = screen.getByRole('button', { name: /Book Slot/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/direct-book-slot', {
        donorId: 'donor5',
        requestedDate: '2023-12-26',
        requestedTime: '11:00'
      });
    });
  });
});
