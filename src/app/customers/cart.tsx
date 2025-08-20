"use client";
import { useState } from "react";

export default function useCart() {
  const [cart, setCart] = useState<any[]>([]);

  const addToCart = (product: any) => {
  const { id, name, price, vendor_id, vendor } = product;

  if (!vendor_id) {
    console.warn("Missing vendor_id for product:", product);
  }
  

  setCart((prev) => {
    const existing = prev.find((item) => item.id === id);
    if (existing) {
      return prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [
      ...prev,
      {
        id,
        name,
        price,
        vendor_id,
        vendor_name: vendor?.shop_name || "Unknown Vendor",
        quantity: 1,
      },
    ];
  });
};

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart };
}