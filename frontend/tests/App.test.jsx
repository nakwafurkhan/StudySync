import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import api from '../src/services/api';

jest.mock('../src/services/api');

const renderApp = (entries = ['/']) =>
  render(
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );

describe('App routing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the dashboard for an authenticated user at /dashboard', async () => {
    api.get.mockResolvedValue({ data: { user: { id: '1', name: 'Tess' } } });
    renderApp(['/dashboard']);
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome, tess/i)).toBeInTheDocument();
  });

  it('logs out from the navbar', async () => {
    api.get.mockResolvedValue({ data: { user: { id: '1', name: 'Tess' } } });
    api.post.mockResolvedValue({ data: { message: 'Logged out' } });
    const user = userEvent.setup();
    renderApp(['/dashboard']);
    await user.click(await screen.findByRole('button', { name: /log out/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/logout'));
  });

  it('serves the public landing page at / and for unknown routes', async () => {
    api.get.mockRejectedValue({ response: { status: 401 } });
    renderApp(['/totally-unknown']);
    expect(await screen.findByRole('heading', { name: /plan smarter/i })).toBeInTheDocument();
  });
});
