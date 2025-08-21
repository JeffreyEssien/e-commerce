"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import useCart from "./cart";
import CartPanel from "./.cartPanel";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Campus {
  id: string;
  name: string;
}

interface Vendor {
  shop_name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  campus_id: string;
  status: string;
  vendor_id: string;
  vendor?: Vendor;
}

export default function CustomerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const { cart, addToCart, ...cartActions } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch campuses
      const { data: campusData, error: campusError } = await supabase
        .from("campuses")
        .select("id, name");

      if (campusError) {
        console.error("Campus fetch error:", campusError);
        toast.error("Failed to load campuses");
        return;
      }

      setCampuses(campusData as Campus[]);

      // Fetch products with vendor info
      const { data: rawProductData, error: productError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          category,
          campus_id,
          status,
          vendor_id,
          vendor:vendor_id (
            shop_name
          )
        `)
        .eq("status", "active");

      if (productError) {
        console.error("Product fetch error:", productError);
        toast.error("Failed to load products");
        return;
      }

      // Flatten vendor array to single object
      const normalized = (rawProductData as Array<Omit<Product, "vendor"> & { vendor: Vendor[] | null }>).map(
        (p) => ({
          ...p,
          vendor: Array.isArray(p.vendor) && p.vendor.length > 0 ? p.vendor[0] : undefined,
        })
      );

      setProducts(normalized);
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCampus
    ? products.filter((p) => p.campus_id === selectedCampus)
    : products;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-6">🛍️ Explore Products</h1>

      {/* Campus Filter */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <select
          className="p-3 border rounded-lg w-full"
          value={selectedCampus}
          onChange={(e) => setSelectedCampus(e.target.value)}
        >
          <option value="">All Campuses</option>
          {campuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Product Grid */}
      <motion.div
        layout
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
      >
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {product.name}
              </h2>
              <p className="text-indigo-600 font-bold text-lg">
                ₦{product.price}
              </p>
              <p className="text-sm text-gray-500">{product.category}</p>
              <p className="text-xs text-gray-400 mt-1">
                Sold by: {product.vendor?.shop_name || "Unknown Vendor"}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  addToCart(product);
                  toast.success(`${product.name} added to cart`);
                }}
                className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                🛒 Add to Cart
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Cart Panel */}
      <CartPanel cart={cart} {...cartActions} />
    </motion.div>
  );
}