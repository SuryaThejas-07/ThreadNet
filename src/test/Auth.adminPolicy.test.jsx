import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { ThemeProvider } from '../contexts/ThemeContext';
import { I18nProvider } from '../contexts/I18nContext';

const loginMock = vi.fn();
const registerMock = vi.fn();
const googleMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    register: registerMock,
    loginWithGoogle: googleMock,
  }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <I18nProvider>
          <Login />
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('Admin email policy UI flow', () => {
  it('shows invalid admin account message when auth returns app/invalid-admin-email', async () => {
    const user = userEvent.setup();

    loginMock.mockRejectedValueOnce({
      code: 'app/invalid-admin-email',
      message: 'Invalid administrator email',
    });

    renderLogin();

    await user.click(screen.getByRole('button', { name: /select administrator/i }));

    await user.type(screen.getByLabelText(/email address/i), 'notadmin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');

    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid administrator account/i)).toBeInTheDocument();
      expect(screen.getByText(/not approved for administrator access/i)).toBeInTheDocument();
    });
  });
});
