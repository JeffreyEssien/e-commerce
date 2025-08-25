"use client";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor_id: string;
}

type UpdateQuantityFn = (productId: string, quantity: number) => void;
type RemoveFromCartFn = (productId: string) => void;
type ClearCartFn = () => void;

interface CartPanelProps {
  cart: CartItem[];
  removeFromCart: RemoveFromCartFn;
  updateQuantity: UpdateQuantityFn;
  clearCart: ClearCartFn;
}

export default function CartPanel({
  cart,
  removeFromCart,
  updateQuantity,
  clearCart,
}: CartPanelProps) {
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);

    try {
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
        toast.error("Checkout failed. Please try again.");
      } else {
        toast.success("🎉 Order placed successfully!");
        clearCart();
        setCheckoutForm({ name: "", phone: "", address: "" });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong during checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card sticky top-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gradient-primary">
          🛒 Your Cart
        </h2>
        {cart.length > 0 && (
          <motion.button
            onClick={clearCart}
            className="text-white/60 hover:text-white/80 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear All
          </motion.button>
        )}
      </div>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="text-4xl mb-3">🛒</div>
          <p className="text-white/70 mb-4">Your cart is empty</p>
          <p className="text-white/50 text-sm">
            Add some products to get started!
          </p>
        </motion.div>
      ) : (
        <>
          {/* Customer Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 space-y-3"
          >
            <h3 className="text-sm font-medium text-white/80 mb-3">
              📋 Contact Details
            </h3>
            <input
              type="text"
              placeholder="👤 Full Name"
              value={checkoutForm.name}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="glass-input w-full"
            />
            <input
              type="tel"
              placeholder="📞 Phone Number"
              value={checkoutForm.phone}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="glass-input w-full"
            />
            <textarea
              placeholder="📍 Delivery Address"
              value={checkoutForm.address}
              onChange={(e) =>
                setCheckoutForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="glass-input w-full h-20 resize-none"
              rows={3}
            />
          </motion.div>

          {/* Cart Items */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-medium text-white/80 mb-3">
              📦 Items ({cart.length})
            </h3>
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass bg-white/5 p-3 rounded-lg border border-white/10 hover-lift"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-medium text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gradient-tertiary font-semibold">
                        ₦{item.price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="glass-button w-6 h-6 text-xs"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </motion.button>
                      <span className="text-white/80 text-sm w-8 text-center">
                        {item.quantity}
                      </span>
                      <motion.button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="glass-button w-6 h-6 text-xs"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        +
                      </motion.button>
                    </div>
                    <motion.button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🗑️ Remove
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass bg-white/10 p-4 rounded-lg border border-white/20 mb-6"
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">Total:</span>
              <span className="text-xl font-bold text-gradient-tertiary">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </motion.div>

          {/* Checkout Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            disabled={isProcessing || !checkoutForm.name || !checkoutForm.phone || !checkoutForm.address}
            className={`glass-button w-full py-4 text-lg font-medium ${
              isProcessing || !checkoutForm.name || !checkoutForm.phone || !checkoutForm.address
                ? "opacity-50 cursor-not-allowed"
                : "bg-gradient-primary hover:bg-gradient-secondary"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Processing...
              </div>
            ) : (
              "✅ Checkout Now"
            )}
          </motion.button>

          {/* Security Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-white/50 text-center mt-3"
          >
            🔒 Your order will be processed securely
          </motion.p>
        </>
      )}
    </motion.div>
  );
}
