import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import BloodBankLogin from '../BloodBankLogin';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({})),
}));

jest.mock('../firebase', () => ({
  app: {},
}));

// Mock API
jest.mock('../lib/api', () => ({
  post: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockApi = require('../lib/api');

describe('BloodBankLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BloodBankLogin />
      </BrowserRouter>
    );
  };

  test('renders login form correctly', () => {
    renderComponent();

    expect(screen.getByText('Blood Bank Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('🏥 Login to Blood Bank')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  test('handles regular login submission', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'user-id',
            username: 'testuser',
            role: 'bloodbank',
          },
        },
      },
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByText('🏥 Login to Blood Bank');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('userId', 'user-id');
    expect(localStorage.setItem).toHaveBeenCalledWith('role', 'bloodbank');
    expect(mockNavigate).toHaveBeenCalledWith('/bloodbank/dashboard');
  });

  test('handles Google login', async () => {
    const mockSignInWithPopup = require('firebase/auth').signInWithPopup;
    const mockUser = {
      email: 'google@example.com',
      uid: 'google-uid',
      displayName: 'Google User',
    };

    mockSignInWithPopup.mockResolvedValueOnce({
      user: mockUser,
    });

    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'google-access-token',
          refreshToken: 'google-refresh-token',
          user: {
            id: 'google-user-id',
            username: 'googleuser',
            role: 'bloodbank',
          },
        },
      },
    });

    renderComponent();

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInWithPopup).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/google-login', {
        email: 'google@example.com',
        uid: 'google-uid',
        displayName: 'Google User',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'google-access-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'google-refresh-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('userId', 'google-user-id');
    expect(localStorage.setItem).toHaveBeenCalledWith('role', 'bloodbank');
    expect(mockNavigate).toHaveBeenCalledWith('/bloodbank/dashboard');
  });

  test('handles Google login error', async () => {
    const mockSignInWithPopup = require('firebase/auth').signInWithPopup;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSignInWithPopup.mockRejectedValueOnce(new Error('Google login failed'));

    renderComponent();

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Google login error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('handles API error for Google login', async () => {
    const mockSignInWithPopup = require('firebase/auth').signInWithPopup;
    const mockUser = {
      email: 'google@example.com',
      uid: 'google-uid',
      displayName: 'Google User',
    };

    mockSignInWithPopup.mockResolvedValueOnce({
      user: mockUser,
    });

    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Google login failed on backend',
        },
      },
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderComponent();

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Google login failed: Google login failed on backend');
    });

    alertSpy.mockRestore();
  });
});
