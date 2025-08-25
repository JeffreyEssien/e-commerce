"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProductInfo {
  name: string;
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product?: ProductInfo;
}

// Shape returned directly by Supabase, where `product` comes back as an array
interface RawOrder {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product: { name: string }[] | null;
}

export default function PendingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const vendorId = session?.user?.id;

    let query = supabase
      .from("orders")
      .select(`
        id,
        quantity,
        total_price,
        status,
        created_at,
        customer_name,
        customer_phone,
        customer_address,
        product:product_id (
          name
        )
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Order fetch error:", error);
      toast.error("Failed to load orders");
    } else {
      const normalized = (data as RawOrder[]).map((o) => ({
        ...o,
        product:
          Array.isArray(o.product) && o.product.length > 0
            ? o.product[0]
            : undefined,
      }));

      setOrders(normalized as Order[]);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setProcessingOrders(prev => new Set(prev).add(orderId));

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success(`Order marked as ${newStatus}! 📦`);
      if (filter === "pending" && newStatus !== "pending") {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        ));
      }
    }

    setProcessingOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-400";
      case "shipped": return "text-blue-400";
      case "delivered": return "text-green-400";
      case "cancelled": return "text-red-400";
      default: return "text-white/70";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "⏳";
      case "shipped": return "🚚";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "📦";
    }
  };

  const stats = {
    total: orders.length,
    totalValue: orders.reduce((sum, order) => sum + order.total_price, 0),
    pending: orders.filter(o => o.status === "pending").length,
    processing: processingOrders.size,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Orders", value: stats.total, icon: "📦", color: "text-gradient-primary" },
          { label: "Total Value", value: `₦${stats.totalValue.toLocaleString()}`, icon: "💰", color: "text-gradient-tertiary" },
          { label: "Pending", value: stats.pending, icon: "⏳", color: "text-gradient-secondary" },
          { label: "Processing", value: stats.processing, icon: "⚙️", color: "text-yellow-400" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="glass-card text-center hover-lift"
          >
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-lg font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-white/70 text-xs">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <div className="flex flex-wrap gap-2">
          <span className="text-white/70 text-sm mr-2">Filter by status:</span>
          {[
            { key: "all", label: "All Orders", icon: "📋" },
            { key: "pending", label: "Pending", icon: "⏳" },
            { key: "shipped", label: "Shipped", icon: "🚚" },
            { key: "delivered", label: "Delivered", icon: "✅" },
            { key: "cancelled", label: "Cancelled", icon: "❌" },
          ].map((filterOption) => (
            <motion.button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`glass-button px-3 py-1 text-sm ${
                filter === filterOption.key 
                  ? "bg-gradient-primary" 
                  : "hover:bg-white/10"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filterOption.icon} {filterOption.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Orders List */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/20 rounded w-1/2 mb-2" />
              <div className="h-3 bg-white/20 rounded w-full mb-4" />
              <div className="h-10 bg-white/20 rounded w-1/4" />
            </div>
          ))}
        </motion.div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card text-center py-12"
        >
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            No Orders Found
          </h3>
          <p className="text-white/70">
            {filter === "pending" 
              ? "No pending orders at the moment" 
              : `No ${filter} orders found`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                layout
                className="glass-card hover-lift group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-gradient-primary transition-all">
                        📦 {order.product?.name || "Unknown Product"}
                      </h3>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-white/70 mb-2">
                          <span className="font-medium">Quantity:</span> {order.quantity}
                        </div>
                        <div className="text-lg font-bold text-gradient-tertiary mb-2">
                          Total: ₦{order.total_price.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/60">
                          Ordered: {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="glass bg-white/5 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-white/80 mb-2">Customer Details</h4>
                        <div className="space-y-1 text-sm text-white/70">
                          <p className="flex items-center">
                            <span className="mr-2">👤</span>
                            {order.customer_name || "No name provided"}
                          </p>
                          <p className="flex items-center">
                            <span className="mr-2">📞</span>
                            {order.customer_phone || "No phone number"}
                          </p>
                          <p className="flex items-center">
                            <span className="mr-2">📍</span>
                            {order.customer_address || "No address provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 lg:ml-6">
                    {order.status === "pending" && (
                      <>
                        <motion.button
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                          disabled={processingOrders.has(order.id)}
                          className={`glass-button bg-gradient-primary hover:bg-gradient-secondary ${
                            processingOrders.has(order.id) ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {processingOrders.has(order.id) ? (
                            <div className="flex items-center">
                              <div className="loading-spinner mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            "🚚 Mark as Shipped"
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          disabled={processingOrders.has(order.id)}
                          className="glass-button bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ❌ Cancel Order
                        </motion.button>
                      </>
                    )}
                    
                    {order.status === "shipped" && (
                      <motion.button
                        onClick={() => updateOrderStatus(order.id, "delivered")}
                        disabled={processingOrders.has(order.id)}
                        className="glass-button bg-gradient-tertiary hover:bg-gradient-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {processingOrders.has(order.id) ? (
                          <div className="flex items-center">
                            <div className="loading-spinner mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          "✅ Mark as Delivered"
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
