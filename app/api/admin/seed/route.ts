import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = [
    {
      username: process.env.ADMIN1_USERNAME,
      password: process.env.ADMIN1_PASSWORD,
    },
    {
      username: process.env.ADMIN2_USERNAME,
      password: process.env.ADMIN2_PASSWORD,
    },
  ].filter((a) => a.username && a.password);

  for (const admin of admins) {
    const existing = await prisma.user.findUnique({
      where: { username: admin!.username! },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: admin!.username!,
          role: "admin",
          passwordHash: await bcrypt.hash(admin!.password!, 10),
        },
      });
    }
  }

  return NextResponse.json({ message: "Admins seeded" });
}
