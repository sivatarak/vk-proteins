// /api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
   GET SINGLE PRODUCT
   ───────────────────────────────────────────── */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        label: true,
        name: true,
        pricePerUnit: true,
        isActive: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true, // ✅ ONLY SOURCE OF UNIT
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("GET Product Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────
   UPDATE PRODUCT
   ───────────────────────────────────────────── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const data = await req.json();

    // ── Validation ──
    if (!data.label || !data.label.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!data.pricePerUnit || Number(data.pricePerUnit) <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    const categoryId = Number(data.categoryId);
    console.log("Category ID:", categoryId);
    console.log("Data:", data);
    if (!categoryId || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // ── Update ──
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        label: data.label.trim(),
        name: data.label.trim(),
        pricePerUnit: Number(Number(data.pricePerUnit).toFixed(2)),
        categoryId,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        label: true,
        name: true,
        pricePerUnit: true,
        isActive: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

  } catch (error: any) {
    console.error("Update Error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────
   DELETE PRODUCT (SOFT DELETE)
   ───────────────────────────────────────────── */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }, // ✅ SOFT DELETE
    });

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch (error: any) {
    console.error("Delete Error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
