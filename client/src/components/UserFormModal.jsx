import { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

const BLANK = { firstName: "", lastName: "", email: "", password: "" };

const toDraft = (user) =>
  user
    ? {
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        password: "",
      }
    : { ...BLANK };

/**
 * Create and edit share one form. `selectedUser` is the single source of truth
 * for which mode we are in -- the original kept a separate `isUserUpdating`
 * flag that was never reset on close, so the next "Add User" submitted a PUT to
 * /users/undefined.
 */
export const UserFormModal = ({ show, selectedUser, onClose, onSave }) => {
  const [draft, setDraft] = useState(toDraft(null));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(selectedUser);

  useEffect(() => {
    if (show) {
      setDraft(toDraft(selectedUser));
      setError(null);
      setSaving(false);
    }
  }, [show, selectedUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setDraft((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await onSave(draft);

    setSaving(false);

    if (result?.ok) {
      onClose();
    } else {
      setError(result?.error ?? "Could not save the user");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isEditing ? "Edit user" : "Add user"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error ? (
            <Alert variant="danger" className="py-2 small">
              {error}
            </Alert>
          ) : null}

          <Row className="g-3">
            <Col sm={6}>
              <Form.Group controlId="firstName">
                <Form.Label>First name</Form.Label>
                <Form.Control
                  name="firstName"
                  value={draft.firstName}
                  onChange={handleChange}
                  placeholder="Amelia"
                  autoComplete="given-name"
                  required
                />
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="lastName">
                <Form.Label>Last name</Form.Label>
                <Form.Control
                  name="lastName"
                  value={draft.lastName}
                  onChange={handleChange}
                  placeholder="Hartley"
                  autoComplete="family-name"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={draft.email}
                  onChange={handleChange}
                  placeholder="amelia.hartley@fitco.example"
                  autoComplete="email"
                  required
                />
              </Form.Group>
            </Col>

            {isEditing ? null : (
              <Col xs={12}>
                <Form.Group controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={draft.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <Form.Text className="text-muted">
                    At least 8 characters. Stored only as a bcrypt hash.
                  </Form.Text>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving
              </>
            ) : (
              <>{isEditing ? "Save changes" : "Create user"}</>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
