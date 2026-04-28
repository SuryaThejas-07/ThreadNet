import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import ProtectedRoute from '../components/ProtectedRoute';

const renderRoute = ({ authState, roles, initialPath = '/protected' }) => {
  mockUseAuth.mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute roles={roles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProtectedRoute role access', () => {
  it('redirects unauthenticated users to login', () => {
    renderRoute({
      authState: {
        isAuthenticated: false,
        loading: false,
        user: null,
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects unauthorized roles to dashboard', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'factory_owner' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('allows authorized roles to access protected content', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'administrator' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('blocks factory owner from admin page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'factory_owner' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks factory owner from operations page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'factory_owner' },
      },
      roles: ['logistics_provider', 'administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks factory owner from admin-only analytics page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'factory_owner' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks logistics provider from inventory page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'logistics_provider' },
      },
      roles: ['factory_owner', 'administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks logistics provider from deals page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'logistics_provider' },
      },
      roles: ['factory_owner', 'administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks logistics provider from analytics page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'logistics_provider' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('blocks logistics provider from admin page', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'logistics_provider' },
      },
      roles: ['administrator'],
    });

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('allows logistics provider to access operations feature', () => {
    renderRoute({
      authState: {
        isAuthenticated: true,
        loading: false,
        user: { role: 'logistics_provider' },
      },
      roles: ['logistics_provider', 'administrator'],
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
