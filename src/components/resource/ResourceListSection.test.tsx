import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import type { ResourceColumn } from "./ResourceTable";
import { ResourceListSection } from "./ResourceListSection";

interface Row {
  id: string;
  name: string;
}

const columns: ResourceColumn<Row>[] = [{ key: "name", header: "Name", render: (r) => r.name }];
const rows: Row[] = [{ id: "1", name: "alpha" }];
const noop = () => {};

describe("ResourceListSection", () => {
  it("shows a loading skeleton", () => {
    render(
      <ResourceListSection
        data={undefined}
        isLoading
        error={null}
        onRetry={noop}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="No rows"
      />,
    );

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows an error state with retry for a retryable error", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new ApiError(
      { code: "PROVIDER_UNAVAILABLE", message: "Could not reach the API.", requestId: null, retryable: true },
      503,
    );

    render(
      <ResourceListSection
        data={undefined}
        isLoading={false}
        error={error}
        onRetry={onRetry}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="No rows"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the API.");
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows the empty state with an optional action when there's no data", () => {
    render(
      <ResourceListSection
        data={[]}
        isLoading={false}
        error={null}
        onRetry={noop}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="No rows yet"
        emptyDescription="Add one to get started."
        emptyAction={<button type="button">Create</button>}
      />,
    );

    expect(screen.getByText("No rows yet")).toBeInTheDocument();
    expect(screen.getByText("Add one to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders the table once data is present", () => {
    render(
      <ResourceListSection
        data={rows}
        isLoading={false}
        error={null}
        onRetry={noop}
        columns={columns}
        rowKey={(r) => r.id}
        emptyTitle="No rows"
      />,
    );

    expect(screen.getByText("alpha")).toBeInTheDocument();
  });
});
