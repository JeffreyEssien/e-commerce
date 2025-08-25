"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type TopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};

interface RawOrder {
  product_id: string;
  quantity: number;
  total_price: number;
  created_at: string;
  product: { name: string }[] | null;
}

interface AnalyticsData {
  totalSales: number;
  orderCount: number;
  completedOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  topProducts: TopProduct[];
  recentSales: number;
  monthlyGrowth: number;
}

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSales: 0,
    orderCount: 0,
    completedOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
    topProducts: [],
    recentSales: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const vendorId = session?.user?.id;

    if (!vendorId) {
      setLoading(false);
      return;
    }

    try {
      // Calculate date range
      let dateFilter = "";
      const now = new Date();
      if (timeRange === "7d") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeRange === "30d") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }

      // Build query
      let ordersQuery = supabase
        .from("orders")
        .select("product_id, quantity, total_price, status, created_at, product:product_id(name)")
        .eq("vendor_id", vendorId);

      if (dateFilter) {
        ordersQuery = ordersQuery.gte("created_at", dateFilter);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;

      if (ordersError) {
        toast.error("Failed to fetch analytics data");
        console.error(ordersError);
        return;
      }

      const orders = ordersData as RawOrder[];

      // Calculate analytics
      const totalSales = orders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total_price, 0);

      const orderCount = orders.length;
      const completedOrders = orders.filter(o => o.status === "delivered").length;
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const shippedOrders = orders.filter(o => o.status === "shipped").length;
      const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

      // Recent sales (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentSales = orders
        .filter(o => new Date(o.created_at) >= weekAgo && o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total_price, 0);

      // Calculate monthly growth (compare last 30 days to previous 30 days)
      let monthlyGrowth = 0;
      if (timeRange === "all") {
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const currentPeriodSales = orders
          .filter(o => new Date(o.created_at) >= last30Days && o.status !== "cancelled")
          .reduce((sum, o) => sum + o.total_price, 0);

        const previousPeriodSales = orders
          .filter(o => 
            new Date(o.created_at) >= previous30Days && 
            new Date(o.created_at) < last30Days && 
            o.status !== "cancelled"
          )
          .reduce((sum, o) => sum + o.total_price, 0);

        if (previousPeriodSales > 0) {
          monthlyGrowth = ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;
        }
      }

      // Top products
      const productMap: Record<string, TopProduct> = {};
      orders
        .filter(o => o.status !== "cancelled")
        .forEach((order) => {
          const id = order.product_id;
          const name = Array.isArray(order.product) && order.product.length > 0
            ? order.product[0].name
            : "Unknown Product";

          if (!productMap[id]) {
            productMap[id] = { name, quantity: 0, revenue: 0 };
          }
          productMap[id].quantity += order.quantity;
          productMap[id].revenue += order.total_price;
        });

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        totalSales,
        orderCount,
        completedOrders,
        pendingOrders,
        shippedOrders,
        cancelledOrders,
        topProducts,
        recentSales,
        monthlyGrowth,
      });
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "7d": return "Last 7 Days";
      case "30d": return "Last 30 Days";
      case "all": return "All Time";
      default: return "Last 30 Days";
    }
  };

  const completionRate = analytics.orderCount > 0 
    ? (analytics.completedOrders / analytics.orderCount) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary mb-2">
              📊 Analytics Dashboard
            </h2>
            <p className="text-white/70">
              Track your business performance and growth
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {[
              { key: "7d" as const, label: "7 Days" },
              { key: "30d" as const, label: "30 Days" },
              { key: "all" as const, label: "All Time" },
            ].map((range) => (
              <motion.button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`glass-button px-3 py-1 text-sm ${
                  timeRange === range.key 
                    ? "bg-gradient-primary" 
                    : "hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="h-4 bg-white/20 rounded w-1/2 mb-2" />
              <div className="h-6 bg-white/20 rounded w-3/4 mb-1" />
              <div className="h-3 bg-white/20 rounded w-1/3" />
            </div>
          ))}
        </motion.div>
      ) : (
        <>
          {/* Main Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { 
                label: "Total Revenue", 
                value: `₦${analytics.totalSales.toLocaleString()}`, 
                icon: "💰", 
                color: "text-gradient-tertiary",
                subtitle: getTimeRangeLabel()
              },
              { 
                label: "Total Orders", 
                value: analytics.orderCount.toString(), 
                icon: "📦", 
                color: "text-gradient-primary",
                subtitle: getTimeRangeLabel()
              },
              { 
                label: "Completion Rate", 
                value: `${completionRate.toFixed(1)}%`, 
                icon: "✅", 
                color: "text-gradient-secondary",
                subtitle: `${analytics.completedOrders}/${analytics.orderCount} completed`
              },
              { 
                label: "Recent Sales", 
                value: `₦${analytics.recentSales.toLocaleString()}`, 
                icon: "🔥", 
                color: "text-orange-400",
                subtitle: "Last 7 days"
              },
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card hover-lift hover-glow"
              >
                <div className="text-2xl mb-2">{metric.icon}</div>
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <div className="text-white/70 text-sm">{metric.label}</div>
                <div className="text-white/50 text-xs mt-1">{metric.subtitle}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Order Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: "Pending", value: analytics.pendingOrders, icon: "⏳", color: "text-yellow-400" },
              { label: "Shipped", value: analytics.shippedOrders, icon: "🚚", color: "text-blue-400" },
              { label: "Delivered", value: analytics.completedOrders, icon: "✅", color: "text-green-400" },
              { label: "Cancelled", value: analytics.cancelledOrders, icon: "❌", color: "text-red-400" },
            ].map((status, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card text-center hover-lift"
              >
                <div className="text-lg mb-1">{status.icon}</div>
                <div className={`text-lg font-bold ${status.color} mb-1`}>
                  {status.value}
                </div>
                <div className="text-white/70 text-xs">{status.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Growth Indicator */}
          {timeRange === "all" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card text-center"
            >
              <h3 className="text-lg font-semibold text-white mb-2">📈 Monthly Growth</h3>
              <div className={`text-3xl font-bold mb-2 ${
                analytics.monthlyGrowth >= 0 ? "text-green-400" : "text-red-400"
              }`}>
                {analytics.monthlyGrowth >= 0 ? "↗️" : "↘️"} {Math.abs(analytics.monthlyGrowth).toFixed(1)}%
              </div>
              <p className="text-white/70 text-sm">
                Compared to previous 30 days
              </p>
            </motion.div>
          )}

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card"
          >
            <h3 className="text-xl font-bold text-gradient-secondary mb-6">
              🏆 Top Performing Products
            </h3>
            {analytics.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-white/70">No sales data available yet</p>
                <p className="text-white/50 text-sm">Start selling to see your top products here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="glass bg-white/5 p-4 rounded-lg border border-white/10 hover-lift"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? "bg-gradient-tertiary" :
                          index === 1 ? "bg-gradient-secondary" :
                          index === 2 ? "bg-gradient-primary" :
                          "bg-white/20"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{product.name}</h4>
                          <p className="text-white/60 text-sm">
                            {product.quantity} sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gradient-tertiary">
                          ₦{product.revenue.toLocaleString()}
                        </div>
                        <div className="text-white/50 text-xs">
                          Revenue
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
