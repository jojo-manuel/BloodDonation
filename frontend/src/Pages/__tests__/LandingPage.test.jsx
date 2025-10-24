import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import LandingPage from '../LandingPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  test('renders landing page correctly', () => {
    renderComponent();

    expect(screen.getByText('Save Lives Through Blood Donation')).toBeInTheDocument();
    expect(screen.getByText('Hope Web')).toBeInTheDocument();
    expect(screen.getByText('Find Donors')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('How Hope Web Works')).toBeInTheDocument();
    expect(screen.getByText('Become a Donor')).toBeInTheDocument();
    expect(screen.getByText('Find Blood')).toBeInTheDocument();
    expect(screen.getByText('Blood Bank Login')).toBeInTheDocument();
  });

  test('renders stats cards', () => {
    renderComponent();

    expect(screen.getByText('1,247')).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('892')).toBeInTheDocument();
    expect(screen.getByText('Completed Donations')).toBeInTheDocument();
    expect(screen.getByText('3,456')).toBeInTheDocument();
    expect(screen.getByText('Active Donors')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Partner Blood Banks')).toBeInTheDocument();
  });

  test('renders features section', () => {
    renderComponent();

    expect(screen.getByText('Register as Donor')).toBeInTheDocument();
    expect(screen.getByText('Receive Requests')).toBeInTheDocument();
    expect(screen.getByText('Save Lives')).toBeInTheDocument();
  });

  test('navigates to dashboard when Find Donors button is clicked', () => {
    renderComponent();

    const findDonorsButton = screen.getByText('Find Donors');
    fireEvent.click(findDonorsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('navigates to login when Login button is clicked', () => {
    renderComponent();

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates to register when Register button is clicked', () => {
    renderComponent();

    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('navigates to donor register when Become a Donor button is clicked', () => {
    renderComponent();

    const becomeDonorButton = screen.getByText('Become a Donor');
    fireEvent.click(becomeDonorButton);

    expect(mockNavigate).toHaveBeenCalledWith('/donor-register');
  });

  test('navigates to find blood when Find Blood button is clicked', () => {
    renderComponent();

    const findBloodButton = screen.getByText('Find Blood');
    fireEvent.click(findBloodButton);

    expect(mockNavigate).toHaveBeenCalledWith('/find-blood');
  });

  test('navigates to blood bank login when Blood Bank Login button is clicked', () => {
    renderComponent();

    const bloodBankLoginButton = screen.getByText('Blood Bank Login');
    fireEvent.click(bloodBankLoginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/bloodbank-login');
  });

  test('renders footer correctly', () => {
    renderComponent();

    expect(screen.getByText('Connecting hearts, saving lives.')).toBeInTheDocument();
    expect(screen.getByText('Secure & Safe')).toBeInTheDocument();
    expect(screen.getByText('24/7 Support')).toBeInTheDocument();
    expect(screen.getByText('Lives Saved Daily')).toBeInTheDocument();
  });
});
