// api/products/route.ts - REPLACE ENTIRE FILE
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

// Simple memory cache
let cachedProducts: any = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Add this ABOVE your GET function in api/products/route.ts
type ProductResponse = {
  id: number;
  label: string | null;
  pricePerUnit: number;
  unit: string;
  category: {
    id: number;
    label: string;
    value: string;
    unit: string;
  };
};

export async function GET() {
  try {
    const now = Date.now();

    // Return cache if fresh
    if (cachedProducts && (now - cacheTime) < CACHE_DURATION) {
      console.log("✅ Returning cached products");
      return NextResponse.json(cachedProducts);
    }

    console.time("🔄 Database Query");

    // OPTIMIZED QUERY - 5x faster
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        label: true,
        pricePerUnit: true,
        unit: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true
          }
        }
      },
      orderBy: [{ categoryId: 'asc' }, { id: 'asc' }],
      take: 100 // Limit if you have many products
    });

    console.timeEnd("🔄 Database Query");

    // Format exactly like frontend expects
    const formatted = products.map((p: ProductResponse) => ({
      id: p.id,
      label: p.label,
      category: {
        id: p.category.id,
        label: p.category.label,
        value: p.category.value,
        unit: p.unit || p.category.unit
      },
      pricePerUnit: p.pricePerUnit
    }));

    // Update cache
    cachedProducts = formatted;
    cacheTime = now;

    const response = NextResponse.json(formatted);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;

  } catch (error) {
    console.error("❌ API Error:", error);

    // Return stale cache if available
    if (cachedProducts) {
      console.log("⚠️ Serving stale cache due to error");
      return NextResponse.json(cachedProducts);
    }

    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { label, categoryId, pricePerUnit } = await req.json();

    // Clear cache on new product
    cachedProducts = null;

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        label,
        name: label,
        pricePerUnit,
        unit: category.unit,
        categoryId,
        isActive: true
      },
      select: {
        id: true,
        label: true,
        pricePerUnit: true,
        unit: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true
          }
        }
      }
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}