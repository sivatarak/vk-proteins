import { prisma } from "../lib/prisma";
import UserClient from "./userClient";

export default async function UserPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true }
  });

  return <UserClient products={products} />;
}
