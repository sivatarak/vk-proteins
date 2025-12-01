import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid username" }), { status: 400 });
    }

    if (user.passwordHash !== password) {
      return new Response(JSON.stringify({ message: "Invalid password" }), { status: 400 });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 🔥 IMPORTANT — FIX COOKIE FOR VERCEL & MOBILE
    (await
      // 🔥 IMPORTANT — FIX COOKIE FOR VERCEL & MOBILE
      cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: true, // <— required on vercel https
      sameSite: "none", // <— required on mobile
      path: "/",        // <— allow full-app access
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ success: true, role: user.role }), { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
