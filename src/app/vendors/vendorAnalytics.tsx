"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type TopProduct = {
  name: string;
  quantity: number;
};

interface RawOrder {
  product_id: string;
  quantity: number;
  product: { name: string }[] | null;
}

export default function VendorAnalytics() {
  const [totalSales, setTotalSales] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const vendorId = session?.user?.id;

    if (!vendorId) return;

    // Total Sales
    const { data: salesData, error: salesError } = await supabase
      .from("orders")
      .select("total_price")
      .eq("vendor_id", vendorId)
      .eq("status", "completed");

    if (salesError) {
      toast.error("Failed to fetch sales");
    } else {
      const total = salesData?.reduce((sum, o) => sum + o.total_price, 0);
      setTotalSales(total || 0);
    }

    // Total Orders
    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    if (countError) {
      toast.error("Failed to count orders");
    } else {
      setOrderCount(count || 0);
    }

    // Top Products
    const { data: productData, error: productError } = await supabase
      .from("orders")
      .select("product_id, quantity, product:product_id(name)")
      .eq("vendor_id", vendorId)
      .eq("status", "completed");

    if (productError) {
      toast.error("Failed to fetch top products");
    } else {
      const grouped: Record<string, TopProduct> = {};

      (productData as RawOrder[]).forEach((order) => {
        const id = order.product_id;
        const name =
          Array.isArray(order.product) && order.product.length > 0
            ? order.product[0].name
            : "Unnamed";

        if (!grouped[id]) {
          grouped[id] = { name, quantity: 0 };
        }
        grouped[id].quantity += order.quantity;
      });

      const sorted = Object.values(grouped).sort(
        (a, b) => b.quantity - a.quantity
      );
      setTopProducts(sorted.slice(0, 5));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow border"
        >
          <h3 className="text-sm text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">₦{totalSales}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow border"
        >
          <h3 className="text-sm text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-indigo-600">{orderCount}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow border"
        >
          <h3 className="text-sm text-gray-500">Top Product</h3>
          <p className="text-lg font-semibold text-gray-800">
            {topProducts[0]?.name || "—"}
          </p>
          <p className="text-xs text-gray-500">
            Sold: {topProducts[0]?.quantity || 0}
          </p>
        </motion.div>
      </div>

      {/* Top Products List */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-2">🏆 Top-Selling Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-gray-500">No completed orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {topProducts.map((p, i) => (
              <li
                key={i}
                className="flex justify-between items-center border-b pb-2"
              >
                <span className="text-gray-700">{p.name}</span>
                <span className="text-sm text-gray-500">Sold: {p.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}