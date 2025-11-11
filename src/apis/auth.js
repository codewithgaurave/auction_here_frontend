// src/apis/auth.js
import http from "./http";

// POST /admin/login
export const adminLogin = async ({ adminId, password }) => {
  const { data } = await http.post("/admin/login", { adminId, password });
  // data = { message, admin: { adminId, name, token } }
  return data;
};
