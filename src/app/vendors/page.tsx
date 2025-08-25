"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PendingOrders from "./pendingOrders";
import ManageProducts from "./manageProducts";
import VendorAnalytics from "./vendorAnalytics";

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "analytics">("orders");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error("Please log in to access the vendor dashboard");
          router.push("/login");
          return;
        }

        // Verify user role
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile || profile.role !== "vendor") {
          toast.error("Access denied. Vendor account required.");
          router.push("/login");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error. Please log in.");
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const tabs = [
    { 
      key: "orders" as const, 
      label: "Pending Orders", 
      icon: "📦",
      description: "Manage and fulfill customer orders"
    },
    { 
      key: "products" as const, 
      label: "Manage Products", 
      icon: "🛒",
      description: "Add, edit, and organize your products"
    },
    { 
      key: "analytics" as const, 
      label: "Analytics", 
      icon: "📊",
      description: "Track your performance and sales"
    }
  ];

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card text-center py-12"
        >
          <div className="loading-spinner mb-4 mx-auto"></div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Verifying Access...
          </h3>
          <p className="text-white/70">
            Please wait while we check your credentials
          </p>
        </motion.div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">
              🏪 Vendor Dashboard
            </h1>
            <p className="text-white/70 text-lg">
              Manage your products, orders, and grow your business
            </p>
          </div>
          <Link href="/">
            <motion.button 
              className="glass-button mt-4 lg:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🏠 Back to Home
            </motion.button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`glass p-4 rounded-lg text-left transition-all duration-300 ${
                  activeTab === tab.key 
                    ? "bg-gradient-primary shadow-lg scale-105" 
                    : "hover:bg-white/10 hover:scale-102"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{tab.icon}</span>
                  <span className={`font-semibold ${
                    activeTab === tab.key ? "text-white" : "text-white/80"
                  }`}>
                    {tab.label}
                  </span>
                </div>
                <p className={`text-sm ${
                  activeTab === tab.key ? "text-white/90" : "text-white/60"
                }`}>
                  {tab.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        {activeTab === "orders" && <PendingOrders />}
        {activeTab === "products" && <ManageProducts />}
        {activeTab === "analytics" && <VendorAnalytics />}
      </motion.div>

      {/* Quick Actions Floating Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 glass-card p-4"
      >
        <h3 className="text-sm font-medium text-white/80 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <motion.button
            onClick={() => setActiveTab("products")}
            className="glass-button w-full text-left text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ➕ Add Product
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("orders")}
            className="glass-button w-full text-left text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            📦 Check Orders
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("analytics")}
            className="glass-button w-full text-left text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            📊 View Stats
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
