import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { TableList } from "./TableList";

const tables = [
  {
    id: "users",
    name: "users",
    arn: "arn:aws:dynamodb:us-east-1:000000000000:table/users",
    region: "us-east-1",
    status: "ACTIVE",
    item_count: 12,
    created_at: 1700000000,
    partition_key: { name: "id", type: "S" as const },
    sort_key: null,
  },
  {
    id: "orders",
    name: "orders",
    arn: "arn:aws:dynamodb:us-east-1:000000000000:table/orders",
    region: "us-east-1",
    status: "CREATING",
    item_count: 0,
    created_at: null,
    partition_key: { name: "pk", type: "S" as const },
    sort_key: { name: "sk", type: "N" as const },
  },
];

const noop = () => {};

function renderList(props: Partial<ComponentProps<typeof TableList>> = {}) {
  return render(
    <MemoryRouter>
      <TableList
        tables={tables}
        isLoading={false}
        error={null}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("TableList", () => {
  it("renders table names as links and shows a formatted key summary", () => {
    renderList();

    expect(screen.getByRole("link", { name: "users" })).toHaveAttribute("href", "/dynamodb/users");
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("pk + sk")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows status as a badge", () => {
    renderList();

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("CREATING")).toBeInTheDocument();
  });

  it("renders the empty state with a create action", () => {
    renderList({ tables: [] });

    expect(screen.getByText(/no tables yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create table/i })).toBeInTheDocument();
  });

  it("displays loading state", () => {
    renderList({ tables: undefined, isLoading: true });

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("displays an API failure", () => {
    const error = new ApiError(
      { code: "PROVIDER_UNAVAILABLE", message: "Could not reach the API.", requestId: null, retryable: true },
      503,
    );

    renderList({ tables: undefined, error });

    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the API.");
  });

  it("invokes the delete action for the clicked table", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderList({ onDelete });

    await user.click(screen.getByRole("button", { name: /delete users/i }));

    expect(onDelete).toHaveBeenCalledWith("users");
  });
});
