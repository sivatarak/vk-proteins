// /api/products/[id]/route.ts - COMPLETE PRODUCTION READY
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET SINGLE PRODUCT
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
        unit: true,
        isActive: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true,
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Format response with proper unit
    const formattedProduct = {
      ...product,
      unit: product.unit || product.category?.unit || "pcs",
      category: product.category ? {
        ...product.category,
        unit: product.unit || product.category.unit || "pcs"
      } : null
    };

    return NextResponse.json(formattedProduct);

  } catch (err: any) {
    console.error("GET Product Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// UPDATE PRODUCT - OPTIMIZED VERSION
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

    // Validate required fields
    if (!data.label && data.label !== "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!data.pricePerUnit || data.pricePerUnit <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    if (!data.categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    console.time(`Update Product ${productId}`);

    // Get category unit if not provided
    if (!data.unit && data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { unit: true }
      });
      
      if (category) {
        data.unit = category.unit;
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        label: data.label,
        name: data.label, // Ensure name is synced
        pricePerUnit: parseFloat(data.pricePerUnit.toFixed(2)),
        unit: data.unit,
        categoryId: data.categoryId,
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      select: {
        id: true,
        label: true,
        name: true,
        pricePerUnit: true,
        unit: true,
        isActive: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            label: true,
            value: true,
            unit: true,
          }
        }
      },
    });

    console.timeEnd(`Update Product ${productId}`);

    // Ensure unit is present
    const formattedProduct = {
      ...product,
      unit: product.unit || product.category?.unit || "pcs"
    };

    return NextResponse.json(formattedProduct);

  } catch (err: any) {
    console.error("Update Error:", err);

    if (err.code === 'P2025') {
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

// DELETE PRODUCT - PRODUCTION OPTIMIZED
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ CRITICAL: Await params first
    const { id } = await params;
    const productId = Number(id);

    // Early validation
    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    console.time(`Delete Product ${productId}`);

    // ✅ Add timeout for safety
    const deletePromise = prisma.product.delete({
      where: { id: productId },
    });

    // Timeout after 3 seconds (faster for production)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Delete timeout")), 3000)
    );

    await Promise.race([deletePromise, timeoutPromise]);

    console.timeEnd(`Delete Product ${productId}`);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (err: any) {
    console.error("Delete Error:", err);

    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (err.message === "Delete timeout") {
      return NextResponse.json(
        { error: "Delete operation timed out. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}