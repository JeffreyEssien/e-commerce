"use client";
import { useState } from "react";
import PendingOrders from "./pendingOrders";
import ManageProducts from "./manageProducts";

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");

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
          className={`px-4 py-2 rounded-lg ${
            activeTab === "products" ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("products")}
        >
          🛒 Manage Products
        </button>
      </div>

      {activeTab === "orders" && <PendingOrders />}
      {activeTab === "products" && <ManageProducts />}
    </div>
  );
}