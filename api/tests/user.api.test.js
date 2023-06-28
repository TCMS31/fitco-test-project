import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";
import { User } from "../src/models/index.js";

import {
  closeDatabase,
  makeUser,
  makeUsers,
  resetDatabase,
  syncDatabase,
} from "./helpers/db.js";

const app = createApp();

const validPayload = {
  firstName: "Amelia",
  lastName: "Hartley",
  email: "amelia.hartley@fitco.example",
  password: "Passw0rd!123",
};

before(syncDatabase);
beforeEach(resetDatabase);
after(closeDatabase);

describe("GET /api/health", () => {
  it("reports the database as up", async () => {
    const res = await request(app).get("/api/health").expect(200);

    assert.deepEqual(res.body, { status: "ok", database: "up" });
  });
});

describe("POST /api/users", () => {
  it("creates a user and returns 201 with a Location header", async () => {
    const res = await request(app)
      .post("/api/users")
      .send(validPayload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, validPayload.email);
    assert.ok(Number.isInteger(res.body.data.id));
    assert.equal(res.headers.location, `/api/users/${res.body.data.id}`);
  });

  it("never returns the password or its hash", async () => {
    const res = await request(app).post("/api/users").send(validPayload);

    assert.equal("password" in res.body.data, false);
    assert.equal(
      JSON.stringify(res.body).includes(validPayload.password),
      false
    );
    assert.equal(JSON.stringify(res.body).includes("$2"), false);
  });

  it("stores the password as a bcrypt hash, not plaintext", async () => {
    await request(app).post("/api/users").send(validPayload).expect(201);

    const stored = await User.scope("withPassword").findOne({
      where: { email: validPayload.email },
    });

    assert.notEqual(stored.password, validPayload.password);
    assert.match(stored.password, /^\$2[aby]\$/);
  });

  it("normalises the email to lower case", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, email: "Amelia.Hartley@Fitco.Example" })
      .expect(201);

    assert.equal(res.body.data.email, "amelia.hartley@fitco.example");
  });

  it("rejects a missing password with 400 rather than a 500", async () => {
    const { password, ...withoutPassword } = validPayload;
    const res = await request(app)
      .post("/api/users")
      .send(withoutPassword)
      .expect(400);

    assert.equal(res.body.error.code, "bad_request");
    assert.ok(res.body.error.details.some((d) => d.field === "password"));
  });

  it("rejects a malformed email", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, email: "not-an-email" })
      .expect(400);

    assert.ok(res.body.error.details.some((d) => d.field === "email"));
  });

  it("rejects a short password", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, password: "short" })
      .expect(400);

    assert.ok(res.body.error.details.some((d) => d.field === "password"));
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/users").send(validPayload).expect(201);

    const res = await request(app)
      .post("/api/users")
      .send(validPayload)
      .expect(409);

    assert.equal(res.body.error.code, "conflict");
  });
});

describe("GET /api/users", () => {
  it("returns an empty page when there are no users", async () => {
    const res = await request(app).get("/api/users").expect(200);

    assert.deepEqual(res.body.data, []);
    assert.equal(res.body.pagination.total, 0);
    assert.equal(res.body.pagination.totalPages, 1);
  });

  it("paginates instead of returning the whole table", async () => {
    await makeUsers(30);

    const first = await request(app).get("/api/users?limit=10").expect(200);

    assert.equal(first.body.data.length, 10);
    assert.equal(first.body.pagination.total, 30);
    assert.equal(first.body.pagination.totalPages, 3);

    const third = await request(app)
      .get("/api/users?limit=10&page=3")
      .expect(200);

    assert.equal(third.body.data.length, 10);
    assert.notEqual(third.body.data[0].id, first.body.data[0].id);
  });

  it("caps limit at PAGE_MAX_LIMIT so a client cannot ask for everything", async () => {
    await makeUsers(5);

    const res = await request(app).get("/api/users?limit=100000").expect(400);

    assert.equal(res.body.error.code, "bad_request");
  });

  it("never includes password hashes in the list payload", async () => {
    await makeUsers(3);

    const res = await request(app).get("/api/users").expect(200);

    assert.equal(JSON.stringify(res.body).includes("$2"), false);
    for (const user of res.body.data) {
      assert.equal("password" in user, false);
    }
  });
});

