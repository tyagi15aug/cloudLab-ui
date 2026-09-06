import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ResourceColumn } from "./ResourceTable";
import { ResourceTable } from "./ResourceTable";

interface Row {
  id: string;
  name: string;
  count: number;
}

const columns: ResourceColumn<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
  { key: "count", header: "Count", render: (r) => r.count, align: "right" },
];

const rows: Row[] = [
  { id: "1", name: "alpha", count: 3 },
  { id: "2", name: "beta", count: 7 },
];

describe("ResourceTable", () => {
  it("renders a header per column and a row per item", () => {
    render(<ResourceTable columns={columns} rows={rows} rowKey={(r) => r.id} />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Count" })).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("omits the Actions column when renderActions is not provided", () => {
    render(<ResourceTable columns={columns} rows={rows} rowKey={(r) => r.id} />);

    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("adds a trailing Actions column and wires it per row", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <ResourceTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        renderActions={(r) => (
          <button type="button" onClick={() => onDelete(r.id)}>
            Delete {r.name}
          </button>
        )}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete beta" }));
    expect(onDelete).toHaveBeenCalledWith("2");
  });
});
