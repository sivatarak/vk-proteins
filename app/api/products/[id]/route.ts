import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// DELETE PRODUCT
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  // Await the params to get the actual value
  const { id } = await params;
  
  const productId = Number(id);

  if (!productId || isNaN(productId)) {
    return NextResponse.json(
      { error: "Invalid or missing product ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// UPDATE PRODUCT
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  // Await the params to get the actual value
  const { id } = await params;
  
  const productId = Number(id);

  if (!productId || isNaN(productId)) {
    return NextResponse.json(
      { error: "Invalid or missing product ID" },
      { status: 400 }
    );
  }

  const data = await req.json();

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("Update Error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// GET SINGLE PRODUCT (optional - if you need it)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid or missing product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}