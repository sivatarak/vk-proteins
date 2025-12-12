import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Option 1: Direct approach with await
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params Promise first
  const { id } = await params;
  const categoryId = Number(id);

  if (!categoryId || isNaN(categoryId)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    const usedCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    if (usedCount > 0) {
      return NextResponse.json(
        { message: `Category is used by ${usedCount} product(s)` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE /api/categories/[id] ERROR:", err);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}

// Option 2: Alternative with type guard
export async function DELETE2(
  req: Request,
  context: { params: any }
) {
  // Helper to extract params safely
  const extractId = async () => {
    if (context.params && typeof context.params.then === 'function') {
      // It's a Promise
      const params = await context.params;
      return params.id;
    } else {
      // It's already resolved
      return context.params.id;
    }
  };

  const idString = await extractId();
  const categoryId = Number(idString);

  if (!categoryId || isNaN(categoryId)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    const usedCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    if (usedCount > 0) {
      return NextResponse.json(
        { message: `Category is used by ${usedCount} product(s)` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE /api/categories/[id] ERROR:", err);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}

// Option 3: Using NextRequest (if available)
export async function DELETE3(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const categoryId = Number(id);

  if (!categoryId || isNaN(categoryId)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  try {
    const usedCount = await prisma.product.count({
      where: { categoryId: categoryId },
    });

    if (usedCount > 0) {
      return NextResponse.json(
        { message: `Category is used by ${usedCount} product(s)` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE /api/categories/[id] ERROR:", err);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}