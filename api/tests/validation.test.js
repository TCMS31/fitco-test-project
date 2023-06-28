import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../src/validation/user.schema.js";

const base = {
  firstName: "Amelia",
  lastName: "Hartley",
  email: "amelia@fitco.example",
  password: "Passw0rd!123",
};

describe("createUserSchema", () => {
  it("trims names and lower-cases the email", () => {
    const parsed = createUserSchema.parse({
      ...base,
      firstName: "  Amelia  ",
      email: "  Amelia@Fitco.Example ",
    });

    assert.equal(parsed.firstName, "Amelia");
    assert.equal(parsed.email, "amelia@fitco.example");
  });

  it("rejects whitespace-only names", () => {
    assert.equal(
      createUserSchema.safeParse({ ...base, firstName: "   " }).success,
      false
    );
  });

  it("rejects a password longer than bcrypt's 72-byte input limit", () => {
    assert.equal(
      createUserSchema.safeParse({ ...base, password: "a".repeat(73) }).success,
      false
    );
  });
});

describe("updateUserSchema", () => {
  it("accepts a single field", () => {
    assert.equal(
      updateUserSchema.safeParse({ firstName: "Nia" }).success,
      true
    );
  });

  it("rejects an empty patch", () => {
    assert.equal(updateUserSchema.safeParse({}).success, false);
  });
});

describe("idParamSchema", () => {
  it("coerces a numeric string to a number", () => {
    assert.equal(idParamSchema.parse({ id: "42" }).id, 42);
  });

  it("rejects zero, negatives and non-numbers", () => {
    for (const id of ["0", "-3", "abc", "1.5"]) {
      assert.equal(
        idParamSchema.safeParse({ id }).success,
        false,
        `accepted ${id}`
      );
    }
  });
});

describe("listUsersQuerySchema", () => {
  it("defaults page to 1 and leaves limit unset", () => {
    const parsed = listUsersQuerySchema.parse({});

    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, undefined);
  });

  it("rejects a limit above the hard ceiling", () => {
    assert.equal(
      listUsersQuerySchema.safeParse({ limit: "101" }).success,
      false
    );
  });
});
