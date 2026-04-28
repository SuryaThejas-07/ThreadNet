import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../contexts/I18nContext';

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
};

describe('Login smoke flow', () => {
  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /select factory owner/i }));
    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    await user.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
