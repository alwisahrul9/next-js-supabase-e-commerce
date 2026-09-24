"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export async function getSellerReturns({
  page = 1,
  limit = 10,
  search = "",
  status = "ALL"
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };

    const userId = (session?.user as any).id;

    // Check if user is owner
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { userId }
    });

    // Check if user is employee
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: {
        warehouses: { select: { id: true } }
      }
    });

    if (!storeProfile && !employeeProfile) {
      return { success: false, error: "Not authorized as seller or employee" };
    }

    let whereClause: any = {};

    if (storeProfile) {
      whereClause.orderItem = {
        product: {
          storeProfileId: storeProfile.id
        }
      };
    } else if (employeeProfile) {
      const warehouseIds = employeeProfile.warehouses.map(w => w.id);
      whereClause.orderItem = {
        shipment: {
          warehouseId: { in: warehouseIds }
        }
      };
    }

    if (status !== "ALL") {
      whereClause.status = status as ReturnStatus;
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: "insensitive" } },
        {
          orderItem: {
            product: {
              name: { contains: search, mode: "insensitive" }
            }
          }
        },
        {
          orderItem: {
            order: {
              user: {
                name: { contains: search, mode: "insensitive" }
              }
            }
          }
        }
      ];
    }

    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      prisma.orderReturn.findMany({
        where: whereClause,
        include: {
          orderItem: {
            include: {
              product: true,
              order: { include: { user: true } },
              shipment: { include: { warehouse: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.orderReturn.count({ where: whereClause })
    ]);

    return { 
      success: true, 
      returns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error fetching returns:", error);
    return { success: false, error: "Failed to fetch returns" };
  }
}

export async function getReturnDetails(returnId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };

    const userId = (session?.user as any).id;

    const returnDetails = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: {
        orderItem: {
          include: {
            product: { include: { storeProfile: true } },
            order: { include: { user: { include: { buyerProfile: true } } } },
            shipment: { include: { warehouse: true } }
          }
        }
      }
    });

    if (!returnDetails) {
      return { success: false, error: "Return not found" };
    }

    // Verify authorization
    const storeProfile = await prisma.storeProfile.findUnique({ where: { userId } });
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: { warehouses: { select: { id: true } } }
    });

    const isOwner = storeProfile && storeProfile.id === returnDetails.orderItem.product.storeProfileId;
    const isEmployee = employeeProfile && employeeProfile.warehouses.some(w => w.id === returnDetails.orderItem.shipment?.warehouseId);
    const isBuyer = returnDetails.orderItem.order.userId === userId;

    if (!isOwner && !isEmployee && !isBuyer) {
      return { success: false, error: "Unauthorized to view this return" };
    }

    return { success: true, returnDetails };
  } catch (error) {
    console.error("Error fetching return details:", error);
    return { success: false, error: "Failed to fetch return details" };
  }
}

export async function updateReturnStatus(returnId: string, status: ReturnStatus) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
    const userId = (session?.user as any).id;
    
    // Auth check logic
    const returnInfo = await prisma.orderReturn.findUnique({
      where: { id: returnId },
      include: {
        orderItem: {
          include: {
            product: true,
            shipment: true
          }
        }
      }
    });
    
    if (!returnInfo) return { success: false, error: "Return not found" };
    
    const storeProfile = await prisma.storeProfile.findUnique({ where: { userId } });
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: { warehouses: { select: { id: true } } }
    });

    const isOwner = storeProfile && storeProfile.id === returnInfo.orderItem.product.storeProfileId;
    const isEmployee = employeeProfile && employeeProfile.warehouses.some(w => w.id === returnInfo.orderItem.shipment?.warehouseId);
    
    if (!isOwner && !isEmployee) {
      return { success: false, error: "Unauthorized to update status" };
    }
    
    await prisma.orderReturn.update({
      where: { id: returnId },
      data: { status }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating return:", error);
    return { success: false, error: "Failed to update return status" };
  }
}
