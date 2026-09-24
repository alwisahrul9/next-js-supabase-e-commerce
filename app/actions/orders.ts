"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { sendShipmentNotificationEmail } from "@/app/lib/mail";
import { getTranslations, getLocale } from "next-intl/server";
import { deleteProductImagesOnUpdate } from "@/app/actions/storage";

export async function getBuyerOrders() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return { success: false, data: [] };
    }
    const userId = (session?.user as any).id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        shipments: {
          include: {
            warehouse: true,
            items: {
              include: {
                product: true,
                orderReturn: true
              }
            }
          }
        }
      }
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return { success: false, data: [] };
  }
}

export async function getSellerOrders(searchQuery?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SELLER", "EMPLOYEE"].includes((session.user as any)?.role)) {
      return { success: false, data: [], warehouses: [], role: null };
    }

    const userRole = (session.user as any).role;
    const storeProfileId = (session.user as any).storeProfile?.id;
    const employeeWarehouses = (session.user as any).employeeProfile?.warehouses || [];

    // Filter kondisi
    let whereCondition: any = {};
    let accessibleWarehouses: any[] = [];

    if (userRole === "SELLER") {
      if (!storeProfileId) return { success: false, data: [], warehouses: [], role: userRole };
      whereCondition = {
        warehouse: {
          storeProfileId
        }
      };

      // Ambil daftar gudang untuk filter SELLER
      accessibleWarehouses = await prisma.warehouse.findMany({
        where: { storeProfileId },
        select: { id: true, warehouseName: true }
      });
    } else if (userRole === "EMPLOYEE") {
      if (!employeeWarehouses || employeeWarehouses.length === 0) {
        return { success: false, data: [], warehouses: [], role: userRole };
      }
      const warehouseIds = employeeWarehouses.map((w: any) => w.id);
      whereCondition = {
        warehouseId: {
          in: warehouseIds
        }
      };
      accessibleWarehouses = employeeWarehouses; // Data dari session hanya id, tapi tak apa karena EMPLOYEE tak punya opsi filter gudang
    }

    if (searchQuery) {
      whereCondition.OR = [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { order: { user: { name: { contains: searchQuery, mode: 'insensitive' } } } }
      ];
    }

    const shipments = await prisma.orderShipment.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        warehouse: {
          select: { warehouseName: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, images: true, price: true }
            }
          }
        }
      }
    });

    return {
      success: true,
      data: shipments,
      warehouses: accessibleWarehouses,
      role: userRole
    };
  } catch (error) {
    console.error("Failed to fetch seller orders:", error);
    return { success: false, data: [], warehouses: [], role: null };
  }
}

export async function getSellerOrderDetail(shipmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SELLER", "EMPLOYEE"].includes((session.user as any)?.role)) {
      return { success: false, data: null };
    }

    const userRole = (session.user as any).role;
    const storeProfileId = (session.user as any).storeProfile?.id;
    const employeeWarehouses = (session.user as any).employeeProfile?.warehouses || [];

    // Filter condition for the shipment
    let whereCondition: any = { id: shipmentId };

    if (userRole === "SELLER") {
      if (!storeProfileId) return { success: false, data: null };
      whereCondition.warehouse = {
        storeProfileId
      };
    } else if (userRole === "EMPLOYEE") {
      if (!employeeWarehouses || employeeWarehouses.length === 0) {
        return { success: false, data: null };
      }
      const warehouseIds = employeeWarehouses.map((w: any) => w.id);
      whereCondition.warehouseId = {
        in: warehouseIds
      };
    }

    const shipment = await prisma.orderShipment.findFirst({
      where: whereCondition,
      include: {
        order: {
          include: {
            user: {
              select: { name: true, email: true, buyerProfile: { select: { phone: true } } }
            }
          }
        },
        warehouse: true,
        items: {
          include: {
            product: {
              select: { name: true, images: true, price: true, weight: true }
            }
          }
        }
      }
    });

    if (!shipment) {
      return { success: false, data: null, error: "Shipment not found or access denied" };
    }

    return { success: true, data: shipment };
  } catch (error) {
    console.error("Failed to fetch order detail:", error);
    return { success: false, data: null };
  }
}

