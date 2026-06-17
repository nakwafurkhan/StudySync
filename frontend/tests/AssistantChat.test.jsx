import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistantChat from '../src/components/AssistantChat';
import * as svc from '../src/services/assistant';

jest.mock('../src/services/assistant', () => ({
  __esModule: true,
  sendMessage: jest.fn(),
}));

describe('AssistantChat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends a message and shows the user bubble + assistant reply', async () => {
    svc.sendMessage.mockResolvedValueOnce('Focus on Statistics first.');
    const user = userEvent.setup();
    render(<AssistantChat />);

    await user.type(screen.getByLabelText(/message/i), 'What first?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('What first?')).toBeInTheDocument();
    expect(await screen.findByText('Focus on Statistics first.')).toBeInTheDocument();
    await waitFor(() =>
      expect(svc.sendMessage).toHaveBeenCalledWith([{ role: 'user', content: 'What first?' }])
    );
  });

  it('surfaces an error when the assistant fails', async () => {
    svc.sendMessage.mockRejectedValueOnce({ response: { data: { message: 'The assistant is unavailable. Please try again.' } } });
    const user = userEvent.setup();
    render(<AssistantChat />);

    await user.type(screen.getByLabelText(/message/i), 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unavailable/i);
  });
});
