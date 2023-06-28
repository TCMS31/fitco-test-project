import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPasswordHasher,
  passwordHasher,
  registerPasswordHasher,
} from "../src/lib/password/index.js";

describe("password hasher", () => {
  it("produces a bcrypt digest that verifies", async () => {
    const digest = await passwordHasher.hash("Passw0rd!");

    assert.match(digest, /^\$2[aby]\$/);
    assert.equal(await passwordHasher.verify("Passw0rd!", digest), true);
    assert.equal(await passwordHasher.verify("wrong", digest), false);
  });

  it("salts, so the same input hashes differently each time", async () => {
    const [a, b] = await Promise.all([
      passwordHasher.hash("Passw0rd!"),
      passwordHasher.hash("Passw0rd!"),
    ]);

    assert.notEqual(a, b);
  });

  it("lets a new algorithm be registered without touching callers", async () => {
    registerPasswordHasher("reverse-for-tests", () => ({
      name: "reverse-for-tests",
      hash: async (plaintext) => [...plaintext].reverse().join(""),
      verify: async (plaintext, digest) =>
        [...plaintext].reverse().join("") === digest,
    }));

    const hasher = createPasswordHasher("reverse-for-tests");

    assert.equal(hasher.name, "reverse-for-tests");
    assert.equal(await hasher.hash("abc"), "cba");
    assert.equal(await hasher.verify("abc", "cba"), true);
  });

  it("fails loudly for an unknown algorithm", () => {
    assert.throws(
      () => createPasswordHasher("argon2id"),
      /Unknown password hasher/
    );
  });
});
