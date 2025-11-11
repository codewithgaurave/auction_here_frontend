// src/apis/users.js
import http from "./http";

/** GET /users/list -> { count, users: [...] } */
export const listUsers = async () => {
  const { data } = await http.get("/users/list");
  return data; // { count, users }
};

/** PATCH /users/status/:userId  body: { registrationStatus } */
export const updateUserStatus = async (userId, registrationStatus) => {
  const { data } = await http.patch(`/users/status/${userId}`, {
    registrationStatus,
  });
  return data;
};
