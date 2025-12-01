import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ------- UPDATE PRODUCT -------
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;      // <-- FIXED
  const data = await req.json();

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      label: data.label,
      category: data.category,
      unit: data.unit,
      pricePerUnit: Number(data.pricePerUnit),
      isActive: data.isActive
    }
  });

  return NextResponse.json(product);
}

// ------- DELETE PRODUCT -------
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;      // <-- FIXED

  if (!id) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.product.update({
      where: { id: Number(id) },
      data: { isActive: false } // SOFT DELETE
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
