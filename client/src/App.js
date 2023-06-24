import { useState } from "react";
import { Button, Container } from "react-bootstrap";

import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { Pager } from "./components/Pager";
import { StatusPanel } from "./components/StatusPanel";
import { UserFormModal } from "./components/UserFormModal";
import { UserTable } from "./components/UserTable";
import { useUsers } from "./hooks/useUsers";

const PAGE_SIZE = 10;

function App() {
  const {
    users,
    pagination,
    status,
    error,
    refresh,
    saveUser,
    removeUser,
    goToPage,
  } = useUsers({ pageSize: PAGE_SIZE });

  const [formUser, setFormUser] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState(null);

  const openCreate = () => {
    setFormUser(null);
    setIsFormOpen(true);
  };

  const openEdit = (user) => {
    setFormUser(user);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormUser(null);
  };

  const hasUsers = status === "ready" && users.length > 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <Container className="d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-2">
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span className="fw-semibold">Fitco Admin</span>
          </div>

          <span className="small text-muted">User management</span>
        </Container>
      </header>

      <Container as="main" className="py-4">
        <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h4 mb-1">Users</h1>
            <p className="text-muted small mb-0">
              {status === "ready"
                ? `${pagination.total} registered ${
                    pagination.total === 1 ? "user" : "users"
                  }`
                : " "}
            </p>
          </div>

          <Button onClick={openCreate}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Add user
          </Button>
        </div>

        <div className="card shadow-sm border-0 overflow-hidden">
          {hasUsers ? (
            <>
              <UserTable
                users={users}
                onEdit={openEdit}
                onDelete={setUserPendingDelete}
              />
              <Pager pagination={pagination} onChange={goToPage} />
            </>
          ) : (
            <StatusPanel
              status={status}
              error={error}
              onRetry={refresh}
              onAdd={openCreate}
            />
          )}
        </div>
      </Container>

      <UserFormModal
        show={isFormOpen}
        selectedUser={formUser}
        onClose={closeForm}
        onSave={saveUser}
      />

      <ConfirmDeleteModal
        user={userPendingDelete}
        onCancel={() => setUserPendingDelete(null)}
        onConfirm={(user) => removeUser(user.id)}
      />
    </div>
  );
}

export default App;
