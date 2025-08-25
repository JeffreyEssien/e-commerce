"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Campus {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  campus_id: string;
  image_url?: string;
  vendor_id: string;
  status: string;
}

interface NewProductForm {
  name: string;
  price: string;
  category: string;
  campus_id: string;
  imageFile: File | null;
}

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    price: "",
    category: "",
    campus_id: "",
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    const { data, error } = await supabase.from("campuses").select("id, name");
    if (error) {
      toast.error("Failed to load campuses");
    } else {
      setCampuses((data as Campus[]) || []);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const vendorId = session?.user?.id;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts((data as Product[]) || []);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      toast.error("Image upload failed");
      return null;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addProduct = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const vendorId = session?.user?.id;

    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.category ||
      !newProduct.campus_id
    ) {
      toast.error("Please fill out all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (newProduct.imageFile) {
        imageUrl = await handleImageUpload(newProduct.imageFile);
      }

      const { error } = await supabase.from("products").insert([
        {
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          vendor_id: vendorId,
          campus_id: newProduct.campus_id,
          image_url: imageUrl,
          status: "pending", // Products need admin approval
        },
      ]);

      if (error) {
        toast.error("Failed to add product");
      } else {
        toast.success("🎉 Product added successfully! Awaiting admin approval.");
        setNewProduct({
          name: "",
          price: "",
          category: "",
          campus_id: "",
          imageFile: null,
        });
        setImagePreview(null);
        fetchProducts();
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted successfully");
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    pending: products.filter(p => p.status === "pending").length,
    suspended: products.filter(p => p.status === "suspended").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Products", value: stats.total, icon: "📦", color: "text-gradient-primary" },
          { label: "Active", value: stats.active, icon: "✅", color: "text-gradient-tertiary" },
          { label: "Pending Approval", value: stats.pending, icon: "⏳", color: "text-gradient-secondary" },
          { label: "Suspended", value: stats.suspended, icon: "⚠️", color: "text-red-400" },
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

      {/* Add Product Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-bold text-gradient-primary mb-6">
          ➕ Add New Product
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="🏷️ Product Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct((p) => ({ ...p, name: e.target.value }))
            }
            className="glass-input"
          />

          <input
            type="number"
            placeholder="💰 Price (₦)"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct((p) => ({ ...p, price: e.target.value }))
            }
            className="glass-input"
          />

          <select
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct((p) => ({ ...p, category: e.target.value }))
            }
            className="glass-input"
          >
            <option value="">📂 Select Category</option>
            <option value="Food & Snacks">🍕 Food & Snacks</option>
            <option value="Fashion">👕 Fashion</option>
            <option value="Electronics">📱 Electronics</option>
            <option value="Books & Stationery">📚 Books & Stationery</option>
            <option value="Accessories">👜 Accessories</option>
            <option value="Services">🔧 Services</option>
            <option value="Other">🔖 Other</option>
          </select>

          <select
            value={newProduct.campus_id}
            onChange={(e) =>
              setNewProduct((p) => ({ ...p, campus_id: e.target.value }))
            }
            className="glass-input"
          >
            <option value="">🏫 Select Campus</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <motion.label
          whileHover={{ scale: 1.02 }}
          className="glass border-2 border-dashed border-white/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-white/50 transition-all mb-4"
        >
          <span className="text-white/80 font-medium mb-2">
            📷 Click or Drop to Add Product Image
          </span>
          <span className="text-white/60 text-sm mb-3">
            JPG, PNG or GIF (Max 5MB)
          </span>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Image
                src={imagePreview}
                alt="Preview"
                width={120}
                height={120}
                className="object-cover rounded-lg shadow-lg"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setImagePreview(null);
                  setNewProduct(p => ({ ...p, imageFile: null }));
                }}
                className="absolute -top-2 -right-2 glass-button w-6 h-6 text-xs"
              >
                ×
              </button>
            </motion.div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
              }
              setNewProduct((p) => ({ ...p, imageFile: file }));
              if (file) setImagePreview(URL.createObjectURL(file));
            }}
          />
        </motion.label>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={addProduct}
          disabled={isSubmitting}
          className={`glass-button w-full py-4 text-lg font-medium ${
            isSubmitting 
              ? "opacity-50 cursor-not-allowed" 
              : "bg-gradient-primary hover:bg-gradient-secondary"
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
              Adding Product...
            </div>
          ) : (
            "➕ Add Product"
          )}
        </motion.button>
      </motion.div>

      {/* Products List */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gradient-secondary mb-4 md:mb-0">
            📦 Your Products ({filteredProducts.length})
          </h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input flex-1 md:w-64"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card animate-pulse">
                <div className="h-32 bg-white/20 rounded-lg mb-4" />
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/20 rounded w-1/2 mb-4" />
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
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              No Products Found
            </h3>
            <p className="text-white/70">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search or filter criteria" 
                : "Start by adding your first product above"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                  className="glass-card hover-lift hover-glow group relative"
                >
                  {/* Status Badge */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === "active" 
                      ? "bg-gradient-tertiary text-white" 
                      : product.status === "pending"
                      ? "bg-gradient-secondary text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    {product.status === "active" ? "✅ Active" : 
                     product.status === "pending" ? "⏳ Pending" : "⚠️ Suspended"}
                  </div>

                  {/* Product Image */}
                  {product.image_url ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative mb-4 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={400}
                        height={200}
                        className="object-cover w-full h-32"
                      />
                    </motion.div>
                  ) : (
                    <div className="glass bg-white/5 h-32 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gradient-primary transition-all">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold text-gradient-tertiary">
                        ₦{product.price.toLocaleString()}
                      </span>
                      <span className="glass bg-white/10 px-2 py-1 rounded-full text-xs text-white/70">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      🏫 {campuses.find(c => c.id === product.campus_id)?.name || "Unknown Campus"}
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this product?")) {
                        deleteProduct(product.id);
                      }
                    }}
                    className="glass-button w-full bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
                  >
                    🗑️ Delete Product
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
