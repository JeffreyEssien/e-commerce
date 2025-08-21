"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

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
      toast.success("Vendor approved");
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
      toast.success("Product approved");
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

  const filteredVendors = vendors.filter((v) =>
    productsByVendor[v.id]?.length &&
    (v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Admin Panel</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search vendors..."
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 p-6 rounded-xl border border-gray-200"
            >
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-300 rounded w-full mb-2" />
              <div className="h-3 bg-gray-300 rounded w-2/3 mb-4" />
              <div className="h-10 bg-gray-300 rounded w-full" />
            </div>
          ))}
        </motion.div>
      ) : filteredVendors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500"
        >
          No pending product requests.
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredVendors.map((vendor) => (
            <motion.div
              key={vendor.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  {vendor.shop_name}
                </h2>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {vendor.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{vendor.email}</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-3">{vendor.bio}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Rating: ⭐ {vendor.rating?.toFixed(1) || "0.0"}</span>
                <span>Reviews: {vendor.ratings_count || 0}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Campus: {campuses[vendor.campus_id] || "Unknown"}
              </p>

              {vendor.status === "pending" && (
                <button
                  onClick={() => approveVendor(vendor.id)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition mb-4"
                >
                  ✅ Approve Vendor
                </button>
              )}

              <div className="space-y-2">
                {productsByVendor[vendor.id]?.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">₦{product.price}</p>
                    </div>
                    {product.status === "pending" ? (
                      <button
                        onClick={() => approveProduct(product.id)}
                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        ✅ Approve
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Approved</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}