// src/routes/index.js
import { lazy } from "react";
import { FaCoins, FaUsers, FaBox, FaGavel, FaTachometerAlt } from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Users = lazy(() => import("../pages/Users"));
const Auctions = lazy(() => import("../pages/Auctions"));
const Lots = lazy(() => import("../pages/Lots"));
const Bids = lazy(() => import("../pages/Bids"));
const Plans = lazy(() => import("../pages/Plans"));
const Purchases = lazy(() => import("../pages/Purchases")); // ✅ add

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt },
  { path: "/users", component: Users, name: "Users", icon: FaUsers },
  { path: "/auctions", component: Auctions, name: "Auctions", icon: FaGavel },
  { path: "/lots", component: Lots, name: "Lots", icon: FaBox },
  { path: "/bids", component: Bids, name: "Bids", icon: FaCoins },
  { path: "/plans", component: Plans, name: "Plans", icon: FaCoins },
  { path: "/purchases", component: Purchases, name: "Purchases", icon: FaCoins }, // ✅ new
];

export default routes;
