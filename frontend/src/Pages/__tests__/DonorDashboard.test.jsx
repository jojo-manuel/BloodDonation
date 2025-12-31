import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DonorDashboard from '../DonorDashboard';
import api from '../../lib/api';

jest.mock('../../lib/api');

describe('DonorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders availability status and toggles availability', async () => {
    api.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    api.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Availability Status/i)).toBeInTheDocument();
    expect(screen.getByText(/You are currently available/i)).toBeInTheDocument();

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/donors/availability', { available: false });
      expect(screen.getByText(/You are currently unavailable/i)).toBeInTheDocument();
    });
  });

  test('loads and displays donation requests', async () => {
    const mockRequests = [
      {
        _id: '1',
        hospitalName: 'City General Hospital',
        patientName: 'John Doe',
        hospitalLocation: 'Downtown Medical Center',
        priority: 'High',
        bloodType: 'O+',
        requestDate: '2025-01-15T00:00:00Z',
        notes: 'Emergency surgery required',
      },
    ];
    api.get.mockResolvedValueOnce({ data: { success: true, data: mockRequests } });

    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Donation Requests/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/City General Hospital/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/O\+/i)).toBeInTheDocument();
      expect(screen.getByText(/Emergency surgery required/i)).toBeInTheDocument();
    });
  });

  test('accepts a donation request', async () => {
    const mockRequests = [
      {
        _id: '1',
        hospitalName: 'City General Hospital',
        patientName: 'John Doe',
        hospitalLocation: 'Downtown Medical Center',
        priority: 'High',
        bloodType: 'O+',
        requestDate: '2025-01-15T00:00:00Z',
        notes: 'Emergency surgery required',
      },
    ];
    api.get.mockResolvedValueOnce({ data: { success: true, data: mockRequests } });
    api.post.mockResolvedValueOnce({ data: { success: true } });
    api.get.mockResolvedValueOnce({ data: { success: true, data: [] } }); // After accept, fetch empty list

    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/City General Hospital/i)).toBeInTheDocument();
    });

    const acceptButton = screen.getByText(/Accept Request/i);
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/donation-requests/1/accept');
      expect(screen.getByText(/No donation requests at the moment/i)).toBeInTheDocument();
    });
  });

  test('declines a donation request', async () => {
    const mockRequests = [
      {
        _id: '1',
        hospitalName: 'City General Hospital',
        patientName: 'John Doe',
        hospitalLocation: 'Downtown Medical Center',
        priority: 'High',
        bloodType: 'O+',
        requestDate: '2025-01-15T00:00:00Z',
        notes: 'Emergency surgery required',
      },
    ];
    api.get.mockResolvedValueOnce({ data: { success: true, data: mockRequests } });
    api.post.mockResolvedValueOnce({ data: { success: true } });
    api.get.mockResolvedValueOnce({ data: { success: true, data: [] } }); // After decline, fetch empty list

    render(
      <MemoryRouter>
        <DonorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/City General Hospital/i)).toBeInTheDocument();
    });

    const declineButton = screen.getByText(/Decline/i);
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/donation-requests/1/decline');
      expect(screen.getByText(/No donation requests at the moment/i)).toBeInTheDocument();
    });
  });
});
