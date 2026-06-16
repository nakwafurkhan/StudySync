import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../src/pages/Register';
import { AuthProvider } from '../src/context/AuthContext';
import api from '../src/services/api';

jest.mock('../src/services/api');

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Register page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { user: null } });
  });

  it('submits name, email and password to the API', async () => {
    api.post.mockResolvedValueOnce({
      data: { user: { id: '1', email: 'new@b.com', name: 'New User' } },
    });
    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText(/name/i), 'New User');
    await user.type(screen.getByLabelText(/email/i), 'new@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'New User',
        email: 'new@b.com',
        password: 'password123',
      })
    );
  });

  it('surfaces a server error message', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Email is already registered' } },
    });
    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText(/name/i), 'Dup');
    await user.type(screen.getByLabelText(/email/i), 'dup@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already registered/i);
  });
});
