"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production' && !process.env.MIDTRANS_SERVER_KEY?.startsWith('SB-'),
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function createMidtransTransaction(
  directBuyRequest?: { productId: string, quantity: number, warehouseId?: string, size?: string }, 
  addressId?: string, 
  shipments?: { warehouseId: string, courierCode: string, service: string, cost: number }[]
) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return { success: false, msg: "server.unauthorized" };
    }
    const userId = (session?.user as any).id;

    let cartItems: any[] = [];
    let cartId: string | undefined = undefined;

    if (directBuyRequest) {
      const product = await prisma.product.findUnique({ where: { id: directBuyRequest.productId } });
      if (!product) {
        return { success: false, msg: "Product not found" };
      }
      cartItems = [{
        productId: product.id,
        quantity: directBuyRequest.quantity,
        size: directBuyRequest.size || "ALL",
        product: product,
        warehouseId: directBuyRequest.warehouseId
      }];
    } else {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
      });
      if (!cart || cart.items.length === 0) {
        return { success: false, msg: "Cart is empty" };
      }
      cartItems = cart.items;
      cartId = cart.id;
    }

    // Get user's default address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: {
          include: {
            addresses: addressId 
              ? { where: { id: addressId } }
              : { where: { isDefault: true } }
          }
        }
      }
    });

    const defaultAddress = user?.buyerProfile?.addresses?.[0];
    if (!defaultAddress) {
      return { success: false, msg: "No default address found" };
    }

    const shippingCost = shipments ? shipments.reduce((sum, s) => sum + s.cost, 0) : 0;

    const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const gross_amount = subtotal + shippingCost;
    const itemDetails = cartItems.map(item => {
      return {
        id: item.product.id,
        price: item.product.price,
        quantity: item.quantity,
        name: item.product.name.substring(0, 50) // Midtrans limit
      };
    });

    if (shippingCost > 0) {
      itemDetails.push({
        id: "shipping",
        price: shippingCost,
        quantity: 1,
        name: "Shipping Cost"
      });
    }

    const formattedAddress = `${defaultAddress.streetAddress}, ${defaultAddress.village}, ${defaultAddress.district}, ${defaultAddress.city}, ${defaultAddress.province} ${defaultAddress.postcode}`;

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: gross_amount,
        status: "PENDING",
        shippingAddress: formattedAddress,
        shippingCost: shippingCost,
        shipments: {
          create: shipments?.map(s => ({
            warehouseId: s.warehouseId,
            shippingCourier: s.courierCode,
            shippingService: s.service,
            shippingCost: s.cost,
          })) || []
        }
      },
      include: {
        shipments: true
      }
    });

    // Create OrderItems
    for (const item of cartItems) {
      const shipment = order.shipments.find(s => s.warehouseId === item.warehouseId);
      if (shipment) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            shipmentId: shipment.id,
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price
          }
        });
      }
    }

    // Clear cart if not direct buy
    if (!directBuyRequest && cartId) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cartId }
      });
    }

    // Create Snap Transaction
    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: gross_amount
      },
      item_details: itemDetails,
      customer_details: {
        first_name: defaultAddress.receiverName,
        phone: defaultAddress.receiverPhone,
        email: user.email,
        shipping_address: {
          first_name: defaultAddress.receiverName,
          phone: defaultAddress.receiverPhone,
          address: defaultAddress.streetAddress,
          city: defaultAddress.city,
          postal_code: defaultAddress.postcode,
          country_code: "IDN"
        }
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Update order with token
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentToken: transaction.token }
    });

    return {
      success: true,
      token: transaction.token,
      orderId: order.id
    };

  } catch (error: any) {
    console.error("Checkout error:", error);
    return { success: false, msg: error.message || "Failed to create transaction" };
  }
}
