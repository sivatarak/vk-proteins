"use client";

import { useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.message || "Invalid credentials");
            return;
        }

        // Redirect based on role
        if (data.role === "admin") {
           window.location.href = "/admin/login";
        } else {
            window.location.href = "/user";
        }
    };


    return (
        <>
            {/* Full Screen Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-blue-50" />

            {/* Soft Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl" />
            </div>

            {/* Main Container - No Scroll Ever */}
            <div className="relative min-h-screen max-h-screen overflow-hidden flex items-center justify-center px-4 py-6">

                <div className="w-full max-w-sm sm:max-w-md">
                    {/* Card - Fixed Max Height */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 
                          max-h-[92vh] flex flex-col overflow-hidden">

                        {/* Header - Only Logo, Short Height */}
                        <div className="bg-gradient-to-br from-pink-500 via-orange-500 to-yellow-500 py-8 px-6 text-center flex-shrink-0">
                            <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-3xl shadow-xl border-4 border-white/50 overflow-hidden">
                                <img
                                    src="/Vk_protein_logo.jpg"
                                    alt="VK Proteins"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Form - Takes Remaining Space */}
                        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                            <div className="text-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                                <p className="text-gray-600 text-sm">Sign in to your account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition text-sm"
                                    required
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition text-sm"
                                    required
                                />

                                <div className="flex items-center justify-between text-xs">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-pink-600 rounded" />
                                        <span className="text-gray-600">Remember me</span>
                                    </label>
                                    <a href="#" className="text-pink-600 font-medium hover:underline">
                                        Forgot password?
                                    </a>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-98 transition disabled:opacity-60"
                                >
                                    {loading ? "Signing in..." : "Sign In"}
                                </button>
                            </form>

                            <div className="text-center pt-3 text-sm">
                                <span className="text-gray-600">New here? </span>
                                <a href="/register" className="text-pink-600 font-semibold hover:underline">
                                    Create account
                                </a>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pb-4 text-xs text-gray-500 flex-shrink-0">
                            © 2025 VK Proteins. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}