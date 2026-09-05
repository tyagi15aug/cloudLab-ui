import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-ink-faint">404</p>
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <Link to="/">
        <Button variant="secondary" size="sm">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
