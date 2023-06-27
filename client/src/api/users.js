import { httpClient } from "./httpClient";

/**
 * One module per API resource. Components and hooks call these functions and
 * never see axios, URLs or response envelopes.
 */
export const listUsers = async ({ page = 1, limit = 10 } = {}) => {
  const { data } = await httpClient.get("/users", { params: { page, limit } });

  return { users: data.data, pagination: data.pagination };
};

export const createUser = async (payload) => {
  const { data } = await httpClient.post("/users", payload);

  return data.data;
};

export const updateUser = async (id, payload) => {
  const { data } = await httpClient.put(`/users/${id}`, payload);

  return data.data;
};

/** The API answers DELETE with 204 No Content, so there is nothing to return. */
export const deleteUser = async (id) => {
  await httpClient.delete(`/users/${id}`);
};
