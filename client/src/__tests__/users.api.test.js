import MockAdapter from "axios-mock-adapter";

import { httpClient } from "../api/httpClient";
import { createUser, deleteUser, listUsers, updateUser } from "../api/users";

let mock;

beforeEach(() => {
  mock = new MockAdapter(httpClient);
});

afterEach(() => {
  mock.restore();
});

const page = {
  success: true,
  data: [
    { id: 1, firstName: "Amelia", lastName: "Hartley", email: "a@f.example" },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("users API", () => {
  it("requests a bounded page and unwraps the envelope", async () => {
    mock.onGet("/users").reply((config) => {
      expect(config.params).toEqual({ page: 2, limit: 10 });

      return [200, page];
    });

    const result = await listUsers({ page: 2, limit: 10 });

    expect(result.users).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("defaults to page 1 with a bounded limit", async () => {
    mock.onGet("/users").reply((config) => {
      expect(config.params).toEqual({ page: 1, limit: 10 });

      return [200, page];
    });

    await listUsers();
  });

  it("returns the created user from the envelope", async () => {
    mock.onPost("/users").reply(201, { success: true, data: { id: 9 } });

    await expect(createUser({ firstName: "A" })).resolves.toEqual({ id: 9 });
  });

  it("sends a PUT to the right id", async () => {
    mock.onPut("/users/7").reply(200, { success: true, data: { id: 7 } });

    await expect(updateUser(7, { firstName: "B" })).resolves.toEqual({ id: 7 });
  });

  it("tolerates the 204 No Content delete response", async () => {
    mock.onDelete("/users/7").reply(204);

    await expect(deleteUser(7)).resolves.toBeUndefined();
  });

  it("rejects when the API returns an error status", async () => {
    mock.onPost("/users").reply(409, {
      success: false,
      error: {
        code: "conflict",
        message: "A user with that email already exists",
      },
    });

    await expect(createUser({})).rejects.toBeDefined();
  });
});
