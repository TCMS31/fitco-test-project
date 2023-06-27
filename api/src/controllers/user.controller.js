import { userService } from "../services/user.service.js";

/**
 * HTTP adapter only: read the (already validated) request, call the service,
 * choose a status code. No business logic, no ORM calls, no hashing.
 */
export const listUsers = async (req, res) => {
  const { items, pagination } = await userService.listUsers(
    req.validatedQuery ?? {}
  );

  res.status(200).json({ success: true, data: items, pagination });
};

export const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({ success: true, data: user });
};

export const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).location(`/api/users/${user.id}`).json({
    success: true,
    data: user,
  });
};

export const updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(200).json({ success: true, data: user });
};

export const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(204).send();
};
