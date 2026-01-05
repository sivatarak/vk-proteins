// /api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
   GET ALL PRODUCTS (ACTIVE ONLY)
   ───────────────────────────────────────────── */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true }, // ✅ respects soft delete
      orderBy: [{ categoryId: "asc" }, { id: "asc" }],
      select: {
        id: true,
        label: true,
        pricePerUnit: true,
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

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "no-store", // ✅ no stale data
      },
    });
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────
   CREATE PRODUCT
   ───────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
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
    if (!categoryId || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }
    console.log("data:", data);
    // ── Create ──
    const product = await prisma.product.create({
      data: {
        label: data.label.trim(),
        name: data.label.trim(),
        pricePerUnit: Number(Number(data.pricePerUnit).toFixed(2)),
        categoryId,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        pricePerUnit: true,
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

    console.log("Created product:", product);

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("CREATE Product Error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
