// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  FaGavel,
  FaDollarSign,
  FaBox,
  FaTrophy,
  FaChartPie,
  FaClock,
  FaHistory,
  FaCog,
  FaPlus,
  FaChartBar,
  FaCalendarAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../apis/dashboard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ---------- helpers ----------
const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "-";
const fmtMoney = (n) =>
  typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "-";
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString() : "-";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#7E57C2", "#26A69A", "#EC407A"];

// map trend array -> recharts-friendly
const mapTrend = (arr = []) =>
  arr.map((d) => ({
    date: fmtDate(d.date),
    count: d.count,
  }));

const LoadingCard = ({ themeColors, height = 120 }) => (
  <div
    className="rounded-xl border animate-pulse"
    style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, height }}
  />
);

export default function Dashboard() {
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  // query state
  const [range, setRange] = useState("30d"); // "7d" | "30d" | "90d" | "180d"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  // keep your original demo lists (as requested)
  const upcomingAuctions = [
    { title: "Vintage Watch Collection", time: "02:00 PM", date: "Today" },
    { title: "Classic Car Auction", time: "04:30 PM", date: "Today" },
    { title: "Art Gallery Sale", time: "11:00 AM", date: "Tomorrow" },
  ];
  const recentBids = [
    { user: "Sarah Johnson", item: "Vintage Rolex", amount: "₹2,450", time: "2 hours ago" },
    { user: "Mike Chen", item: "Abstract Painting", amount: "₹1,850", time: "3 hours ago" },
    { user: "Emily Davis", item: "Sports Car", amount: "₹45,000", time: "5 hours ago" },
  ];
  const quickActions = [
    { label: "Create Auction", icon: FaPlus, color: themeColors.primary, to: "/auctions/create" },
    { label: "Place Bid", icon: FaGavel, color: themeColors.success, to: "/bids" },
    { label: "View Reports", icon: FaChartBar, color: themeColors.info, to: "/reports" },
    { label: "Schedule Auction", icon: FaCalendarAlt, color: themeColors.warning, to: "/auctions/calendar" },
  ];

  // fetcher
  const fetchData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await getAdminDashboard({ range });
      setData(res);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // derived
  const summaryCards = useMemo(() => {
    const s = data?.summary;
    const subsPeriod = data?.subscriptions?.period;
    return [
      {
        title: "Live/Upcoming",
        value: fmtNum(data?.summary?.auctions?.active ?? 0),
        icon: FaGavel,
        description: "Active auctions",
      },
      {
        title: "Total Bids",
        value: fmtNum(s?.bids?.total ?? 0),
        icon: FaDollarSign,
        description: "All-time valid bids",
      },
      {
        title: "Total Lots",
        value: fmtNum(s?.lots?.total ?? 0),
        icon: FaBox,
        description: "Lots in system",
      },
      {
        title: "Revenue (Period)",
        value: fmtMoney(data?.subscriptions ? data.subscriptions.period.revenue : 0),
        icon: FaTrophy,
        description: `Last ${range}`,
      },
    ];
  }, [data, range]);

  const auctionStatus = useMemo(
    () => (data?.auctions?.statusBreakdown || []).map((x, i) => ({ name: x.status, value: x.count, color: COLORS[i % COLORS.length] })),
    [data]
  );
  const bidsTrend = useMemo(() => mapTrend(data?.bids?.dailyTrend || []), [data]);
  const salesTrend = useMemo(() => mapTrend(data?.subscriptions?.salesTrend || []), [data]);

  const topLotsByBids = data?.bids?.topLotsByBids || [];
  const revenueByPlan = data?.subscriptions?.revenueByPlan || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
            Auction Dashboard
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Welcome to your auction management portal
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="180d">Last 180 days</option>
          </select>
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
            title="Refresh"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Errors */}
      {err && (
        <div
          className="p-3 rounded-lg border text-sm"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          {err}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} themeColors={themeColors} />)
          : summaryCards.map((stat, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg group"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1 opacity-75" style={{ color: themeColors.text }}>
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mb-2" style={{ color: themeColors.primary }}>
                      {stat.value}
                    </p>
                    <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                      {stat.description}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: themeColors.primary + "15" }}>
                    <stat.icon className="text-lg" style={{ color: themeColors.primary }} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pie: Auction status */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: themeColors.text }}>
            <FaChartPie className="mr-2" />
            Auction Status Split
          </h2>
          <div style={{ width: "100%", height: 280 }}>
            {loading ? (
              <LoadingCard themeColors={themeColors} height={240} />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={auctionStatus} dataKey="value" nameKey="name" outerRadius={100} label>
                    {auctionStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Line: Bids daily trend */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: themeColors.text }}>
            <FaChartBar className="mr-2" />
            Bids Per Day
          </h2>
          <div style={{ width: "100%", height: 280 }}>
            {loading ? (
              <LoadingCard themeColors={themeColors} height={240} />
            ) : (
              <ResponsiveContainer>
                <LineChart data={bidsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar: Subscriptions sales trend */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: themeColors.text }}>
            <FaChartBar className="mr-2" />
            Plan Purchases Per Day
          </h2>
          <div style={{ width: "100%", height: 280 }}>
            {loading ? (
              <LoadingCard themeColors={themeColors} height={240} />
            ) : (
              <ResponsiveContainer>
                <BarChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Lots by Bids */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: themeColors.text }}>
            <FaGavel className="mr-2" />
            Top Lots (by Bid Count)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background + "30" }}>
                  {["Lot", "Auction", "Bids", "Current Bid", "Last Bid"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5}><LoadingCard themeColors={themeColors} height={40} /></td>
                      </tr>
                    ))
                  : topLotsByBids.map((r) => (
                      <tr key={r.lotId}>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{r.lotName || r.lotId}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{r.auctionId}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: themeColors.primary }}>{fmtNum(r.bids)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{fmtMoney(r.currentBid)}</td>
                        <td className="px-4 py-3 text-xs opacity-70" style={{ color: themeColors.text }}>{fmtDate(r.lastBidAt)}</td>
                      </tr>
                    ))}
                {!loading && topLotsByBids.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: themeColors.text }}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: themeColors.text }}>
            <FaDollarSign className="mr-2" />
            Revenue by Plan (Range)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background + "30" }}>
                  {["Plan", "User Type", "Price", "Sold", "Revenue"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: themeColors.text }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5}><LoadingCard themeColors={themeColors} height={40} /></td>
                      </tr>
                    ))
                  : revenueByPlan.map((p) => (
                      <tr key={p.planId}>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{p.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{p.userType}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{fmtMoney(p.price)}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: themeColors.primary }}>{fmtNum(p.count)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>{fmtMoney(p.revenue)}</td>
                      </tr>
                    ))}
                {!loading && revenueByPlan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: themeColors.text }}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== KEEP THESE SECTIONS (as you asked) ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bids (you asked to keep) */}
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center"
            style={{ color: themeColors.text }}
          >
            <FaHistory className="mr-2" />
            Recent Bids
          </h2>
          <div className="space-y-3">
            {recentBids.map((bid, index) => (
              <div
                key={index}
                className="flex items-start py-2 group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: themeColors.primary + "15" }}
                >
                  <FaDollarSign
                    className="text-xs"
                    style={{ color: themeColors.primary }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: themeColors.text }}>
                    <span className="font-medium">{bid.user}</span> bid {bid.amount} on {bid.item}
                  </p>
                  <p className="text-xs mt-1 opacity-60" style={{ color: themeColors.text }}>
                    {bid.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (keep + add routes) */}
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center"
            style={{ color: themeColors.text }}
          >
            <FaCog className="mr-2" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="p-4 rounded-lg text-center transition-all duration-200 hover:shadow-md border group flex flex-col items-center justify-center"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = themeColors.border;
                }}
                onClick={() => navigate(action.to)}
              >
                <action.icon
                  className="text-xl mb-2 group-hover:scale-110 transition-transform duration-200"
                  style={{ color: action.color }}
                />
                <div className="text-xs font-medium">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Auctions (kept) */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <h2
          className="text-lg font-semibold mb-4 flex items-center"
          style={{ color: themeColors.text }}
        >
          <FaClock className="mr-2" />
          Upcoming Auctions
        </h2>
        <div className="space-y-3">
          {upcomingAuctions.map((auction, index) => (
            <div
              key={index}
              className="flex items-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                style={{ backgroundColor: themeColors.primary + "15" }}
              >
                <FaGavel className="text-sm" style={{ color: themeColors.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: themeColors.text }}>
                  {auction.title}
                </p>
                <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                  {auction.time} • {auction.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
