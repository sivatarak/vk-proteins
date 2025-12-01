"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [toast, setToast] = useState({ show: false, type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type: "", msg: "" }), 2500);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (username.trim().length < 3) {
      showToast("error", "Username should be at least 3 characters!");
      setLoading(false);
      return;
    }

    if (password.trim().length < 4) {
      showToast("error", "Password must be at least 4 characters!");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      showToast("error", data.message || "Registration failed");
      return;
    }

    showToast("success", "Registered successfully!");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-yellow-100 flex items-center justify-center px-4">

      <div className="bg-white/70 backdrop-blur-xl shadow-2xl border border-white/40 rounded-3xl p-10 w-full max-w-md animate-fadeIn">
        <h1 className="text-3xl font-bold text-center text-pink-600 mb-8">
          Create your Account
        </h1>

        <form className="space-y-6" onSubmit={handleRegister}>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-pink-600 shadow-sm transition outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-pink-600 shadow-sm transition outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPass ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:scale-105 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xl transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-700 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600 font-semibold">
            Login
          </a>
        </p>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white flex items-center gap-3
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
