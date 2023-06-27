import Table from "react-bootstrap/Table";

const initials = (user) =>
  `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

/**
 * Presentational only: it renders rows and raises intent upwards. It holds no
 * state and makes no network calls.
 */
export const UserTable = ({ users, onEdit, onDelete }) => (
  <Table hover responsive className="align-middle user-table mb-0">
    <thead>
      <tr>
        <th scope="col" className="ps-3">
          ID
        </th>
        <th scope="col">Name</th>
        <th scope="col">Email</th>
        <th scope="col" className="text-end pe-3">
          Actions
        </th>
      </tr>
    </thead>

    <tbody>
      {users.map((user) => (
        <tr key={user.id}>
          <td className="ps-3 text-muted font-monospace">{user.id}</td>

          <td>
            <div className="d-flex align-items-center gap-2">
              <span className="user-avatar" aria-hidden="true">
                {initials(user)}
              </span>
              <span className="fw-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </td>

          <td className="text-muted">{user.email}</td>

          <td className="text-end pe-3">
            <div className="d-inline-flex gap-1">
              <button
                type="button"
                className="btn btn-sm btn-icon"
                onClick={() => onEdit(user)}
                aria-label={`Edit ${user.firstName} ${user.lastName}`}
              >
                <i className="bi bi-pencil" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn btn-sm btn-icon btn-icon-danger"
                onClick={() => onDelete(user)}
                aria-label={`Delete ${user.firstName} ${user.lastName}`}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);
