"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid"; // Optional: or simple uid function
import type {
  AdSlot,
  Campus,
  Order,
  Product,
  Review,
  User,
  Vendor,
} from "../types/types";

function uid() {
  // small uid to avoid installing nanoid if you prefer
  return Math.random().toString(36).slice(2, 10);
}

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export const formatNGN = (n: number) => NGN.format(n);

type Store = {
  campuses: Campus[];
  currentCampusId: string;
  currentUserId: string | null;

  users: User[];
  vendors: Vendor[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  ads: AdSlot[];

  cart: { productId: string; quantity: number }[];

  // computed
  currentUser: () => User | Vendor | null;

  // auth/demo
  switchUser: (userId: string) => void;
  setCampus: (campusId: string) => void;

  // customer
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: () => { ok: boolean; message: string };

  // vendor
  addProduct: (p: Omit<Product, "id" | "createdAt" | "status">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  fulfillOrder: (orderId: string) => void;
  boostProduct: (productId: string, days: number, cost: number) => { ok: boolean; message: string };

  // admin
  approveListing: (productId: string) => void;
  suspendListing: (productId: string) => void;
  changeVendorPlan: (vendorId: string, plan: "free" | "premium") => void;

  // reviews
  leaveReview: (productId: string, rating: number, comment?: string) => { ok: boolean; message: string };

  // seed
  seed: () => void;
};

export const useMarketplace = create<Store>()(
  persist(
    (set, get) => ({
      campuses: [
        { id: "unilag", name: "UNILAG" },
        { id: "uniben", name: "UNIBEN" },
        { id: "ui", name: "UI Ibadan" },
      ],
      currentCampusId: "unilag",
      currentUserId: null,

      users: [],
      vendors: [],
      products: [],
      orders: [],
      reviews: [],
      ads: [],

      cart: [],

      currentUser: () => {
        const { currentUserId, users, vendors } = get();
        if (!currentUserId) return null;
        return vendors.find((v) => v.id === currentUserId) || users.find((u) => u.id === currentUserId) || null;
      },

      switchUser: (userId) => set({ currentUserId: userId }),
      setCampus: (campusId) => set({ currentCampusId: campusId }),

      addToCart: (productId, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((c) => c.productId === productId);
          const cart = existing
            ? s.cart.map((c) =>
                c.productId === productId
                  ? { ...c, quantity: c.quantity + qty }
                  : c
              )
            : [...s.cart, { productId, quantity: qty }];
          return { cart };
        }),

      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),

      clearCart: () => set({ cart: [] }),

      checkout: () => {
        const s = get();
        const user = s.currentUser();
        if (!user || user.role !== "customer") {
          return { ok: false, message: "Please login as a customer." };
        }
        const items = s.cart;
        if (items.length === 0) return { ok: false, message: "Cart is empty." };

        let total = 0;
        const newOrders: Order[] = [];
        for (const item of items) {
          const product = s.products.find((p) => p.id === item.productId && p.status === "active");
          if (!product) continue;
          const amount = product.price * item.quantity;
          total += amount;
          newOrders.push({
            id: uid(),
            productId: product.id,
            vendorId: product.vendorId,
            buyerId: user.id,
            campusId: product.campusId,
            quantity: item.quantity,
            amount,
            status: "paid",
            createdAt: Date.now(),
          });
        }

        if (user.wallet < total) return { ok: false, message: "Insufficient wallet balance." };

        // debit buyer
        const updatedUsers = s.users.map((u) =>
          u.id === user.id ? { ...u, wallet: u.wallet - total } : u
        );

        // credit vendors
        const updatedVendors = s.vendors.map((v) => {
          const vendorOrders = newOrders.filter((o) => o.vendorId === v.id);
          const sum = vendorOrders.reduce((acc, o) => acc + o.amount, 0);
          return sum ? { ...v, wallet: v.wallet + sum } : v;
        });

        set({
          orders: [...s.orders, ...newOrders],
          users: updatedUsers,
          vendors: updatedVendors,
          cart: [],
        });

        return { ok: true, message: `Checkout successful: ${formatNGN(total)}` };
      },

      addProduct: (p) =>
        set((s) => {
          const prod: Product = {
            ...p,
            id: uid(),
            createdAt: Date.now(),
            status: "pending",
          };
          return { products: [prod, ...s.products] };
        }),

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      fulfillOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "fulfilled" } : o)),
        })),

      boostProduct: (productId, days, cost) => {
        const s = get();
        const user = s.currentUser();
        if (!user || user.role !== "vendor") return { ok: false, message: "Vendor login required." };

        if (user.wallet < cost) return { ok: false, message: "Insufficient wallet." };

        const until = Date.now() + days * 24 * 60 * 60 * 1000;

        set({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, featuredUntil: until } : p
          ),
          vendors: s.vendors.map((v) =>
            v.id === user.id ? { ...v, wallet: v.wallet - cost } : v
          ),
        });

        return { ok: true, message: `Boosted for ${days} day(s).` };
      },

      approveListing: (productId) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, status: "active" } : p
          ),
        })),

      suspendListing: (productId) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, status: "suspended" } : p
          ),
        })),

      changeVendorPlan: (vendorId, plan) =>
        set((s) => ({
          vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, plan } : v)),
        })),

      leaveReview: (productId, rating, comment) => {
        const s = get();
        const user = s.currentUser();
        if (!user || user.role !== "customer") return { ok: false, message: "Customer login required." };

        const review: Review = {
          id: uid(),
          productId,
          buyerId: user.id,
          rating,
          comment,
          createdAt: Date.now(),
        };

        // update vendor/product aggregates
        const product = s.products.find((p) => p.id === productId);
        if (!product) return { ok: false, message: "Product not found." };
        const vendorId = product.vendorId;

        const vendor = s.vendors.find((v) => v.id === vendorId);
        if (vendor) {
          const newCount = vendor.ratingsCount + 1;
          const newAvg = (vendor.rating * vendor.ratingsCount + rating) / newCount;
          set({
            vendors: s.vendors.map((v) =>
              v.id === vendorId ? { ...v, rating: newAvg, ratingsCount: newCount } : v
            ),
          });
        }

        set({ reviews: [review, ...s.reviews] });
        return { ok: true, message: "Review submitted." };
      },

      seed: () =>
        set(() => {
          const campusId = "unilag";
          const admin: User = {
            id: "admin1",
            name: "Admin",
            role: "admin",
            campusId,
            wallet: 0,
            referralCode: "ADMIN",
          };
          const customer: User = {
            id: "cust1",
            name: "Jeffrey",
            role: "customer",
            campusId,
            wallet: 100000,
            referralCode: "JEFF10",
          };
          const vendor: Vendor = {
            id: "vend1",
            name: "Ada",
            role: "vendor",
            campusId,
            wallet: 20000,
            shopName: "Campus Threads",
            plan: "premium",
            rating: 4.6,
            ratingsCount: 23,
            bio: "Trendy wearables for students",
            referralCode: "ADA5",
          };
          const vendor2: Vendor = {
            id: "vend2",
            name: "Femi",
            role: "vendor",
            campusId,
            wallet: 12000,
            shopName: "Tasty Bites",
            plan: "free",
            rating: 4.2,
            ratingsCount: 14,
            bio: "Snacks & quick bites",
            referralCode: "FEMI9",
          };

          const products: Product[] = [
            {
              id: "p1",
              vendorId: vendor.id,
              campusId,
              name: "Vintage Hoodie",
              price: 7500,
              description: "Cozy and stylish hoodie",
              category: "Fashion",
              images: [],
              status: "active",
              featuredUntil: Date.now() + 2 * 86400000,
              createdAt: Date.now() - 86400000,
            },
            {
              id: "p2",
              vendorId: vendor2.id,
              campusId,
              name: "Chicken Pie",
              price: 500,
              description: "Freshly baked daily",
              category: "Food & Snacks",
              images: [],
              status: "active",
              createdAt: Date.now() - 43200000,
            },
          ];

          const ads: AdSlot[] = [
            { id: "ad1", title: "Barber Promo", position: "banner", active: true, price: 5000 },
          ];

          return {
            currentCampusId: campusId,
            currentUserId: customer.id,
            users: [admin, customer],
            vendors: [vendor, vendor2],
            products,
            orders: [],
            reviews: [],
            ads,
          };
        }),
    }),
    { name: "campus-marketplace" }
  )
);