import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import ProductsPage from "./ProductsPage";

test("filters the catalog by inverter and battery category counts", () => {
  const onAdd = jest.fn();
  render(
    <MantineProvider>
      <ProductsPage brand="all" category="Battery" onAdd={onAdd} navigate={jest.fn()} />
    </MantineProvider>,
  );

  expect(screen.getByRole("heading", { name: /browse home batteries/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /all products 4/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /inverters 2/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /batteries 2/i })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("checkbox", { name: /all brands 2/i })).toBeChecked();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(2);

  fireEvent.click(screen.getByRole("checkbox", { name: /luminous 1/i }));
  expect(screen.getByRole("checkbox", { name: /microtek 1/i })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: /luminous 1/i })).not.toBeChecked();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(1);
  expect(screen.getByRole("button", { name: /inverters 1/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /inverters 1/i }));
  expect(screen.getByRole("heading", { name: /browse home inverters/i })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(1);

  fireEvent.click(screen.getByRole("checkbox", { name: /luminous 1/i }));
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: /batteries 2/i }));
  fireEvent.click(screen.getAllByRole("button", { name: /add to bag/i })[0]);
  expect(onAdd).toHaveBeenCalledWith("microtek-battery");
});
