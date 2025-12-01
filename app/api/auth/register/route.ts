import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/hash";
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

    const exists = await prisma.user.findUnique({
      where: { username }
    });

    if (exists) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashed,
        role: "user"
      }
    });

    // Auto-login after register
    const token = signToken({
      id: user.id,
      role: user.role,
      username: user.username
    });

    const res = NextResponse.json({
      message: "Registered successfully",
      role: "user"
    });

    res.cookies.set("vk_token", token, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
