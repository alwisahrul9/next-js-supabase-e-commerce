"use server";

import { prisma } from "../lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { warehouseSchema } from "@/app/lib/validations/seller";
import { revalidatePath } from "next/cache";

export async function getAllWarehouses() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return [];
    }
    
    const userId = (session.user as any).id;
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { userId },
    });

    if (!storeProfile) return [];

    const warehouses = await prisma.warehouse.findMany({
      where: {
        storeProfileId: storeProfile.id,
        deletedAt: null,
      },
      select: {
        id: true,
        warehouseName: true,
      },
      orderBy: {
        warehouseName: "asc",
      },
    });

    return warehouses;
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    throw new Error("Failed to fetch warehouses");
  }
}

export async function getWarehousesForDashboard() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }
    
    const userId = (session.user as any).id;
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { userId },
    });

    if (!storeProfile) {
      return { success: false, message: "Store profile not found" };
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        storeProfileId: storeProfile.id,
        deletedAt: null,
      },
      include: {
        stocks: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: true, data: warehouses };
  } catch (error) {
    console.error("Error fetching dashboard warehouses:", error);
    return { success: false, message: "Failed to fetch warehouses" };
  }
}

export async function getWarehouseById(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }
    
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stocks: true }
        },
        stocks: {
          take: 10,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              }
            }
          }
        }
      }
    });


    if (!warehouse) {
      return { success: false, message: "Warehouse not found" };
    }

    return { success: true, data: warehouse };
  } catch (error) {
    console.error("Error fetching warehouse by id:", error);
    return { success: false, message: "Failed to fetch warehouse" };
  }
}

export async function createWarehouse(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { userId },
    });

    if (!storeProfile) {
      return { success: false, message: "Store profile not found" };
    }

    const validatedData = warehouseSchema.safeParse(data);
    if (!validatedData.success) {
      return { success: false, errors: validatedData.error.flatten().fieldErrors, message: "Periksa kembali form Anda" };
    }

    const wData = validatedData.data;

    const newWarehouse = await prisma.$transaction(async (tx) => {
      if (wData.isMain) {
        await tx.warehouse.updateMany({
          where: { storeProfileId: storeProfile.id },
          data: { isMain: false }
        });
      }

      return await tx.warehouse.create({
        data: {
          storeProfileId: storeProfile.id,
          warehouseName: wData.warehouseName,
          isMain: wData.isMain !== undefined ? wData.isMain : undefined,
          province: wData.province,
          city: wData.city,
          cityId: wData.cityId,
          district: wData.district,
          districtId: wData.districtId,
          village: wData.village,
          villageId: wData.villageId,
          postcode: wData.postcode,
          streetAddress: wData.streetAddress,
          latitude: wData.latitude,
          longitude: wData.longitude,
        },
      });
    });

    revalidatePath("/seller/warehouses", "page");
    return { success: true, data: newWarehouse };
  } catch (error: any) {
    console.error("Create Warehouse Error:", error);
    return { success: false, message: error.message || "Failed to create warehouse" };
  }
}

export async function updateWarehouse(id: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = warehouseSchema.safeParse(data);
    if (!validatedData.success) {
      return { success: false, errors: validatedData.error.flatten().fieldErrors, message: "Periksa kembali form Anda" };
    }

    const wData = validatedData.data;

    const updatedWarehouse = await prisma.$transaction(async (tx) => {
      if (wData.isMain) {
        const existingWarehouse = await tx.warehouse.findUnique({ where: { id } });
        if (existingWarehouse) {
          await tx.warehouse.updateMany({
            where: {
              storeProfileId: existingWarehouse.storeProfileId,
              id: { not: id }
            },
            data: { isMain: false }
          });
        }
      }

      return await tx.warehouse.update({
        where: { id },
        data: {
          warehouseName: wData.warehouseName,
          isMain: wData.isMain !== undefined ? wData.isMain : undefined,
          province: wData.province,
          city: wData.city,
          cityId: wData.cityId,
          district: wData.district,
          districtId: wData.districtId,
          village: wData.village,
          villageId: wData.villageId,
          postcode: wData.postcode,
          streetAddress: wData.streetAddress,
          latitude: wData.latitude,
          longitude: wData.longitude,
        },
      });
    });

    revalidatePath("/seller/warehouses", "page");
    return { success: true, data: updatedWarehouse };
  } catch (error: any) {
    console.error("Update Warehouse Error:", error);
    return { success: false, message: error.message || "Failed to update warehouse" };
  }
}

export async function transferProductsAndDeleteWarehouse(id: string, targetWarehouseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }
    const userId = (session.user as any).id;

    if (id === targetWarehouseId) {
      return { success: false, message: "Cannot transfer to the same warehouse" };
    }

    await prisma.$transaction(async (tx) => {
      const oldStocks = await tx.productStock.findMany({
        where: { warehouseId: id }
      });

      for (const stock of oldStocks) {
        await tx.productStock.upsert({
          where: {
            productId_warehouseId_size: {
              productId: stock.productId,
              warehouseId: targetWarehouseId,
              size: stock.size
            }
          },
          create: {
            productId: stock.productId,
            warehouseId: targetWarehouseId,
            size: stock.size,
            qty: stock.qty
          },
          update: {
            qty: { increment: stock.qty }
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: stock.productId,
            size: stock.size,
            fromWarehouseId: id,
            toWarehouseId: targetWarehouseId,
            qty: stock.qty,
            userId: userId,
            reason: "Warehouse Transfer"
          }
        });
      }

      await tx.productStock.deleteMany({
        where: { warehouseId: id }
      });

      await tx.warehouse.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    });

    revalidatePath("/seller/warehouses", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Transfer and Delete Error:", error);
    return { success: false, message: error.message || "Failed to transfer and delete warehouse" };
  }
}

export async function deleteWarehouseForce(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "SELLER") {
      return { success: false, message: "Unauthorized" };
    }
    const userId = (session.user as any).id;

    await prisma.$transaction(async (tx) => {
      const oldStocks = await tx.productStock.findMany({
        where: { warehouseId: id }
      });

      for (const stock of oldStocks) {
        await tx.stockMovement.create({
          data: {
            productId: stock.productId,
            size: stock.size,
            fromWarehouseId: id,
            qty: stock.qty,
            userId: userId,
            reason: "Warehouse Deletion"
          }
        });
      }

      await tx.productStock.deleteMany({
        where: { warehouseId: id }
      });

      await tx.warehouse.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    });

    revalidatePath("/seller/warehouses", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Force Delete Error:", error);
    return { success: false, message: error.message || "Failed to delete warehouse" };
  }
}
