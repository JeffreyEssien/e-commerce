"use client";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { useState } from "react";

export default function CartPanel({
  cart,
  removeFromCart,
  updateQuantity,
  clearCart,
}: {
  cart: any[];
  removeFromCart: Function;
  updateQuantity: Function;
  clearCart: Function;
}) {
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const customerId = session?.user?.id;
    if (!customerId) {
      toast.error("Please log in to checkout");
      return;
    }

    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) {
      toast.error("Please fill in all contact details");
      return;
    }

    const orderItems = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      vendor_id: item.vendor_id,
      customer_id: customerId,
      customer_name: checkoutForm.name,
      customer_phone: checkoutForm.phone,
      customer_address: checkoutForm.address,
      total_price: item.price * item.quantity,
      status: "pending",
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("orders").insert(orderItems);

    if (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed");
    } else {
      toast.success("Order placed successfully");
      clearCart();
      setCheckoutForm({ name: "", phone: "", address: "" });
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
    >
      <h2 className="text-xl font-semibold mb-4">🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {/* Customer Contact Form */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Full Name"
              value={checkoutForm.name}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="border p-2 rounded w-full"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={checkoutForm.phone}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="border p-2 rounded w-full"
            />
            <textarea
              placeholder="Delivery Address"
              value={checkoutForm.address}
              onChange={(e) =>
                setCheckoutForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Cart Items */}
          <div className="space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₦{item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value))
                      }
                      className="w-12 text-center border rounded"
                    />
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Total */}
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-indigo-600 font-bold">₦{total}</span>
            </div>

            {/* Checkout Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              ✅ Checkout
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}