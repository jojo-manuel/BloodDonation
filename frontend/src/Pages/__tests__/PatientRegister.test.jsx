import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientRegister from '../PatientRegister';
import { BrowserRouter } from 'react-router-dom';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('PatientRegister Phone Number Field Validation', () => {
  beforeEach(() => {
    window.alert = jest.fn();
    renderWithRouter(<PatientRegister />);
  });

  test('shows error alert when phone number is empty', async () => {
    const phoneInput = screen.getByPlaceholderText(/10-digit phone number/i);
    const submitButton = screen.getByRole('button', { name: /register patient/i });

    // Clear phone number input
    fireEvent.change(phoneInput, { target: { value: '' } });

    // Fill other required fields with valid data
    fireEvent.change(screen.getByPlaceholderText(/Enter patient name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter patient address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/Blood Group/i), { target: { value: 'A+' } });
    fireEvent.change(screen.getByPlaceholderText(/Medical Record ID/i), { target: { value: 'MR123' } });
    fireEvent.change(screen.getByPlaceholderText(/Number of units/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Date Needed/i), { target: { value: new Date().toISOString().split('T')[0] } });

    // Submit form
    await React.act(async () => {
      fireEvent.submit(submitButton.closest('form'));
    });

    // Expect alert with phone number required error
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Phone number is required'));
  });

  test('shows error alert when phone number is not exactly 10 digits', async () => {
    const phoneInput = screen.getByPlaceholderText(/10-digit phone number/i);
    const submitButton = screen.getByRole('button', { name: /register patient/i });

    // Enter invalid phone number
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    // Fill other required fields with valid data
    fireEvent.change(screen.getByPlaceholderText(/Enter patient name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter patient address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/Blood Group/i), { target: { value: 'A+' } });
    fireEvent.change(screen.getByPlaceholderText(/Medical Record ID/i), { target: { value: 'MR123' } });
    fireEvent.change(screen.getByPlaceholderText(/Number of units/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Date Needed/i), { target: { value: new Date().toISOString().split('T')[0] } });

    // Submit form
    await React.act(async () => {
      fireEvent.submit(submitButton.closest('form'));
    });

    // Expect alert with phone number length error
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Phone number must be exactly 10 digits'));
  });

  test('submits form successfully with valid phone number', async () => {
    const phoneInput = screen.getByPlaceholderText(/10-digit phone number/i);
    const submitButton = screen.getByRole('button', { name: /register patient/i });

    // Enter valid phone number
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    // Fill other required fields with valid data
    fireEvent.change(screen.getByPlaceholderText(/Enter patient name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter patient address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/Blood Group/i), { target: { value: 'A+' } });
    fireEvent.change(screen.getByPlaceholderText(/Medical Record ID/i), { target: { value: 'MR123' } });
    fireEvent.change(screen.getByPlaceholderText(/Number of units/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Date Needed/i), { target: { value: new Date().toISOString().split('T')[0] } });

    // Mock window alert to prevent actual alert popup
    // window.alert = jest.fn(); // Already mocked in beforeEach

    // Submit form
    await React.act(async () => {
      fireEvent.submit(submitButton.closest('form'));
    });

    // Since backend does not handle phone number, form submission will proceed
    // We expect no validation alert for phone number errors
    expect(window.alert).not.toHaveBeenCalledWith(expect.stringContaining('Phone number'));
  });
});
