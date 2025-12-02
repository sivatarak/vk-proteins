import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

    // 🔥 Compare hashed password with entered password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return new Response(JSON.stringify({ message: "Invalid password" }), { status: 400 });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Set cookie (for Vercel / HTTPS)
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return new Response(JSON.stringify({ success: true, role: user.role }), { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}
