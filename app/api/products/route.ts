import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// GET ALL PRODUCTS
export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(products);
}

// CREATE PRODUCT
export async function POST(req: Request) {
  const body = await req.json();

  const { label, categoryId, pricePerUnit } = body;

  if (!label || !categoryId || !pricePerUnit) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get unit from category
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  // Create product safely
  const product = await prisma.product.create({
    data: {
      label,
      name: label, // 👈 AUTO-FILL NAME
      pricePerUnit,
      unit: category.unit, // 👈 AUTO-FILL UNIT
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json(product);
}
