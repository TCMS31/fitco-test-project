import { Button } from "react-bootstrap";

/**
 * The API pages its results, so the client has to as well. Rendering the whole
 * table in one request was the original behaviour and does not survive a real
 * user table.
 */
export const Pager = ({ pagination, onChange }) => {
  const { page, limit, total, totalPages } = pagination;

  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
      <span className="small text-muted">
        Showing <strong>{first}</strong>&ndash;<strong>{last}</strong> of{" "}
        <strong>{total}</strong> users
      </span>

      <div className="d-flex align-items-center gap-2">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>

        <span className="small text-muted">
          Page {page} of {totalPages}
        </span>

        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
