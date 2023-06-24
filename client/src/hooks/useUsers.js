import { useCallback, useEffect, useState } from "react";

import * as usersApi from "../api/users";
import { toErrorMessage } from "../api/httpClient";

const EMPTY_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

/**
 * All user-list state and every network call live here, so the components stay
 * presentational. The list is always re-read from the server after a mutation:
 * the original client patched local state by hand and drifted out of sync
 * whenever the server normalised a value (it lower-cases emails, for example).
 */
export const useUsers = ({ pageSize = 10 } = {}) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const result = await usersApi.listUsers({ page, limit: pageSize });

      setUsers(result.users ?? []);
      setPagination(result.pagination ?? EMPTY_PAGINATION);
      setStatus("ready");
    } catch (caught) {
      setError(toErrorMessage(caught));
      setStatus("error");
    }
  }, [page, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runMutation = useCallback(
    async (operation) => {
      try {
        await operation();
        await refresh();

        return { ok: true };
      } catch (caught) {
        return { ok: false, error: toErrorMessage(caught) };
      }
    },
    [refresh]
  );

  const saveUser = useCallback(
    (draft) =>
      runMutation(() =>
        draft.id
          ? usersApi.updateUser(draft.id, {
              firstName: draft.firstName,
              lastName: draft.lastName,
              email: draft.email,
            })
          : usersApi.createUser(draft)
      ),
    [runMutation]
  );

  const removeUser = useCallback(
    (id) => runMutation(() => usersApi.deleteUser(id)),
    [runMutation]
  );

  const goToPage = useCallback(
    (next) => setPage((current) => (next === current ? current : next)),
    []
  );

  return {
    users,
    pagination,
    page,
    status,
    error,
    refresh,
    saveUser,
    removeUser,
    goToPage,
  };
};
