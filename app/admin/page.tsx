import { prisma } from "../lib/prisma";
import AdminClient from "./adminClient";

export default async function AdminPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" }
  });

  return <AdminClient initialProducts={products} />;
}
