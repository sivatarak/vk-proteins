import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { comparePassword } from "../../../lib/hash";
import { signToken } from "../../../lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      username: user.username
    });

    const res = NextResponse.json({ message: "Logged in", role: user.role });
    
    res.cookies.set("vk_token", token, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (e) {
    console.log(e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
