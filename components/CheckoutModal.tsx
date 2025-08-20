"use client";
import React from "react";
import { useMarketplace, formatNGN } from "../store/marketplace";
import Modal from "../components/modal";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CheckoutModal({ open, onClose }: Props) {
  const { cart, products, removeFromCart, checkout } = useMarketplace();

  const total = cart.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? acc + product.price * item.quantity : acc;
  }, 0);

  const handleCheckout = () => {
    const res = checkout();
    if (res.ok) {
      toast.success(res.message || "Checkout successful!");
      onClose();
    } else {
      toast.error(res.message || "Checkout failed.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Confirm Checkout">
      <div className="space-y-4">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-sm">Your cart is empty.</p>
        ) : (
          <>
            <div className="space-y-2 max-h-60 overflow-auto">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {product.name} x{item.quantity}
                      </p>
                      <p className="text-gray-500">
                        {formatNGN(product.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">
                        {formatNGN(product.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => {
                          removeFromCart(item.productId);
                          toast("Item removed", { icon: "🗑️" });
                        }}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>{formatNGN(total)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Pay Now
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}