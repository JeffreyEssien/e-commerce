"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Campus {
  id: string;
  name: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [campusId, setCampusId] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const router = useRouter();

  // Fetch campuses
  useEffect(() => {
    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from("campuses")
        .select("id, name");

      if (error) {
        toast.error("Failed to load campuses");
        return;
      }
      setCampuses((data as Campus[]) || []);
    };
    fetchCampuses();
  }, []);

  // Redirect by role
  const redirectByRole = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) return;

    const { role } = profile as { role: string };
    switch (role) {
      case "vendor":
        router.push("/vendors");
        break;
      case "customer":
        router.push("/customers");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        router.push("/");
    }
  };

  // Email login/signup
  const handleEmailAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password ||
      (!isLogin &&
        (!name || !role || !campusId || (role === "vendor" && (!shopName || !bio))))
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          toast.error(
            error.message === "Email not confirmed"
              ? "Please confirm your email before logging in."
              : error.message
          );
          return;
        }

        toast.success("🎉 Welcome back!");
        if (data.user?.id) await redirectByRole(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        const userId = data.user?.id;
        if (!userId) return;

        // Insert into users table
        await supabase.from("users").insert([
          {
            id: userId,
            email: cleanEmail,
            name,
            role,
            campus_id: campusId,
            wallet: 0,
          },
        ]);

        // Insert into vendors if vendor role
        if (role === "vendor") {
          const { error: vendorErr } = await supabase.from("vendors").insert([
            {
              id: userId,
              shop_name: shopName,
              plan: "free",
              rating: 0,
              ratings_count: 0,
              bio,
              email: cleanEmail,
              campus_id: campusId,
              status: "pending", // Vendors need admin approval
            },
          ]);

          if (vendorErr) {
            toast.error("Failed to create vendor profile");
            return;
          }
        }

        toast.success("🎉 Account created successfully! Please confirm your email to continue.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      toast.error("Google login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Background Elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-secondary opacity-20"
        animate={{ y: [-20, 20, -20], rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-gradient-tertiary opacity-20"
        animate={{ y: [20, -20, 20], rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/">
            <motion.h1 
              className="text-4xl font-bold text-gradient-primary mb-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              Prime Stores
            </motion.h1>
          </Link>
          <p className="text-white/70">
            {isLogin ? "Welcome back!" : "Join our campus marketplace"}
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.button
              onClick={() => setIsLogin(true)}
              className={`px-6 py-2 rounded-l-lg transition-all ${
                isLogin 
                  ? "bg-gradient-primary text-white" 
                  : "glass text-white/70 hover:text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Login
            </motion.button>
            <motion.button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-2 rounded-r-lg transition-all ${
                !isLogin 
                  ? "bg-gradient-primary text-white" 
                  : "glass text-white/70 hover:text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign Up
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailAuth();
              }}
              className="space-y-4"
            >
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <input
                  type="email"
                  placeholder="📧 Email Address"
                  className="glass-input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="🔒 Password"
                  className="glass-input w-full pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </motion.div>

              {/* Extra signup fields */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <input
                        type="text"
                        placeholder="👤 Full Name"
                        className="glass-input w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="glass-input w-full"
                        required
                      >
                        <option value="">🎭 Select Your Role</option>
                        <option value="customer">🛍️ Student/Customer</option>
                        <option value="vendor">🏪 Campus Vendor</option>
                      </select>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <select
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                        className="glass-input w-full"
                        required
                      >
                        <option value="">🏫 Select Your Campus</option>
                        {campuses.map((campus) => (
                          <option key={campus.id} value={campus.id}>
                            {campus.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <AnimatePresence>
                      {role === "vendor" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <input
                              type="text"
                              placeholder="🏪 Shop Name"
                              className="glass-input w-full"
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              required
                            />
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                          >
                            <textarea
                              placeholder="📝 Shop Description (Tell customers about your business)"
                              className="glass-input w-full h-20 resize-none"
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              required
                              rows={3}
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`glass-button w-full py-4 text-lg font-medium ${
                  isLoading 
                    ? "opacity-50 cursor-not-allowed" 
                    : "bg-gradient-primary hover:bg-gradient-secondary"
                }`}
                whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </div>
                ) : (
                  `${isLogin ? "🚀 Sign In" : "🎉 Create Account"}`
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="my-6 text-center text-sm text-white/50"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-2">or continue with</span>
              </div>
            </div>
          </motion.div>

          {/* Google Login */}
          <motion.button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="glass-button w-full py-3 bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
            whileHover={!isLoading ? { scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Connecting...
              </div>
            ) : (
              "🔴 Continue with Google"
            )}
          </motion.button>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-6 text-center"
          >
            <Link href="/">
              <motion.button 
                className="text-white/60 hover:text-white/80 text-sm"
                whileHover={{ scale: 1.05 }}
              >
                ← Back to Home
              </motion.button>
            </Link>
          </motion.div>

          {/* Terms Notice */}
          {!isLogin && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs text-white/50 text-center mt-4"
            >
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              {role === "vendor" && " Vendor accounts require admin approval."}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
