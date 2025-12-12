import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const { label, unit } = await req.json();

    if (!label || !unit) {
      return NextResponse.json(
        { message: "Label and unit are required" },
        { status: 400 }
      );
    }

    const value = label.trim().toLowerCase().replace(/\s+/g, "_");

    const category = await prisma.category.create({
      data: {
        label: label.trim(),
        value,
        unit,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories ERROR:", err);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}
