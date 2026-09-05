import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { BucketList } from "./BucketList";

const buckets = [
  { id: "a", name: "a", region: "us-east-1", created_at: "2026-01-01T00:00:00Z", tags: {} },
  { id: "b", name: "b", region: "us-west-2", created_at: null, tags: {} },
];

const noop = () => {};

describe("BucketList", () => {
  it("renders buckets", () => {
    render(
      <BucketList
        buckets={buckets}
        isLoading={false}
        error={null}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
      />,
    );

    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("us-east-1")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <BucketList
        buckets={[]}
        isLoading={false}
        error={null}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
      />,
    );

    expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
  });

  it("displays loading state", () => {
    render(
      <BucketList
        buckets={undefined}
        isLoading={true}
        error={null}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
      />,
    );

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("displays API failure", () => {
    const error = new ApiError(
      { code: "PROVIDER_UNAVAILABLE", message: "Could not reach the API.", requestId: "abc123", retryable: true },
      503,
    );

    render(
      <BucketList
        buckets={undefined}
        isLoading={false}
        error={error}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the API.");
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("does not show a retry action for a non-retryable error", () => {
    const error = new ApiError(
      { code: "ACCESS_DENIED", message: "Not allowed.", requestId: null, retryable: false },
      403,
    );

    render(
      <BucketList
        buckets={undefined}
        isLoading={false}
        error={error}
        onRetry={noop}
        onDelete={noop}
        onCreateClick={noop}
      />,
    );

    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("invokes delete action", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <BucketList
        buckets={buckets}
        isLoading={false}
        error={null}
        onRetry={noop}
        onDelete={onDelete}
        onCreateClick={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete a/i }));

    expect(onDelete).toHaveBeenCalledWith("a");
  });
});
