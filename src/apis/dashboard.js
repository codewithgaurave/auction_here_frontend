// src/apis/dashboard.js
import http from "./http";
import { getAdminToken } from "../utils/auth";

/**
 * GET /admin/dashboard/overview
 * @param {Object} params { range?: "30d"|"7d"|..., start?: ISO, end?: ISO, tzOffsetMinutes?: number }
 */
export const getAdminDashboard = async (params = {}) => {
  const token = getAdminToken();
  const { data } = await http.get("/admin/dashboard/overview", {
    params: {
      tzOffsetMinutes: new Date().getTimezoneOffset() * -1, // client tz offset (+330 for IST)
      ...params,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};
