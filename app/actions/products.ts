"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/db";
import { deleteProductImagesOnUpdate } from "./storage";
import { CreateProductInput, createProductSchema, updateProductSchema } from "../lib/validations/product";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export type ActionState = {
  success: boolean | null;
  msg: string;
  errors?: Record<string, string[]>;
};

export async function getProducts(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  categoryId?: string,
  includeAllStatus: boolean = false,
  storeProfileId?: string
) {
  try {
    // Menghitung berapa baris data yang harus dilewati
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      name: {
        contains: search,
        mode: "insensitive", // pencarian case-insensitive (tidak sensitif huruf besar/kecil)
      },
      deletedAt: null,
    };

    if (!includeAllStatus) {
      whereCondition.status = "ACTIVE";
    }

    if (categoryId && categoryId !== "all") {
      whereCondition.categoryId = categoryId;
    }

    if (storeProfileId) {
      whereCondition.storeProfileId = storeProfileId;
    }

    // Ambil data dan total data secara paralel demi efisiensi
    const [products, totalItems] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc", // Urutkan dari produk terbaru
        },
        include: {
          category: true,
          storeProfile: true,
          stocks: {
            include: {
              warehouse: true,
            },
          },
        },
      }),
      prisma.product.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data: products,
      metadata: {
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      data: [],
      metadata: {
        currentPage: 1,
        pageSize: limit,
        totalPages: 0,
        totalItems: 0,
      },
    };
  }
}

export async function getProductsById(idOrSlug: string) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        deletedAt: null,
      },
      include: {
        category: true,
        storeProfile: {
          include: {
            warehouses: true,
          },
        },
        stocks: {
          include: {
            warehouse: true,
          },
        },
        productReviews: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });

    return product;
  } catch (error) {
    console.error(`Error fetching product with ID/Slug ${idOrSlug}:`, error);
    return null;
  }
}

export async function createProduct(
  prevState: ActionState,
  data: CreateProductInput,
): Promise<ActionState> {
  const validatedFields = createProductSchema.safeParse(data);

  if (!validatedFields.success) {
    const formattedErrors = validatedFields.error.flatten().fieldErrors;
    console.log("Disini gan");
    return {
      success: false,
      msg: "Validation.common.invalidInput",
      errors: formattedErrors as Record<string, string[]>,
    };
  }

  try {
    const {
      name,
      slug,
      price,
      weight,
      description,
      isFeatured,
      status,
      categoryId,
      images,
      stocks,
    } = validatedFields.data;

    // Mapping ulang array:
    const mappedStocks = stocks.map((stock) => ({
      warehouseId: stock.id,
      size: stock.size || "ALL",
      qty: stock.qty,
    }));

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const employeeProfile = (session?.user as any)?.employeeProfile;

    if (role === "EMPLOYEE" && !employeeProfile?.canManageProducts) {
      return { success: false, msg: "Validation.server.error.unauthorized", errors: {} };
    }

    const storeProfileId = (session?.user as any)?.storeProfile?.id;
    if (!storeProfileId) {
      return { success: false, msg: "Validation.server.error.internal", errors: {} };
    }

    // Filter stocks for EMPLOYEE
    let allowedStocks = mappedStocks;
    if (role === "EMPLOYEE") {
      const allowedWarehouseIds = employeeProfile?.warehouses?.map((w: any) => w.id) || [];
      allowedStocks = mappedStocks.filter(s => allowedWarehouseIds.includes(s.warehouseId));
    }

    // Gabungkan qty jika ada kombinasi warehouse dan size yang sama (untuk menghindari P2002 Unique Constraint)
    const mergedStocksMap = new Map<string, number>();
    for (const stock of allowedStocks) {
      const key = `${stock.warehouseId}__${stock.size}`;
      mergedStocksMap.set(key, (mergedStocksMap.get(key) || 0) + stock.qty);
    }

    const finalStocks = Array.from(mergedStocksMap.entries()).map(([key, qty]) => {
      const [warehouseId, size] = key.split("__");
      return { warehouseId, size, qty };
    });

    // Logika simpan DB di sini (Prisma / Supabase / dll)
    await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          price,
          weight: weight ?? null,
          description,
          isFeatured,
          status,
          images: images,
          categoryId,
          storeProfileId: storeProfileId,
          stocks: {
            create: finalStocks,
          },
        },
      });

      await tx.productHistory.create({
        data: {
          productId: newProduct.id,
          userId: (session?.user as any).id,
          action: "CREATED",
        }
      });
    });

    revalidatePath("/seller/products");

    return {
      success: true,
      msg: "Validation.success.product.created",
      errors: {},
    };
  } catch (error) {
    console.log("Heree")
    console.error("Error executing createProduct:", error);
    return {
      success: false,
      msg: "Validation.server.error.internal",
      errors: {},
    };
  }
}

export interface UpdateProductPayload {
  id: string;
  name: string;
  slug: string;
  price: number;
  weight?: number | null;
  description: string;
  isFeatured: boolean;
  status: "DRAFT" | "ARCHIVED" | "ACTIVE" | "BLOCKED";
  categoryId: string;
  images: string[];
  stocks: { id: string; size: string; qty: number }[]; // id = warehouseId
}