describe("GET /api/users/:id", () => {
  it("returns the user", async () => {
    const user = await makeUser({ firstName: "Sofia" });

    const res = await request(app).get(`/api/users/${user.id}`).expect(200);

    assert.equal(res.body.data.firstName, "Sofia");
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/users/999999").expect(404);

    assert.equal(res.body.error.code, "not_found");
  });

  it("returns 400 for a non-numeric id", async () => {
    await request(app).get("/api/users/not-a-number").expect(400);
  });
});

describe("PUT /api/users/:id", () => {
  it("updates the user and returns the new representation", async () => {
    const user = await makeUser();

    const res = await request(app)
      .put(`/api/users/${user.id}`)
      .send({ firstName: "Renamed" })
      .expect(200);

    assert.equal(res.body.data.firstName, "Renamed");

    const reread = await request(app).get(`/api/users/${user.id}`).expect(200);
    assert.equal(reread.body.data.firstName, "Renamed");
  });

  // Regression: `User.update` resolves to `[affectedCount]`, and the original
  // controller did `if (updatedUser)` on that array. `[0]` is truthy, so
  // updating a non-existent user reported "User updated successfully" with 200.
  it("returns 404 when updating a user that does not exist", async () => {
    const res = await request(app)
      .put("/api/users/999999")
      .send({ firstName: "Ghost" })
      .expect(404);

    assert.equal(res.body.error.code, "not_found");
  });

  it("rehashes a new password rather than storing it verbatim", async () => {
    const user = await makeUser();

    await request(app)
      .put(`/api/users/${user.id}`)
      .send({ password: "BrandNewPass1!" })
      .expect(200);

    const stored = await User.scope("withPassword").findByPk(user.id);
    assert.notEqual(stored.password, "BrandNewPass1!");
    assert.match(stored.password, /^\$2[aby]\$/);
  });

  it("rejects an empty body", async () => {
    const user = await makeUser();

    await request(app).put(`/api/users/${user.id}`).send({}).expect(400);
  });

  it("rejects an email already taken by another user with 409", async () => {
    const [first, second] = await makeUsers(2);

    const res = await request(app)
      .put(`/api/users/${second.id}`)
      .send({ email: first.email })
      .expect(409);

    assert.equal(res.body.error.code, "conflict");
  });

  it("allows a user to keep their own email", async () => {
    const user = await makeUser();

    await request(app)
      .put(`/api/users/${user.id}`)
      .send({ email: user.email, firstName: "Same" })
      .expect(200);
  });
});

describe("DELETE /api/users/:id", () => {
  it("deletes the user and returns 204", async () => {
    const user = await makeUser();

    await request(app).delete(`/api/users/${user.id}`).expect(204);
    await request(app).get(`/api/users/${user.id}`).expect(404);
  });

  // Regression: the original controller returned 500 "Couldn't delete user"
  // when `User.destroy` resolved to 0, conflating "not found" with "broken".
  it("returns 404, not 500, when the user does not exist", async () => {
    const res = await request(app).delete("/api/users/999999").expect(404);

    assert.equal(res.body.error.code, "not_found");
  });
});

describe("error handling", () => {
  it("returns a JSON 404 for an unknown route", async () => {
    const res = await request(app).get("/api/nope").expect(404);

    assert.equal(res.body.success, false);
    assert.match(res.headers["content-type"], /application\/json/);
  });

  it("returns a JSON 400 for malformed JSON rather than an HTML stack trace", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Content-Type", "application/json")
      .send("{ not json");

    assert.equal(res.status, 400);
    assert.match(res.headers["content-type"], /application\/json/);
    assert.equal(res.body.success, false);
  });
});