export async function markShipmentAsShipped(shipmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SELLER", "EMPLOYEE"].includes((session.user as any)?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const userRole = (session.user as any).role;
    const storeProfileId = (session.user as any).storeProfile?.id;
    const employeeWarehouses = (session.user as any).employeeProfile?.warehouses || [];

    let whereCondition: any = { id: shipmentId };
    if (userRole === "SELLER") {
      if (!storeProfileId) return { success: false, error: "Unauthorized" };
      whereCondition.warehouse = { storeProfileId };
    } else if (userRole === "EMPLOYEE") {
      if (!employeeWarehouses || employeeWarehouses.length === 0) return { success: false, error: "Unauthorized" };
      const warehouseIds = employeeWarehouses.map((w: any) => w.id);
      whereCondition.warehouseId = { in: warehouseIds };
    }

    // Verify shipment exists and belongs to them
    const shipment = await prisma.orderShipment.findFirst({
      where: whereCondition,
      select: { id: true, orderId: true, status: true }
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found or access denied" };
    }

    if (shipment.status !== "PAID") {
      return { success: false, error: "Shipment can only be marked as shipped if it is PAID" };
    }

    // Update shipment status
    const updatedShipment = await prisma.orderShipment.update({
      where: { id: shipment.id },
      data: { status: "SHIPPED" },
      include: {
        order: {
          include: {
            user: true
          }
        },
        warehouse: true
      }
    });

    // Notify Buyer
    if (updatedShipment.order?.user?.id) {
      const buyerId = updatedShipment.order.user.id;
      const buyerEmail = updatedShipment.order.user.email;

      const locale = await getLocale();
      const t = await getTranslations({ locale, namespace: "Notifications" });

      // Create Database Notification
      await prisma.notification.create({
        data: {
          userId: buyerId,
          title: t("orderShippedTitle"),
          message: t("orderShippedMessage", {
            warehouseName: updatedShipment.warehouse.warehouseName,
            courier: updatedShipment.shippingCourier,
            service: updatedShipment.shippingService
          }),
          link: `/orders?expanded=${updatedShipment.orderId}`
        }
      });

      // Send Email
      if (buyerEmail) {
        await sendShipmentNotificationEmail({
          to: buyerEmail,
          orderId: updatedShipment.orderId,
          warehouseName: updatedShipment.warehouse.warehouseName,
          courier: updatedShipment.shippingCourier,
          service: updatedShipment.shippingService
        });
      }
    }

    // Check if ALL shipments for this order are now SHIPPED (or COMPLETED)
    const allShipments = await prisma.orderShipment.findMany({
      where: { orderId: shipment.orderId },
      select: { status: true }
    });

    const allShippedOrBeyond = allShipments.every(s => ["SHIPPED", "DELIVERED", "COMPLETED"].includes(s.status));

    if (allShippedOrBeyond) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: "SHIPPED" as any } // OrderStatus Enum
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark shipment as shipped:", error);
    return { success: false, error: "Failed to mark shipment as shipped" };
  }
}

