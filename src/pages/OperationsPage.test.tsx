import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { OperationMetrics, OperationResource } from "../api/types";
import { server } from "../test/mocks/server";
import { renderWithProviders } from "../test/utils";
import { OperationsPage } from "./OperationsPage";

const sampleOperation: OperationResource = {
  id: 1,
  service: "s3",
  operation: "CreateBucket",
  provider: "test",
  status: "success",
  duration_ms: 12.5,
  request_id: "req-abc",
  resource: "demo-bucket",
  error: null,
  retryable: null,
  timestamp: 1_800_000_000,
};

const sampleMetrics: OperationMetrics = {
  total_count: 4,
  error_count: 1,
  error_rate: 0.25,
  avg_duration_ms: 15.5,
  by_operation: [{ service: "s3", operation: "CreateBucket", count: 4, error_count: 1, avg_duration_ms: 15.5 }],
};

describe("OperationsPage", () => {
  it("renders an empty history state with zeroed metrics", async () => {
    renderWithProviders(<OperationsPage />);

    expect(await screen.findByText(/no operations recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText("Total requests")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear history" })).toBeDisabled();
  });

  it("lists recorded operations with status, duration, and resource", async () => {
    server.use(
      http.get("/api/dev/operations", () => HttpResponse.json({ items: [sampleOperation] })),
      http.get("/api/dev/operations/metrics", () => HttpResponse.json(sampleMetrics)),
    );

    renderWithProviders(<OperationsPage />);

    const row = await screen.findByRole("row", { name: /CreateBucket/ });
    expect(within(row).getByText("demo-bucket")).toBeInTheDocument();
    expect(within(row).getByText("12.5ms")).toBeInTheDocument();
    expect(within(row).getByText("OK")).toBeInTheDocument();

    expect(screen.getByText("4")).toBeInTheDocument(); // total requests
    expect(screen.getByText("25%")).toBeInTheDocument(); // error rate
  });

  it("shows an operation's error code as its status badge", async () => {
    const failed: OperationResource = {
      ...sampleOperation,
      id: 2,
      status: "error",
      error: "THROTTLED",
      retryable: true,
    };
    server.use(http.get("/api/dev/operations", () => HttpResponse.json({ items: [failed] })));

    renderWithProviders(<OperationsPage />);

    const row = await screen.findByRole("row", { name: /CreateBucket/ });
    expect(within(row).getByText("THROTTLED")).toBeInTheDocument();
  });

  it("opens a detail dialog with the full record when Details is clicked", async () => {
    server.use(http.get("/api/dev/operations", () => HttpResponse.json({ items: [sampleOperation] })));

    const user = userEvent.setup();
    renderWithProviders(<OperationsPage />);

    await screen.findByRole("row", { name: /CreateBucket/ });
    await user.click(screen.getByRole("button", { name: "Details" }));

    const dialog = screen.getByRole("dialog", { name: "Operation detail" });
    expect(within(dialog).getByText("req-abc")).toBeInTheDocument();
    expect(within(dialog).getByText("demo-bucket")).toBeInTheDocument();
  });

  it("clears history via Clear history", async () => {
    let items: OperationResource[] = [sampleOperation];
    server.use(
      http.get("/api/dev/operations", () => HttpResponse.json({ items })),
      http.delete("/api/dev/operations", () => {
        items = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OperationsPage />);

    await screen.findByRole("row", { name: /CreateBucket/ });
    await user.click(screen.getByRole("button", { name: "Clear history" }));

    await waitFor(() => expect(screen.getByText(/no operations recorded yet/i)).toBeInTheDocument());
  });
});
