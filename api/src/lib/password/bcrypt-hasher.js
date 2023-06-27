import bcrypt from "bcryptjs";

export const createBcryptHasher = ({ rounds }) => ({
  name: "bcrypt",
  hash: (plaintext) => bcrypt.hash(plaintext, rounds),
  verify: (plaintext, digest) => bcrypt.compare(plaintext, digest),
});
