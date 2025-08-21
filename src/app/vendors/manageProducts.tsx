"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const vendorId = session?.user?.id;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts((data as Product[]) || []);
    }
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
        status: "active",
      },
    ]);

    if (error) {
      toast.error("Failed to add product");
    } else {
      toast.success("Product added 🎉");
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
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add Product Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-xl shadow-md bg-white border border-gray-200"
      >
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>

        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, name: e.target.value }))
          }
          className="border p-2 rounded w-full mb-2"
        />

        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, price: e.target.value }))
          }
          className="border p-2 rounded w-full mb-2"
        />

        <select
          value={newProduct.category}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, category: e.target.value }))
          }
          className="border p-2 rounded w-full mb-2"
        >
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Clothing">Clothing</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Accessories">Accessories</option>
        </select>

        <select
          value={newProduct.campus_id}
          onChange={(e) =>
            setNewProduct((p) => ({ ...p, campus_id: e.target.value }))
          }
          className="border p-2 rounded w-full mb-2"
        >
          <option value="">Select Campus</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="border-2 border-dashed border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition">
          <span className="text-gray-600 font-medium">
            📷 Click or Drop to Add Image
          </span>
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="Preview"
              width={80}
              height={80}
              className="mt-2 object-cover rounded-lg shadow"
            />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setNewProduct((p) => ({ ...p, imageFile: file }));
              if (file) setImagePreview(URL.createObjectURL(file));
            }}
          />
        </label>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={addProduct}
          className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          ➕ Add Product
        </motion.button>
      </motion.div>

      {/* Product List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition"
              >
                {p.image_url && (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    width={400}
                    height={200}
                    className="object-cover rounded-md mb-2"
                  />
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500">₦{p.price}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
                <p className="text-xs text-gray-400">Campus: {p.campus_id}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteProduct(p.id)}
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}