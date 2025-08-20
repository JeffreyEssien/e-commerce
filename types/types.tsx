export type Role = "customer" | "vendor" | "admin";

export interface Campus {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  campusId: string;
  wallet: number; // demo wallet for boosts/checkout
  referralCode?: string;
  referredBy?: string;
}

export interface Vendor extends User {
  shopName: string;
  plan: "free" | "premium";
  rating: number;
  ratingsCount: number;
  bio?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  campusId: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  images: string[];
  status: "pending" | "active" | "suspended";
  featuredUntil?: number; // timestamp for boosted visibility
  createdAt: number;
}

export interface Order {
  id: string;
  productId: string;
  vendorId: string;
  buyerId: string;
  campusId: string;
  quantity: number;
  amount: number;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  createdAt: number;
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  rating: number; // 1..5
  comment?: string;
  createdAt: number;
}

export interface AdSlot {
  id: string;
  title: string;
  position: "banner" | "sidebar" | "inline";
  vendorId?: string;
  active: boolean;
  price: number;
}