export async function submitReturnRequest(data: {
  orderItemId: string;
  reason: string;
  images: string[];
  refundAccount: string;
  shippingCourier?: string;
  shippingService?: string;
  shippingCost?: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };

    const userId = (session?.user as any).id;

    // Verify order item belongs to user and order is DELIVERED
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: data.orderItemId },
      include: {
        order: { include: { user: true } },
        orderReturn: true,
        product: { include: { storeProfile: true } },
        shipment: { include: { warehouse: { include: { employees: true } } } }
      }
    });

    if (!orderItem || orderItem.order.userId !== userId) {
      return { success: false, error: "Item not found or unauthorized" };
    }
    
    if (orderItem.order.status !== "DELIVERED") {
      return { success: false, error: "Order must be delivered to request a return" };
    }

    if (orderItem.orderReturn) {
      return { success: false, error: "Pengembalian untuk produk ini sudah diajukan." };
    }

    // Check if within 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    if (orderItem.order.updatedAt < twoDaysAgo) {
      return { success: false, error: "Batas waktu pengembalian (2 hari) sudah lewat." };
    }

    // Create Return Request without changing Order status
    const orderReturn = await prisma.orderReturn.create({
      data: {
        orderItemId: data.orderItemId,
        reason: data.reason,
        images: data.images,
        refundAccount: data.refundAccount,
        shippingCourier: data.shippingCourier,
        shippingService: data.shippingService,
        shippingCost: data.shippingCost,
        status: "PENDING"
      }
    });

    // Create notifications for Seller and Employees
    const notificationsToCreate = [];
    
    // 1. Store Owner
    if (orderItem.product.storeProfile?.userId) {
      notificationsToCreate.push({
        userId: orderItem.product.storeProfile.userId,
        title: "Pengajuan Pengembalian Baru",
        message: `Pembeli mengajukan pengembalian untuk produk ${orderItem.product.name}.`,
        link: `/seller/returns/${orderReturn.id}`
      });
    }

    // 2. Warehouse Employees
    if (orderItem.shipment?.warehouse?.employees) {
      for (const employee of orderItem.shipment.warehouse.employees) {
        notificationsToCreate.push({
          userId: employee.userId,
          title: "Pengajuan Pengembalian Baru",
          message: `Pembeli mengajukan pengembalian untuk produk ${orderItem.product.name} (Gudang: ${orderItem.shipment.warehouse.warehouseName}).`,
          link: `/seller/returns/${orderReturn.id}`
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Return request error:", error);
    return { success: false, error: "Failed to submit return request" };
  }
}

export async function updateReturnRequest(data: {
  returnId: string;
  reason: string;
  images: string[];
  refundAccount: string;
  shippingCourier?: string;
  shippingService?: string;
  shippingCost?: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };
    const userId = (session?.user as any).id;

    // Verify the return exists and belongs to the user
    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: data.returnId },
      include: {
        orderItem: {
          include: { order: true }
        }
      }
    });

    if (!orderReturn || orderReturn.orderItem.order.userId !== userId) {
      return { success: false, error: "Return not found or unauthorized" };
    }

    if (orderReturn.status !== "PENDING") {
      return { success: false, error: "Hanya pengajuan dengan status PENDING yang dapat diubah." };
    }

    const imagesToDelete = orderReturn.images.filter(img => !data.images.includes(img));
    if (imagesToDelete.length > 0) {
      await deleteProductImagesOnUpdate(imagesToDelete, "product-images-return");
    }

    await prisma.orderReturn.update({
      where: { id: data.returnId },
      data: {
        reason: data.reason,
        images: data.images,
        refundAccount: data.refundAccount,
        shippingCourier: data.shippingCourier,
        shippingService: data.shippingService,
        shippingCost: data.shippingCost,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Return update error:", error);
    return { success: false, error: "Failed to update return request" };
  }
}

export async function completeOrderAndReview(data: {
  orderId: string;
  reviews: Array<{
    productId: string;
    rating: number;
    message?: string;
    images: string[];
  }>;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) return { success: false, error: "Unauthorized" };

    const userId = (session?.user as any).id;

    const order = await prisma.order.findUnique({
      where: { id: data.orderId, userId }
    });

    if (!order) return { success: false, error: "Order not found" };
    if (order.status !== "DELIVERED") return { success: false, error: "Order must be delivered to be completed" };

    await prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      await tx.order.update({
        where: { id: data.orderId },
        data: { status: "COMPLETED" as any }
      });

      // 2. Insert Reviews
      for (const review of data.reviews) {
        await tx.productReview.create({
          data: {
            userId,
            orderId: data.orderId,
            productId: review.productId,
            rating: review.rating,
            message: review.message,
            images: review.images
          }
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Complete order error:", error);
    return { success: false, error: "Failed to complete order and save reviews" };
  }
}
