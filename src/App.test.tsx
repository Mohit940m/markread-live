import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Scaffold (US-1.1)', () => {
  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getByText('MarkRead')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
