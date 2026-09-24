import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import crypto from "crypto";
import { getTranslations } from "next-intl/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
    } = data;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    
    // Verify Signature Key
    const hash = crypto.createHash("sha512");
    hash.update(order_id + status_code + gross_amount + serverKey);
    const calculatedSignature = hash.digest("hex");

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // Determine New Status
    let newStatus = null;
    if (transaction_status === "capture" || transaction_status === "settlement") {
      newStatus = "PAID";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      newStatus = "CANCELLED";
    } else if (transaction_status === "pending") {
      newStatus = "PENDING";
    }

    if (newStatus) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: order_id },
        include: { items: { include: { shipment: true } } }
      });

      if (!existingOrder) {
        return NextResponse.json({ message: "Order not found" }, { status: 404 });
      }

      await prisma.order.update({
        where: { id: order_id },
        data: {
          // @ts-expect-error
          status: newStatus,
          paymentMethod: payment_type,
        },
      });

      // Update the order shipments status as well
      await prisma.orderShipment.updateMany({
        where: { 
          orderId: order_id,
          // Only update if it's currently PENDING to avoid overwriting SHIPPED or DELIVERED in race conditions
          status: "PENDING"
        },
        data: {
          status: newStatus,
        }
      });

      // If status changes to PAID and wasn't PAID before, decrement stock
      if (newStatus === "PAID" && existingOrder.status !== "PAID") {
        for (const item of existingOrder.items) {
          if (item.shipment?.warehouseId) {
            try {
              await prisma.productStock.update({
                where: {
                  productId_warehouseId_size: {
                    productId: item.productId,
                    warehouseId: item.shipment.warehouseId,
                    size: item.size || "ALL",
                  }
                },
                data: {
                  qty: {
                    decrement: item.quantity
                  }
                }
              });
            } catch (e) {
              console.error(`Failed to decrement stock for product ${item.productId} in warehouse ${item.shipment.warehouseId}`, e);
            }
          }
        }
        
        // Create Notifications
        try {
          const orderShipments = await prisma.orderShipment.findMany({
            where: { orderId: order_id },
            include: {
              warehouse: {
                include: {
                  storeProfile: true,
                  employees: true
                }
              }
            }
          });

          const t = await getTranslations({ locale: "id", namespace: "Notifications" });
          const allNotifications: any[] = [];

          orderShipments.forEach(shipment => {
            const warehouse = shipment.warehouse;
            if (!warehouse) return;

            const sellerId = warehouse.storeProfile?.userId;
            if (sellerId) {
              allNotifications.push({
                userId: sellerId,
                title: t("orderPaidTitle"),
                message: t("orderPaidSellerMessage", { warehouseName: warehouse.warehouseName }),
                link: `/seller/orders/${shipment.id}`
              });
            }

            if (warehouse.employees && warehouse.employees.length > 0) {
              warehouse.employees.forEach(emp => {
                if (emp.userId) {
                  allNotifications.push({
                    userId: emp.userId,
                    title: t("orderPaidTitle"),
                    message: t("orderPaidEmployeeMessage", { warehouseName: warehouse.warehouseName }),
                    link: `/employee/orders/${shipment.id}`
                  });
                }
              });
            }
          });

          if (allNotifications.length > 0) {
            await prisma.notification.createMany({
              data: allNotifications
            });
          }
        } catch (err) {
          console.error("Failed to create notifications", err);
        }
      }
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook midtrans error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
