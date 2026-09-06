import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { QueueList } from "./QueueList";

const queues = [
  {
    id: "orders",
    name: "orders",
    url: "http://localhost:4566/000000000000/orders",
    arn: "arn:aws:sqs:us-east-1:000000000000:orders",
    region: "us-east-1",
    created_at: "2026-01-01T00:00:00Z",
    approximate_message_count: 3,
    tags: {},
  },
  {
    id: "notifications",
    name: "notifications",
    url: "http://localhost:4566/000000000000/notifications",
    arn: "arn:aws:sqs:us-east-1:000000000000:notifications",
    region: "us-west-2",
    created_at: null,
    approximate_message_count: 0,
    tags: {},
  },
];

const noop = () => {};

function renderList(props: Partial<ComponentProps<typeof QueueList>> = {}) {
  return render(
    <MemoryRouter>
      <QueueList
        queues={queues}
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

describe("QueueList", () => {
  it("renders queue names as links to their detail page", () => {
    renderList();

    const link = screen.getByRole("link", { name: "orders" });
    expect(link).toHaveAttribute("href", "/sqs/orders");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("us-west-2")).toBeInTheDocument();
  });

  it("renders the empty state with a create action", () => {
    renderList({ queues: [] });

    expect(screen.getByText(/no queues yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create queue/i })).toBeInTheDocument();
  });

  it("displays loading state", () => {
    renderList({ queues: undefined, isLoading: true });

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("displays an API failure", () => {
    const error = new ApiError(
      { code: "PROVIDER_UNAVAILABLE", message: "Could not reach the API.", requestId: null, retryable: true },
      503,
    );

    renderList({ queues: undefined, error });

    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the API.");
  });

  it("invokes the delete action for the clicked queue", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderList({ onDelete });

    await user.click(screen.getByRole("button", { name: /delete orders/i }));

    expect(onDelete).toHaveBeenCalledWith("orders");
  });
});
