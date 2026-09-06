import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DeveloperToolsPage } from "./pages/DeveloperToolsPage";
import { DynamoDbPage } from "./pages/DynamoDbPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QueueDetailPage } from "./pages/QueueDetailPage";
import { S3Page } from "./pages/S3Page";
import { SqsPage } from "./pages/SqsPage";
import { TableDetailPage } from "./pages/TableDetailPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="s3" element={<S3Page />} />
        <Route path="sqs" element={<SqsPage />} />
        <Route path="sqs/:name" element={<QueueDetailPage />} />
        <Route path="dynamodb" element={<DynamoDbPage />} />
        <Route path="dynamodb/:name" element={<TableDetailPage />} />
        <Route path="dev/failures" element={<DeveloperToolsPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
