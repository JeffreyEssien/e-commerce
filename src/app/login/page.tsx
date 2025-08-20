"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [campusId, setCampusId] = useState("");
  const [shopName, setShopName] = useState("");
  const [bio, setBio] = useState("");
  const [campuses, setCampuses] = useState<any[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // Fetch campuses from Supabase
  useEffect(() => {
    const fetchCampuses = async () => {
      const { data, error } = await supabase.from("campuses").select("id, name");
      if (error) {
        toast.error("Failed to load campuses");
      } else {
        setCampuses(data);
      }
    };
    fetchCampuses();
  }, []);

  const redirectByRole = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) return;

  switch (profile.role) {
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
      router.push("/"); // fallback
  }
};

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

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
          toast.error("Please confirm your email before logging in.");
        } else toast.error(error.message);
        return;
      }

      toast.success("Logged in");
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

      // Insert into vendors table if role is vendor
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
          },
        ]);

        if (vendorErr) {
          toast.error("Failed to create vendor profile");
          return;
        }
      }

      toast.success("Account created — please confirm your email");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) toast.error("Google login failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? "Login" : "Create an Account"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full name"
              className="w-full mb-3 p-3 border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mb-3 p-3 border rounded"
            >
              <option value="">Select role</option>
              <option value="vendor">Vendor</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className="w-full mb-3 p-3 border rounded"
            >
              <option value="">Select campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>

            {role === "vendor" && (
              <>
                <input
                  type="text"
                  placeholder="Shop Name"
                  className="w-full mb-3 p-3 border rounded"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
                <textarea
                  placeholder="Shop Bio"
                  className="w-full mb-3 p-3 border rounded"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </>
            )}
          </>
        )}

        <button
          onClick={handleEmailAuth}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <div className="my-4 text-center text-sm text-gray-500">or</div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}