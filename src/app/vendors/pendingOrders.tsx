"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";

interface ProductInfo {
  name: string;
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product?: ProductInfo;
}

// Shape returned directly by Supabase, where `product` comes back as an array
interface RawOrder {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product: { name: string }[] | null;
}

export default function PendingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const vendorId = session?.user?.id;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          quantity,
          total_price,
          status,
          created_at,
          customer_name,
          customer_phone,
          customer_address,
          product:product_id (
            name
          )
        `)
        .eq("vendor_id", vendorId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Order fetch error:", error);
        toast.error("Failed to load orders");
      } else {
        const normalized = (data as RawOrder[]).map((o) => ({
          ...o,
          product:
            Array.isArray(o.product) && o.product.length > 0
              ? o.product[0]
              : undefined,
        }));

        setOrders(normalized as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const markAsShipped = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "shipped" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success("Order status updated");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="space-y-4">
      {orders.length === 0 && <p>No pending orders found.</p>}
      {orders.map((order) => (
        <div
          key={order.id}
          className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">{order.product?.name}</h3>
            <p>Quantity: {order.quantity}</p>
            <p>Total: ₦{order.total_price}</p>
            <p className="text-sm text-gray-500">
              Ordered: {new Date(order.created_at).toLocaleString()}
            </p>
            <div className="mt-2 text-sm text-black">
              <p>📍 {order.customer_address || "No address provided"}</p>
              <p>📞 {order.customer_phone || "No phone number"}</p>
              <p>🧑 {order.customer_name || "No name provided"}</p>
            </div>
          </div>
          <button
            onClick={() => markAsShipped(order.id)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Mark Shipped
          </button>
        </div>
      ))}
    </div>
  );
}