import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { AuthProvider } from '../src/context/AuthContext';
import api from '../src/services/api';

jest.mock('../src/services/api');

const renderWithAuth = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to /login when unauthenticated', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 401 } });
    renderWithAuth();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('renders the protected children when authenticated', async () => {
    api.get.mockResolvedValueOnce({ data: { user: { id: '1', name: 'A' } } });
    renderWithAuth();
    expect(await screen.findByText('Secret Dashboard')).toBeInTheDocument();
  });
});
