import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../src/pages/Landing';
import { AuthProvider } from '../src/context/AuthContext';
import api from '../src/services/api';

jest.mock('../src/services/api');

const renderLanding = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Landing />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Landing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the hero and sign-up CTA when logged out', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 401 } });
    renderLanding();
    expect(await screen.findByRole('heading', { name: /plan smarter/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('shows "Open your dashboard" when logged in', async () => {
    api.get.mockResolvedValueOnce({ data: { user: { id: '1', name: 'Tess' } } });
    renderLanding();
    expect(await screen.findByRole('link', { name: /open your dashboard/i })).toBeInTheDocument();
  });
});
