import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { CreateFailureRuleRequest, FailureRuleResource } from "../api/types";
import { server } from "../test/mocks/server";
import { renderWithProviders } from "../test/utils";
import { DeveloperToolsPage } from "./DeveloperToolsPage";

describe("DeveloperToolsPage", () => {
  it("renders the injection form and an empty active-rules state", async () => {
    renderWithProviders(<DeveloperToolsPage />);

    expect(screen.getByRole("heading", { name: "Inject a failure" })).toBeInTheDocument();
    expect(await screen.findByText(/no active failure rules/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
  });

  it("changing the service resets the operation options to that service's list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolsPage />);

    await user.selectOptions(screen.getByLabelText("Service"), "sqs");

    const operationSelect = screen.getByLabelText("Operation") as HTMLSelectElement;
    expect(operationSelect.value).toBe("*");
    expect(within(operationSelect).getByRole("option", { name: "SendMessage" })).toBeInTheDocument();
    expect(within(operationSelect).queryByRole("option", { name: "CreateBucket" })).not.toBeInTheDocument();
  });

  it("creates a rule and lists it with its hit count, then deletes it", async () => {
    let rules: FailureRuleResource[] = [];
    server.use(
      http.get("/api/dev/failures", () => HttpResponse.json({ items: rules })),
      http.post("/api/dev/failures", async ({ request }) => {
        const body = (await request.json()) as CreateFailureRuleRequest;
        const rule: FailureRuleResource = {
          id: "fr-1",
          service: body.service,
          operation: body.operation,
          failure: body.failure,
          delay_ms: body.delay_ms ?? 0,
          probability: body.probability ?? 1,
          hit_count: 0,
        };
        rules = [...rules, rule];
        return HttpResponse.json(rule, { status: 201 });
      }),
      http.delete("/api/dev/failures/:id", ({ params }) => {
        rules = rules.filter((r) => r.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolsPage />);

    await screen.findByText(/no active failure rules/i);

    await user.selectOptions(screen.getByLabelText("Service"), "s3");
    await user.selectOptions(screen.getByLabelText("Operation"), "CreateBucket");
    await user.selectOptions(screen.getByLabelText("Failure type"), "http_500");
    await user.click(screen.getByRole("button", { name: "Inject failure" }));

    const row = await screen.findByRole("row", { name: /CreateBucket/ });
    expect(within(row).getByText("s3")).toBeInTheDocument();
    expect(within(row).getByText("HTTP 500")).toBeInTheDocument();
    expect(within(row).getByText("100%")).toBeInTheDocument();
    expect(within(row).getByText("0")).toBeInTheDocument(); // hit count

    expect(screen.getByRole("button", { name: "Clear all" })).toBeEnabled();

    await user.click(within(row).getByRole("button", { name: /delete rule/i }));
    await waitFor(() => expect(screen.getByText(/no active failure rules/i)).toBeInTheDocument());
  });

  it("shows a server error and does not clear the form on a failed create", async () => {
    server.use(
      http.post("/api/dev/failures", () => {
        return HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Unknown failure type.",
              requestId: "req-1",
              retryable: false,
            },
          },
          { status: 422 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolsPage />);

    await user.click(screen.getByRole("button", { name: "Inject failure" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/unknown failure type/i);
  });

  it("clears every rule via Clear all", async () => {
    let rules: FailureRuleResource[] = [
      {
        id: "fr-1",
        service: "s3",
        operation: "*",
        failure: "http_500",
        delay_ms: 0,
        probability: 1,
        hit_count: 2,
      },
    ];
    server.use(
      http.get("/api/dev/failures", () => HttpResponse.json({ items: rules })),
      http.delete("/api/dev/failures", () => {
        rules = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolsPage />);

    await screen.findByText("HTTP 500");
    await user.click(screen.getByRole("button", { name: "Clear all" }));

    await waitFor(() => expect(screen.getByText(/no active failure rules/i)).toBeInTheDocument());
  });
});
