import { prisma } from "../lib/db";

export async function getAllCategories(){
try {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc", // Diurutkan alfabetis agar rapi di dropdown
    },
  });

  return categories;
} catch (error) {
  console.error("Error fetching categories:", error);
  throw new Error("Failed to fetch categories");
}
}