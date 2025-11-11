// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
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
  FaCalendarAlt
} from "react-icons/fa";

const Dashboard = () => {
  const { themeColors } = useTheme();

  // Auction stats data - simplified
  const stats = [
    { 
      title: "Live Auctions", 
      value: "24", 
      icon: FaGavel,
      description: "Active right now" 
    },
    { 
      title: "Total Bids", 
      value: "1,247", 
      icon: FaDollarSign,
      description: "Last 24 hours" 
    },
    { 
      title: "Items Listed", 
      value: "156", 
      icon: FaBox,
      description: "New this week" 
    },
    { 
      title: "Successful Sales", 
      value: "89", 
      icon: FaTrophy,
      description: "Completed today" 
    },
  ];

  // Simplified category stats
  const categoryStats = [
    { name: "Electronics", items: 68 },
    { name: "Collectibles", items: 42 },
    { name: "Art & Antiques", items: 28 },
    { name: "Jewelry", items: 18 },
  ];

  // Simplified upcoming auctions
  const upcomingAuctions = [
    { title: "Vintage Watch Collection", time: "02:00 PM", date: "Today" },
    { title: "Classic Car Auction", time: "04:30 PM", date: "Today" },
    { title: "Art Gallery Sale", time: "11:00 AM", date: "Tomorrow" },
  ];

  // Simplified recent bids
  const recentBids = [
    { user: "Sarah Johnson", item: "Vintage Rolex", amount: "$2,450", time: "2 hours ago" },
    { user: "Mike Chen", item: "Abstract Painting", amount: "$1,850", time: "3 hours ago" },
    { user: "Emily Davis", item: "Sports Car", amount: "$45,000", time: "5 hours ago" },
  ];

  // Quick actions data
  const quickActions = [
    { label: "Create Auction", icon: FaPlus, color: themeColors.primary },
    { label: "Place Bid", icon: FaGavel, color: themeColors.success },
    { label: "View Reports", icon: FaChartBar, color: themeColors.info },
    { label: "Schedule Auction", icon: FaCalendarAlt, color: themeColors.warning },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
            Auction Dashboard
          </h1>
          <p className="text-sm mt-1 opacity-75" style={{ color: themeColors.text }}>
            Welcome to your auction management portal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg group"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p
                  className="text-sm font-medium mb-1 opacity-75"
                  style={{ color: themeColors.text }}
                >
                  {stat.title}
                </p>
                <p
                  className="text-2xl font-bold mb-2"
                  style={{ color: themeColors.primary }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs opacity-60"
                  style={{ color: themeColors.text }}
                >
                  {stat.description}
                </p>
              </div>
              <div
                className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: themeColors.primary + "15" }}
              >
                <stat.icon 
                  className="text-lg" 
                  style={{ color: themeColors.primary }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
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
            <FaChartPie className="mr-2" />
            Top Categories
          </h2>
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                    {category.name}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: themeColors.primary }}>
                    {category.items} items
                  </span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: themeColors.border }}>
                  <div 
                    className="h-2 rounded-full transition-all duration-500 group-hover:opacity-80"
                    style={{ 
                      width: `${(category.items / 156) * 100}%`,
                      backgroundColor: themeColors.primary
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Auctions */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bids */}
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

        {/* Quick Actions */}
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
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.borderColor = themeColors.border;
                }}
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
    </div>
  );
};

export default Dashboard;