export async function updateProduct(
  prevState: ActionState,
  payload: UpdateProductPayload,
): Promise<ActionState> {
  try {
    // 1. Validasi Payload menggunakan Zod safeParse
    const validation = updateProductSchema.safeParse(payload);

    if (!validation.success) {
      const firstErrorKey =
        validation.error.issues[0]?.message || "Validation.common.invalidInput";

      return {
        success: false,
        msg: firstErrorKey,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const {
      id,
      name,
      slug,
      price,
      weight,
      description,
      isFeatured,
      status,
      categoryId,
      images,
      stocks,
    } = validation.data;

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const employeeProfile = (session?.user as any)?.employeeProfile;

    if (role === "EMPLOYEE" && !employeeProfile?.canManageProducts) {
      return { success: false, msg: "Validation.server.error.unauthorized" };
    }

    // Filter stocks for EMPLOYEE
    let allowedStocks = stocks || [];
    if (role === "EMPLOYEE") {
      const allowedWarehouseIds = employeeProfile?.warehouses?.map((w: any) => w.id) || [];
      allowedStocks = allowedStocks.filter((s: any) => allowedWarehouseIds.includes(s.id));
    }

    // Gabungkan qty jika ada kombinasi warehouse dan size yang sama (untuk menghindari P2002 Unique Constraint)
    const mergedStocksMap = new Map<string, number>();
    for (const stock of allowedStocks) {
      const key = `${stock.id}__${stock.size || "ALL"}`;
      mergedStocksMap.set(key, (mergedStocksMap.get(key) || 0) + stock.qty);
    }

    const finalStocks = Array.from(mergedStocksMap.entries()).map(([key, qty]) => {
      const [warehouseId, size] = key.split("__");
      return { warehouseId, size, qty };
    });

    // 2. Ambil data produk lama dari database
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        msg: "Validation.product.notFound",
      };
    }

    const oldImagesInDb = existingProduct.images || [];
    const updatedImages = (images || []).filter(
      (img) => img && img.trim() !== "",
    );

    // 3. Cari gambar lama yang dihapus/diganti
    const imagesToDelete = oldImagesInDb.filter(
      (oldUrl) => !updatedImages.includes(oldUrl),
    );

    // 4. Update database dalam transaksi Prisma
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          price,
          weight: weight ?? null,
          description,
          isFeatured,
          status,
          images: updatedImages,
          categoryId,
        },
      });

      if (finalStocks && finalStocks.length > 0) {
        const validStockKeys = finalStocks.map(s => `${s.warehouseId}__${s.size}`);

        // Ambil stok yang ada saat ini
        const existingStocks = await tx.productStock.findMany({
          where: { productId: id }
        });

        // Hapus stok yang dihilangkan oleh user
        for (const es of existingStocks) {
          const key = `${es.warehouseId}__${es.size}`;
          if (!validStockKeys.includes(key)) {
            await tx.productStock.delete({
              where: { id: es.id }
            });
          }
        }

        // Upsert stok baru atau update yang sudah ada
        for (const stock of finalStocks) {
          await tx.productStock.upsert({
            where: {
              productId_warehouseId_size: { productId: id, warehouseId: stock.warehouseId, size: stock.size },
            },
            update: { qty: stock.qty },
            create: { productId: id, warehouseId: stock.warehouseId, size: stock.size, qty: stock.qty },
          });
        }
      }

      await tx.productHistory.create({
        data: {
          productId: id,
          userId: (session?.user as any).id,
          action: "UPDATED",
        }
      });
    });

    // 5. Hapus fisik file dari Supabase Storage jika ada
    if (imagesToDelete.length > 0) {
      await deleteProductImagesOnUpdate(imagesToDelete, "product-images");
    }

    revalidatePath("/seller/products");

    return {
      success: true,
      msg: "Validation.success.product.updated",
    };
  } catch (error) {
    console.error("Error executing updateProduct:", error);
    return {
      success: false,
      msg: "Validation.server.error.internal",
    };
  }
}

export async function archiveProduct(id: string): Promise<ActionState> {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const employeeProfile = (session?.user as any)?.employeeProfile;

    if (role === "EMPLOYEE" && !employeeProfile?.canManageProducts) {
      return { success: false, msg: "Validation.server.error.unauthorized" };
    }

    // 1. Cek apakah produk tersedia di database
    const checkProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!checkProduct) {
      return {
        success: false,
        msg: "Validation.product.notFound",
      };
    }

    // 2. Melakukan Soft Delete dengan mengubah status menjadi ARCHIVED & menyetel deletedAt
    // Dan mencatat ke ProductHistory
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          deletedAt: new Date(),
        },
      });

      await tx.productHistory.create({
        data: {
          productId: id,
          userId: (session?.user as any).id,
          action: "ARCHIVED",
        }
      });
    });

    revalidatePath("/seller/products");

    return {
      success: true,
      msg: "Validation.success.product.archived",
    };
  } catch (error) {
    console.error("Error executing deleteProduct:", error);

    return {
      success: false,
      msg: "Validation.server.error.internal",
    };
  }
}

export async function getProductHistory(productId: string) {
  try {
    const history = await prisma.productHistory.findMany({
      where: { productId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: history };
  } catch (error) {
    console.error("Error fetching product history:", error);
    return { success: false, data: [] };
  }
}
