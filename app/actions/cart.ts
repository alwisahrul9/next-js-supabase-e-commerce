"use server";

import { prisma } from "../lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { revalidatePath } from "next/cache";
import { calculateDistance } from "@/lib/utils";

export async function addToCart(productId: string, quantity: number = 1, size: string = "ALL") {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        success: false,
        msg: "Unauthorized",
      };
    }

    const userId = (session.user as any).id;

    // Find or create cart for this user
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_size: {
          cartId: cart.id,
          productId,
          size,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          size,
          quantity,
        },
      });
    }

    revalidatePath("/cart");

    return {
      success: true,
      msg: "Item added to cart successfully",
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      msg: "Failed to add item to cart",
    };
  }
}

export async function getCartItemCount() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return 0;
    const userId = (session.user as any).id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    return 0;
  }
}

export async function getCartItems(addressId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { items: [], hasAddress: false };

    const userId = (session.user as any).id;

    // Fetch buyer address
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId },
      include: {
        addresses: addressId 
          ? { where: { id: addressId }, take: 1 }
          : { where: { isDefault: true }, take: 1 }
      }
    });

    const defaultAddress = buyerProfile?.addresses?.[0] || null;
    const hasAddress = !!defaultAddress && !!defaultAddress.latitude && !!defaultAddress.longitude;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stocks: {
                  include: {
                    warehouse: {
                      select: {
                        id: true,
                        warehouseName: true,
                        latitude: true,
                        longitude: true,
                        city: true,
                        cityId: true,
                        isMain: true
                      }
                    }
                  }
                },
                images: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!cart?.items) return { items: [], hasAddress };

    // Process items to calculate distances and auto-select warehouse if not set
    const processedItems = await Promise.all(cart.items.map(async (item) => {
      let warehouses = item.product.stocks
        .filter(stock => stock.size === item.size)
        .map(stock => {
          let distance = null;
          if (defaultAddress?.latitude && defaultAddress?.longitude) {
            distance = calculateDistance(
              defaultAddress.latitude, defaultAddress.longitude,
              stock.warehouse.latitude, stock.warehouse.longitude
            );
          }
          return {
            id: stock.warehouse.id,
            name: stock.warehouse.warehouseName,
            qty: stock.qty,
            isMain: stock.warehouse.isMain,
            distance: distance,
            latitude: stock.warehouse.latitude,
            longitude: stock.warehouse.longitude,
            city: stock.warehouse.city,
            cityId: stock.warehouse.cityId
          };
        });

      // Sort warehouses by distance, then fallback to stock, then isMain
      warehouses.sort((a, b) => {
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        if (b.qty !== a.qty) return b.qty - a.qty; // sort by stock desc
        return (a.isMain === b.isMain) ? 0 : a.isMain ? -1 : 1;
      });

      let selectedWarehouseId = item.warehouseId;

      // Auto-select if no warehouseId is set in CartItem
      if (!selectedWarehouseId && warehouses.length > 0) {
        // Find closest with stock, or just closest if none have stock
        const withStock = warehouses.find(w => w.qty > 0);
        selectedWarehouseId = withStock ? withStock.id : warehouses[0].id;

        // Update database asynchronously
        prisma.cartItem.update({
          where: { id: item.id },
          data: { warehouseId: selectedWarehouseId }
        }).catch(console.error);
      }

      return {
        ...item,
        warehouseId: selectedWarehouseId,
        availableWarehouses: warehouses
      };
    }));

    return { items: processedItems, hasAddress };
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return { items: [], hasAddress: false };
  }
}

export async function updateCartItemWarehouse(itemId: string, warehouseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, msg: "Unauthorized" };

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { warehouseId }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating cart warehouse:", error);
    return { success: false, msg: "Internal server error" };
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, msg: "Unauthorized" };

    if (quantity <= 0) {
      return removeCartItem(itemId);
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: { select: { stocks: true } } }
    });

    if (!item) return { success: false, msg: "Item not found" };

    if (quantity > item.product.stocks.filter(s => s.size === item.size).reduce((acc, stock) => acc + stock.qty, 0)) {
      return { success: false, msg: "Insufficient stock" };
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { success: false, msg: "Failed to update quantity" };
  }
}

export async function removeCartItem(itemId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, msg: "Unauthorized" };

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return { success: false, msg: "Failed to remove item" };
  }
}
