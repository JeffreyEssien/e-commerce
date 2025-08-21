"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import PendingOrders from "./pendingOrders";
import ManageProducts from "./manageProducts";
import VendorAnalytics from "./vendorAnalytics";

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "analytics">("orders");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === "orders" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          📦 Pending Orders
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-black ${
            activeTab === "products" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("products")}
        >
          🛒 Manage Products
        </button>

        <button
          className={`px-4 py-2 rounded-lg text-black ${
            activeTab === "products" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Vendor Analytics
        </button>
      </div>

      {activeTab === "orders" && <PendingOrders />}
      {activeTab === "products" && <ManageProducts />}
      {activeTab === "analytics" && <VendorAnalytics />}
    </div>
  );
}