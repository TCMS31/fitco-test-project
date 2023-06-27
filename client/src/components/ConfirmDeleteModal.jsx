import { useEffect, useState } from "react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";

export const ConfirmDeleteModal = ({ user, onCancel, onConfirm }) => {
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setError(null);
    setDeleting(false);
  }, [user]);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);

    const result = await onConfirm(user);

    setDeleting(false);

    if (result?.ok) {
      onCancel();
    } else {
      setError(result?.error ?? "Could not delete the user");
    }
  };

  return (
    <Modal show={Boolean(user)} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Delete user</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? (
          <Alert variant="danger" className="py-2 small">
            {error}
          </Alert>
        ) : null}

        <p className="mb-0">
          Delete{" "}
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>{" "}
          ({user?.email})? This cannot be undone.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="light" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>

        <Button variant="danger" onClick={handleConfirm} disabled={deleting}>
          {deleting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Deleting
            </>
          ) : (
            "Delete user"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
