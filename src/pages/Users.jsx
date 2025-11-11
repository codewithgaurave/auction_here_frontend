// src/pages/Users.jsx
import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import {
  FaEye,
  FaUser,
  FaUserCheck,
  FaUserSlash,
  FaUserTimes,
  FaCalendar,
  FaGavel,
  FaBox,
  FaTh,
  FaList,
  FaChevronDown,
  FaCheck,
  FaSearch,
  FaFilter,
  FaToggleOn,
  FaToggleOff,
  FaTrophy,
} from "react-icons/fa";
import { listUsers, updateUserStatus } from "../apis/users";

const STATUS_OPTIONS = ["pending", "under verification", "approved", "rejected"];
const USER_TYPES = ["Buyer", "Seller"];

/* -------------------------------------------
   UI helpers: Badge + Portal Select (with flip)
------------------------------------------- */

const StatusBadge = ({ text, color }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
    style={{ backgroundColor: color + "25", color }}
  >
    {text}
  </span>
);

// Dropdown rendered in a portal to escape overflow; flips up if space below is less
const StatusSelect = ({
  themeColors,
  value,
  onChange,
  getStatusColor,
  getStatusIcon,
  disabled,
  size = "md", // 'sm' | 'md'
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0, place: "bottom" });

  const CurrentIcon = getStatusIcon(value);
  const basePad = size === "sm" ? "px-2 py-1.5" : "px-3 py-2.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const GAP = 8;
  const SIDE_PAD = 8;

  const updateMenuPosition = () => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;

    let place = "bottom";
    let top = rect.bottom + GAP;

    const approxMenuH = menuRef.current?.getBoundingClientRect()?.height ?? 220;
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    if (spaceBelow < Math.min(approxMenuH, 220) && spaceAbove > spaceBelow) {
      place = "top";
      top = Math.max(GAP, rect.top - approxMenuH - GAP);
    }

    const left = Math.max(SIDE_PAD, Math.min(rect.left, window.innerWidth - width - SIDE_PAD));
    setMenuRect({ top, left, width, place });
  };

  useLayoutEffect(() => {
    if (open) updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onClickOutside = (e) => {
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(updateMenuPosition);
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div className="relative inline-block w-full">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-lg border flex items-center justify-between transition focus:outline-none focus:ring-2 ${basePad} ${textSize}`}
        style={{
          borderColor: open ? themeColors.primary : themeColors.border,
          backgroundColor: themeColors.background,
          color: themeColors.text,
          boxShadow: open ? `0 0 0 2px ${themeColors.primary}33 inset` : "none",
          zIndex: 1,
        }}
      >
        <span className="flex items-center gap-2 truncate">
          <CurrentIcon className="opacity-80" style={{ color: getStatusColor(value) }} />
          <span className="truncate capitalize">{value}</span>
        </span>
        <FaChevronDown
          className={`transition-transform ${open && menuRect.place === "bottom" ? "rotate-180" : ""}`}
          style={{ color: themeColors.text }}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="rounded-xl border shadow-lg overflow-auto"
            style={{
              position: "fixed",
              top: `${menuRect.top}px`,
              left: `${menuRect.left}px`,
              width: `${menuRect.width}px`,
              maxHeight: "40vh",
              zIndex: 9999,
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const OptIcon = getStatusIcon(opt);
              const active = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition ${
                    active ? "font-semibold" : ""
                  } hover:opacity-90`}
                  style={{
                    color: themeColors.text,
                    backgroundColor: active ? themeColors.primary + "12" : themeColors.surface,
                  }}
                >
                  <span className="flex items-center gap-2 capitalize">
                    <OptIcon style={{ color: getStatusColor(opt) }} />
                    {opt}
                  </span>
                  {active && <FaCheck style={{ color: themeColors.primary }} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

/* -------------------------------------------
                 Page Component
------------------------------------------- */

const Users = () => {
  const { themeColors } = useTheme();

  const [viewMode, setViewMode] = useState("cards");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [statusDraft, setStatusDraft] = useState({}); // { [userId]: 'approved' }

  // filters
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [onlyActiveAuctions, setOnlyActiveAuctions] = useState(false);

  // pagination
  const PER_PAGE_CARDS = 6;
  const PER_PAGE_TABLE = 5;
  const [pageCards, setPageCards] = useState(1);
  const [pageTable, setPageTable] = useState(1);

  // fetch users
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await listUsers(); // { count, users }
        if (mounted) setUsers(res?.users || []);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed to load users.";
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // helpers
  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    const map = {
      approved: themeColors.success,
      pending: themeColors.warning,
      "under verification": themeColors.info,
      rejected: themeColors.danger,
    };
    return map[s] || themeColors.text;
  };

  const getStatusIcon = (status) => {
    const s = String(status || "").toLowerCase();
    const map = {
      approved: FaUserCheck,
      pending: FaUserSlash,
      "under verification": FaUser,
      rejected: FaUserTimes,
    };
    return map[s] || FaUser;
  };

  const setDraft = (userId, value) => setStatusDraft((p) => ({ ...p, [userId]: value }));
  const getDraft = (user) => statusDraft[user.userId] ?? user.registrationStatus ?? "pending";

  const handleSaveStatus = async (user) => {
    const newStatus = getDraft(user);
    if (!STATUS_OPTIONS.includes(String(newStatus))) {
      toast.error("Invalid status selected");
      return;
    }
    try {
      setSavingId(user.userId);
      await updateUserStatus(user.userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, registrationStatus: newStatus } : u))
      );
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update status.";
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  // FILTER + SEARCH
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return users.filter((u) => {
      const typeOk = filterType === "All" ? true : u.userType === filterType;
      const statusOk = filterStatus === "All" ? true : u.registrationStatus === filterStatus;
      const activeOk = !onlyActiveAuctions
        ? true
        : (u.activityStats?.activeAuctionsCount || 0) > 0;

      const searchOk =
        !ql ||
        [u.name, u.email, u.phone, u.userId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(ql));

      return typeOk && statusOk && activeOk && searchOk;
    });
  }, [users, q, filterType, filterStatus, onlyActiveAuctions]);

  // RESET PAGE on filters/viewMode change
  useEffect(() => {
    setPageCards(1);
    setPageTable(1);
  }, [q, filterType, filterStatus, onlyActiveAuctions, viewMode]);

  // PAGINATION slices
  const totalCardsPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE_CARDS));
  const totalTablePages = Math.max(1, Math.ceil(filtered.length / PER_PAGE_TABLE));

  const cardsSlice = useMemo(() => {
    const start = (pageCards - 1) * PER_PAGE_CARDS;
    return filtered.slice(start, start + PER_PAGE_CARDS);
  }, [filtered, pageCards]);

  const tableSlice = useMemo(() => {
    const start = (pageTable - 1) * PER_PAGE_TABLE;
    return filtered.slice(start, start + PER_PAGE_TABLE);
  }, [filtered, pageTable]);

  const StatsCards = useMemo(() => {
    const total = filtered.length;
    const countBy = (st) => filtered.filter((u) => u.registrationStatus === st).length;
    const activeTotal = filtered.reduce((acc, u) => acc + (u.activityStats?.activeAuctionsCount || 0), 0);

    return [
      { title: "Filtered Users", value: String(total), icon: FaUser, description: "Visible after filters" },
      { title: "Approved", value: String(countBy("approved")), icon: FaUserCheck, description: "Verified users" },
      { title: "Pending", value: String(countBy("pending")), icon: FaUserSlash, description: "Awaiting review" },
      { title: "Active Auctions", value: String(activeTotal), icon: FaBox, description: "Sum of active auctions" },
    ];
  }, [filtered, themeColors]);

  // UI blocks
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4" style={{ color: themeColors.text }}>
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, color: themeColors.danger }}>
        {error}
      </div>
    );
  }

  // Pagination component
  const Pager = ({ page, setPage, totalPages }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
        style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }}
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => setPage(n)}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{
            borderColor: n === page ? themeColors.primary : themeColors.border,
            color: n === page ? themeColors.primary : themeColors.text,
            backgroundColor: n === page ? themeColors.primary + "12" : themeColors.background,
            fontWeight: n === page ? 700 : 500,
          }}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
        style={{ borderColor: themeColors.border, color: themeColors.text, backgroundColor: themeColors.background }}
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
            👥 User Management
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Search, filter, verify documents and update user status.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-3 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
              viewMode === "cards" ? "ring-2 ring-opacity-40" : ""
            }`}
            style={{
              backgroundColor: viewMode === "cards" ? themeColors.primary + "15" : themeColors.surface,
              borderColor: viewMode === "cards" ? themeColors.primary : themeColors.border,
              color: viewMode === "cards" ? themeColors.primary : themeColors.text,
            }}
          >
            <FaTh />
            <span className="text-sm font-medium">Cards</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-3 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
              viewMode === "table" ? "ring-2 ring-opacity-40" : ""
            }`}
            style={{
              backgroundColor: viewMode === "table" ? themeColors.primary + "15" : themeColors.surface,
              borderColor: viewMode === "table" ? themeColors.primary : themeColors.border,
              color: viewMode === "table" ? themeColors.primary : themeColors.text,
            }}
          >
            <FaList />
            <span className="text-sm font-medium">Table</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border p-3 md:p-4"
        style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
      >
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, phone or userId"
              className="w-full pl-9 pr-3 py-2 rounded-lg border"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            />
          </div>

          {/* Type */}
          <div className="min-w-[160px]">
            <label className="text-xs mb-1 block opacity-70" style={{ color: themeColors.text }}>
              User Type
            </label>
            <div className="flex items-center gap-2">
              <FaFilter className="opacity-70" />
              <select
                className="w-full p-2 rounded-lg border text-sm"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option>All</option>
                {USER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="min-w-[200px]">
            <label className="text-xs mb-1 block opacity-70" style={{ color: themeColors.text }}>
              Status
            </label>
            <select
              className="w-full p-2 rounded-lg border text-sm capitalize"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Active auctions toggle */}
          <div className="min-w-[220px]">
            <label className="text-xs mb-1 block opacity-70" style={{ color: themeColors.text }}>
              Only Active Auctions
            </label>
            <button
              onClick={() => setOnlyActiveAuctions((v) => !v)}
              className="w-full p-2 rounded-lg border flex items-center justify-between"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <span className="text-sm">Show users with active auctions</span>
              {onlyActiveAuctions ? <FaToggleOn style={{ color: themeColors.success }} /> : <FaToggleOff />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats (for filtered set) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {StatsCards.map((stat, idx) => (
          <div
            key={idx}
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

      {/* Cards View */}
      {viewMode === "cards" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardsSlice.map((user) => {
              const StatusIcon = getStatusIcon(user.registrationStatus);
              const as = user.activityStats || {};
              return (
                <div
                  key={user._id}
                  className="rounded-xl border transition-all duration-300 hover:shadow-lg overflow-hidden group"
                  style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: themeColors.border }}>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base shadow-sm"
                      style={{ backgroundColor: themeColors.primary + "25", color: themeColors.primary }}
                    >
                      {(user.name || "U N")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: themeColors.text }}>
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className="text-sm" style={{ color: getStatusColor(user.registrationStatus) }} />
                        <StatusBadge text={user.registrationStatus} color={getStatusColor(user.registrationStatus)} />
                      </div>
                      <p className="text-xs opacity-60 mt-1" style={{ color: themeColors.text }}>
                        {user.userId} • {user.userType}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColors.primary + "15" }}>
                        <FaCalendar className="text-xs" style={{ color: themeColors.primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                          Join Date
                        </p>
                        <p className="text-sm font-medium" style={{ color: themeColors.text }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Docs */}
                    <div className="flex items-center gap-2">
                      {user?.documents?.pan && (
                        <a
                          href={user.documents.pan}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: themeColors.info + "15", color: themeColors.info }}
                          title="View PAN"
                        >
                          <FaEye className="inline mr-1" /> PAN
                        </a>
                      )}
                      {user?.documents?.aadhar && (
                        <a
                          href={user.documents.aadhar}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: themeColors.info + "15", color: themeColors.info }}
                          title="View Aadhaar"
                        >
                          <FaEye className="inline mr-1" /> Aadhaar
                        </a>
                      )}
                    </div>

                    {/* Activity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaGavel className="text-xs opacity-70" style={{ color: themeColors.text }} />
                          <span className="text-sm font-bold" style={{ color: themeColors.primary }}>
                            {as.bidsCount ?? 0}
                          </span>
                        </div>
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                          Bids
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaBox className="text-xs opacity-70" style={{ color: themeColors.text }} />
                          <span className="text-sm font-bold" style={{ color: themeColors.primary }}>
                            {as.auctionsCount ?? 0}
                          </span>
                        </div>
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                          Auctions
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg col-span-1" style={{ backgroundColor: themeColors.background }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaList className="text-xs opacity-70" style={{ color: themeColors.text }} />
                          <span className="text-sm font-bold" style={{ color: themeColors.primary }}>
                            {as.activeAuctionsCount ?? 0}
                          </span>
                        </div>
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                          Active
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg col-span-1" style={{ backgroundColor: themeColors.background }}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaTrophy className="text-xs opacity-70" style={{ color: themeColors.text }} />
                          <span className="text-sm font-bold" style={{ color: themeColors.primary }}>
                            {as.wonAuctionsCount ?? 0}
                          </span>
                        </div>
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>
                          Won
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status update */}
                  <div className="p-4 border-t flex items-center gap-3" style={{ borderColor: themeColors.border }}>
                    <StatusSelect
                      themeColors={themeColors}
                      value={getDraft(user)}
                      onChange={(v) => setDraft(user.userId, v)}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      disabled={savingId === user.userId}
                    />
                    <button
                      onClick={() => handleSaveStatus(user)}
                      disabled={savingId === user.userId}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                      title="Update Status"
                    >
                      {savingId === user.userId ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
            {cardsSlice.length === 0 && (
              <div
                className="col-span-full p-8 text-center rounded-xl border"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
              >
                No users for current filters.
              </div>
            )}
          </div>

          {/* Cards Pagination */}
          <div
            className="px-6 py-4 rounded-xl border flex items-center justify-between text-sm"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface, color: themeColors.text }}
          >
            <div>
              Showing {(pageCards - 1) * PER_PAGE_CARDS + 1}–
              {Math.min(pageCards * PER_PAGE_CARDS, filtered.length)} of {filtered.length}
            </div>
            <Pager page={pageCards} setPage={setPageCards} totalPages={totalCardsPages} />
          </div>
        </>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <>
          <div
            className="rounded-2xl border shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: themeColors.background + "30" }}>
                    {[
                      "User",
                      "Email",
                      "Phone",
                      "City",
                      "User Type",
                      "Status",
                      "Documents",
                      "Bids",
                      "Auctions",
                      "Active",
                      "Won",
                      "Join Date",
                      "Actions",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: themeColors.text }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                  {tableSlice.map((user) => {
                    const as = user.activityStats || {};
                    return (
                      <tr key={user._id} style={{ backgroundColor: themeColors.surface }}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm" style={{ color: themeColors.text }}>
                            {user.name}
                          </div>
                          <div className="text-xs opacity-70">{user.userId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm opacity-80" style={{ color: themeColors.text }}>
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm opacity-80" style={{ color: themeColors.text }}>
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 text-sm opacity-80" style={{ color: themeColors.text }}>
                          {user.city}
                        </td>
                        <td className="px-6 py-4 text-sm opacity-80" style={{ color: themeColors.text }}>
                          {user.userType}
                        </td>

                        {/* Status select + badge */}
                        <td className="px-6 py-4">
                          <div className="mb-2">
                            <StatusBadge text={user.registrationStatus} color={getStatusColor(user.registrationStatus)} />
                          </div>
                          <StatusSelect
                            themeColors={themeColors}
                            value={getDraft(user)}
                            onChange={(v) => setDraft(user.userId, v)}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            disabled={savingId === user.userId}
                            size="sm"
                          />
                        </td>

                        {/* Documents */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user?.documents?.pan && (
                              <a
                                href={user.documents.pan}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{ backgroundColor: themeColors.info + "15", color: themeColors.info }}
                              >
                                <FaEye className="inline mr-1" /> PAN
                              </a>
                            )}
                            {user?.documents?.aadhar && (
                              <a
                                href={user.documents.aadhar}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{ backgroundColor: themeColors.info + "15", color: themeColors.info }}
                              >
                                <FaEye className="inline mr-1" /> Aadhaar
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Activity Columns */}
                        <td className="px-6 py-4 text-sm" style={{ color: themeColors.text }}>
                          {as.bidsCount ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: themeColors.text }}>
                          {as.auctionsCount ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: themeColors.text }}>
                          {as.activeAuctionsCount ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: themeColors.text }}>
                          {as.wonAuctionsCount ?? 0}
                        </td>

                        <td className="px-6 py-4 text-sm opacity-80" style={{ color: themeColors.text }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSaveStatus(user)}
                            disabled={savingId === user.userId}
                            className="px-3 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                          >
                            {savingId === user.userId ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tableSlice.length === 0 && (
                    <tr>
                      <td colSpan={13} className="px-6 py-10 text-center text-sm" style={{ color: themeColors.text }}>
                        No users for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
          <div
            className="px-6 py-4 rounded-xl border flex items-center justify-between text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.surface,
              color: themeColors.text,
            }}
          >
            <div>
              Showing {(pageTable - 1) * PER_PAGE_TABLE + 1}–
              {Math.min(pageTable * PER_PAGE_TABLE, filtered.length)} of {filtered.length}
            </div>
            <Pager page={pageTable} setPage={setPageTable} totalPages={totalTablePages} />
          </div>
        </>
      )}
    </div>
  );
};

export default Users;