// app/admin/page.tsx
import { prisma } from "../lib/prisma";
import AdminClient from "./adminClient";

export default async function AdminPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: { category: true }, // important
    }),
    prisma.category.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <AdminClient
      initialProducts={products as any}
      initialCategories={categories as any}
    />
  );
}
