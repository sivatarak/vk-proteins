// app/user/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "../lib/prisma";
import UserClient from "./userClient";

export default async function UserPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" }
  });

  return <UserClient products={products} />;
}
