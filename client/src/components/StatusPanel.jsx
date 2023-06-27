import { Button, Spinner } from "react-bootstrap";

/**
 * Loading, error and empty are first-class states. The original table rendered
 * a bare header row for all three, so a failed request looked identical to an
 * empty database.
 */
export const StatusPanel = ({ status, error, onRetry, onAdd }) => {
  if (status === "loading") {
    return (
      <div className="status-panel" role="status" aria-live="polite">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 mb-0 text-muted">Loading users&hellip;</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="status-panel" role="alert">
        <i className="bi bi-exclamation-triangle status-icon text-danger" />
        <h2 className="h6 mt-3 mb-1">Could not load users</h2>
        <p className="text-muted small mb-3">{error}</p>
        <Button variant="outline-primary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="status-panel">
      <i className="bi bi-people status-icon text-secondary" />
      <h2 className="h6 mt-3 mb-1">No users yet</h2>
      <p className="text-muted small mb-3">
        Add the first user to get started.
      </p>
      <Button variant="primary" size="sm" onClick={onAdd}>
        Add user
      </Button>
    </div>
  );
};
