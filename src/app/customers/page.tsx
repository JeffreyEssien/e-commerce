"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import useCart from "./cart";
import CartPanel from "./.cartPanel";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const { cart, addToCart, ...cartActions } = useCart();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error("Please log in to access the customer dashboard");
          router.push("/login");
          return;
        }

        // Verify user role
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile || profile.role !== "customer") {
          toast.error("Access denied. Customer account required.");
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
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
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

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

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      const matchesCampus = !selectedCampus || p.campus_id === selectedCampus;
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCampus && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0; // newest first (default order)
      }
    });

  const stats = {
    totalProducts: products.length,
    categoriesCount: categories.length,
    vendorsCount: new Set(products.map(p => p.vendor_id)).size,
    cartItems: cart.length,
  };

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
              🛍️ Marketplace
            </h1>
            <p className="text-white/70 text-lg">
              Discover amazing products from campus vendors
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

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Products", value: stats.totalProducts, icon: "📦", color: "text-gradient-primary" },
            { label: "Categories", value: stats.categoriesCount, icon: "🏷️", color: "text-gradient-secondary" },
            { label: "Vendors", value: stats.vendorsCount, icon: "🏪", color: "text-gradient-tertiary" },
            { label: "In Cart", value: stats.cartItems, icon: "🛒", color: "text-gradient-primary" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card text-center hover-lift"
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-white/70 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="🔍 Search products..."
              className="glass-input w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Campus Filter */}
          <div>
            <select
              className="glass-input w-full"
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
            >
              <option value="">🏫 All Campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="glass-input w-full"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">🏷️ All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              className="glass-input w-full"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">📅 Newest First</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💰 Price: High to Low</option>
              <option value="name">🔤 Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCampus || selectedCategory || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-white/20"
          >
            <div className="flex flex-wrap gap-2">
              <span className="text-white/70 text-sm">Active filters:</span>
              {searchQuery && (
                <span className="glass-button px-2 py-1 text-xs">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCampus && (
                <span className="glass-button px-2 py-1 text-xs">
                  Campus: {campuses.find(c => c.id === selectedCampus)?.name}
                  <button
                    onClick={() => setSelectedCampus("")}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="glass-button px-2 py-1 text-xs">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-white/20 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-white/20 rounded w-full mb-4" />
                  <div className="h-10 bg-white/20 rounded w-full" />
                </div>
              ))}
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card text-center py-12"
            >
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                No Products Found
              </h3>
              <p className="text-white/70 mb-4">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCampus("");
                  setSelectedCategory("");
                }}
                className="glass-button"
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="wait">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    layout
                    className="glass-card hover-lift hover-glow group"
                  >
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-white mb-1 group-hover:text-gradient-primary transition-all">
                        {product.name}
                      </h2>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-gradient-tertiary">
                          ₦{product.price.toLocaleString()}
                        </span>
                        <span className="glass bg-white/10 px-2 py-1 rounded-full text-xs text-white/70">
                          {product.category}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-2">
                        🏪 {product.vendor?.shop_name || "Unknown Vendor"}
                      </p>
                      <p className="text-white/50 text-xs">
                        🏫 {campuses.find(c => c.id === product.campus_id)?.name || "Unknown Campus"}
                      </p>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        addToCart(product);
                        toast.success(`🛒 ${product.name} added to cart!`);
                      }}
                      className="glass-button w-full bg-gradient-primary hover:bg-gradient-secondary"
                    >
                      🛒 Add to Cart
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CartPanel cart={cart} {...cartActions} />
          </div>
        </div>
      </div>
    </div>
  );
}
