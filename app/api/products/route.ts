import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" }
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/products ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const product = await prisma.product.create({
      data: {
        name: data.label,
        label: data.label,
        category: data.category,
        unit: data.unit,
        pricePerUnit: Number(data.pricePerUnit),
        isActive: true
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/products ERROR:", err);
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}
