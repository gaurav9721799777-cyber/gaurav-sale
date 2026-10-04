import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the founder and category-focused homepage', async () => {
  render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  );

  expect(screen.getByRole('button', { name: /gaurav sales home/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /power through every moment/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /meet gaurav tripathi/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /start with what you need/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /real homes\. real experiences\./i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /add to bag/i })).not.toBeInTheDocument();
  const banners = screen.getAllByRole('button', { name: /show banner/i });
  expect(banners).toHaveLength(2);
  fireEvent.click(banners[1]);
  expect(screen.getByRole('heading', { name: /backup power, made simple/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /backup batteries/i }));
  expect(window.location.pathname).toBe('/products/batteries');
  expect(await screen.findByRole('heading', { name: /browse home batteries/i })).toBeInTheDocument();
  expect(screen.queryByText('Inverter', { exact: true })).not.toBeInTheDocument();
});

test('filters products by brand within inverter and battery categories', async () => {
  render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /explore inverter range/i }));
  expect(await screen.findByRole('heading', { name: /explore home backup power/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /all brands 4/i })).toBeChecked();

  fireEvent.click(screen.getByRole('button', { name: /batteries 2/i }));
  expect(screen.getByRole('button', { name: /batteries 2/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /inverters 2/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /all products 4/i })).toBeInTheDocument();
  expect(screen.getAllByText('Battery', { exact: true })).toHaveLength(2);
  expect(screen.queryByText('Inverter', { exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /luminous 1/i }));
  expect(screen.getAllByRole('button', { name: /add to bag/i })).toHaveLength(1);
  expect(screen.getByRole('checkbox', { name: /microtek 1/i })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /luminous 1/i })).not.toBeChecked();

  fireEvent.click(screen.getByRole('button', { name: /inverters 1/i }));
  expect(screen.getByRole('button', { name: /inverters 1/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /batteries 1/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /all products 2/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /add to bag/i })).toHaveLength(1);
  expect(screen.getAllByText('Inverter', { exact: true })).toHaveLength(1);
  expect(screen.queryByText('Battery', { exact: true })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /luminous 1/i }));
  expect(screen.getAllByRole('button', { name: /add to bag/i })).toHaveLength(2);
});
