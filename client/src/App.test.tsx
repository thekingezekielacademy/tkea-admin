import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App-simple';

test('renders King Ezekiel Academy', () => {
  render(<App />);
  const titleElement = screen.getByText(/King Ezekiel Academy/i);
  expect(titleElement).toBeInTheDocument();
});
