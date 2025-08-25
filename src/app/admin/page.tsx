"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Vendor {
  id: string;
  shop_name: string;
  email: string;
  bio: string;
  status: string;
  rating: number;
  ratings_count: number;
  campus_id: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  vendor_id: string;
}

export default function AdminDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productsByVendor, setProductsByVendor] = useState<Record<string, Product[]>>({});
  const [campuses, setCampuses] = useState<Record<string, string>>({});
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      const [vendorRes, campusRes, productRes] = await Promise.all([
        supabase
          .from("vendors")
          .select("id, shop_name, email, bio, status, rating, ratings_count, campus_id"),
        supabase.from("campuses").select("id, name"),
        supabase
          .from("products")
          .select("id, name, price, status, vendor_id")
          .eq("status", "pending"),
      ]);

      if (vendorRes.error) toast.error("Failed to load vendors");
      else setVendors(vendorRes.data as Vendor[]);

      if (campusRes.data) {
        const campusMap: Record<string, string> = {};
        campusRes.data.forEach((c: { id: string; name: string }) => {
          campusMap[c.id] = c.name;
        });
        setCampuses(campusMap);
      }

      if (productRes.data) {
        const grouped: Record<string, Product[]> = {};
        (productRes.data as Product[]).forEach((p) => {
          if (!grouped[p.vendor_id]) grouped[p.vendor_id] = [];
          grouped[p.vendor_id].push(p);
        });
        setProductsByVendor(grouped);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const approveVendor = async (id: string) => {
    const { error } = await supabase
      .from("vendors")
      .update({ status: "approved", plan: "free" })
      .eq("id", id);

    if (error) toast.error("Vendor approval failed");
    else {
      toast.success("Vendor approved successfully! 🎉");
      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
      );
    }
  };

  const approveProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .update({ status: "active" })
      .eq("id", productId);

    if (error) toast.error("Product approval failed");
    else {
      toast.success("Product approved successfully! ✅");
      setProductsByVendor((prev) => {
        const updated = { ...prev };
        for (const vendorId in updated) {
          updated[vendorId] = updated[vendorId].map((p) =>
            p.id === productId ? { ...p, status: "active" } : p
          );
        }
        return updated;
      });
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const hasProducts = productsByVendor[v.id]?.length > 0;
    const matchesSearch = v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || v.status === activeFilter;
    
    return hasProducts && matchesSearch && matchesFilter;
  });

  const stats = {
    totalVendors: vendors.length,
    pendingVendors: vendors.filter(v => v.status === "pending").length,
    approvedVendors: vendors.filter(v => v.status === "approved").length,
    totalProducts: Object.values(productsByVendor).flat().length,
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">
              Admin Dashboard
            </h1>
            <p className="text-white/70 text-lg">
              Manage vendors, approve products, and oversee platform operations
            </p>
          </div>
          <Link href="/">
            <motion.button 
              className="glass-button mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🏠 Back to Home
            </motion.button>
          </Link>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: "Total Vendors", value: stats.totalVendors, icon: "🏪", color: "text-gradient-primary" },
            { label: "Pending Approvals", value: stats.pendingVendors, icon: "⏳", color: "text-gradient-secondary" },
            { label: "Approved Vendors", value: stats.approvedVendors, icon: "✅", color: "text-gradient-tertiary" },
            { label: "Pending Products", value: stats.totalProducts, icon: "📦", color: "text-gradient-primary" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card hover-lift"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search vendors by name or email..."
              className="glass-input w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "All", icon: "📋" },
              { key: "pending", label: "Pending", icon: "⏳" },
              { key: "approved", label: "Approved", icon: "✅" },
            ].map((filter) => (
              <motion.button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`glass-button px-4 py-2 ${
                  activeFilter === filter.key 
                    ? "bg-gradient-primary" 
                    : "hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.icon} {filter.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Vendors Grid */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="glass-card animate-pulse"
            >
              <div className="h-4 bg-white/20 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/20 rounded w-1/2 mb-4" />
              <div className="h-3 bg-white/20 rounded w-full mb-2" />
              <div className="h-3 bg-white/20 rounded w-2/3 mb-4" />
              <div className="h-10 bg-white/20 rounded w-full" />
            </div>
          ))}
        </motion.div>
      ) : filteredVendors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card text-center py-12"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            No Vendors Found
          </h3>
          <p className="text-white/70">
            {search ? "Try adjusting your search terms" : "No pending requests at the moment"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="wait">
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card hover-lift hover-glow relative group"
              >
                {/* Status Badge */}
                <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium ${
                  vendor.status === "pending" 
                    ? "bg-gradient-secondary text-white" 
                    : "bg-gradient-tertiary text-white"
                }`}>
                  {vendor.status === "pending" ? "⏳ Pending" : "✅ Approved"}
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white mb-1 group-hover:text-gradient-primary transition-all">
                    🏪 {vendor.shop_name}
                  </h2>
                  <p className="text-white/70 text-sm mb-2">📧 {vendor.email}</p>
                  <p className="text-white/60 text-sm line-clamp-2 mb-3">
                    {vendor.bio || "No bio provided"}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1">{vendor.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                  <span>{vendor.ratings_count || 0} reviews</span>
                </div>

                <div className="text-xs text-white/50 mb-4 flex items-center">
                  <span className="mr-1">🏫</span>
                  {campuses[vendor.campus_id] || "Unknown Campus"}
                </div>

                {vendor.status === "pending" && (
                  <motion.button
                    onClick={() => approveVendor(vendor.id)}
                    className="glass-button w-full mb-4 bg-gradient-tertiary hover:bg-gradient-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✅ Approve Vendor
                  </motion.button>
                )}

                {/* Products Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/80 mb-2">
                    📦 Pending Products ({productsByVendor[vendor.id]?.length || 0})
                  </h4>
                  {productsByVendor[vendor.id]?.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass bg-white/5 p-3 rounded-lg border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gradient-tertiary font-semibold">
                            ₦{product.price.toLocaleString()}
                          </p>
                        </div>
                        {product.status === "pending" ? (
                          <motion.button
                            onClick={() => approveProduct(product.id)}
                            className="glass-button text-xs px-3 py-1 bg-gradient-primary hover:bg-gradient-secondary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ✅ Approve
                          </motion.button>
                        ) : (
                          <span className="text-xs text-green-400 font-medium bg-green-400/20 px-2 py-1 rounded">
                            ✅ Approved
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
