import { prisma } from "@/app/lib/db";
import { hash } from "bcrypt-ts";
import { OrderStatus, ReturnStatus } from "@/prisma/generated/client";

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("🌱 Memulai proses seeding data komprehensif...");

  // 1. Bersihkan database terlebih dahulu (Urutan berdasarkan Foreign Key Dependency)
  await prisma.stockMovement.deleteMany();
  await prisma.productHistory.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.orderReturn.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderShipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.storeWallet.deleteMany();
  await prisma.storeProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️ Data lama telah dibersihkan.");

  const saltRounds = 10;
  const hashedPassword = await hash("123456", saltRounds);
  const now = new Date();
  const past6Months = new Date();
  past6Months.setMonth(now.getMonth() - 6);

  // 2. Buat Categories (10 Data)
  console.log("🏷️ Membuat 10 kategori...");
  const categoryNames = [
    "Kemeja Pria", "Kemeja Wanita", "Kaos Kasual", "Blazer & Jas",
    "Celana Panjang", "Celana Pendek", "Rok", "Dress & Gaun",
    "Jaket & Mantel", "Aksesoris Fashion"
  ];

  const createdCategories = await Promise.all(
    categoryNames.map(async (name, index) => {
      return prisma.category.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${index}`,
        }
      });
    })
  );

  console.log("👥 Membuat 3 akun Seller beserta profil toko, gudang, karyawan, dan 30 produk per toko...");

  const allActiveProducts: any[] = [];
  const allSellers: any[] = [];

  const styles = ["Slim Fit", "Oversize", "Elegan", "Kasual", "Premium", "Vintage", "Modern", "Classic", "Basic", "Streetwear"];
  const colors = ["Hitam", "Putih", "Navy", "Maroon", "Abu-abu", "Khaki", "Coklat", "Olive", "Mustard", "Dusty Pink"];
  const images = [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    "https://images.unsplash.com/photo-1520975911955-1b6a1f8b9f3e",
    "https://images.unsplash.com/photo-1596464716121-3c8f1b6e5f3e",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
  ];

  for (let s = 1; s <= 3; s++) {
    const sellerUser = await prisma.user.create({
      data: {
        name: `Akun Seller Toko ${s}`,
        email: `seller${s}@email.com`,
        password: hashedPassword,
        role: "SELLER",
        createdAt: past6Months,
        storeProfile: {
          create: {
            storeName: `Toko Fashion Seller ${s}`,
            storeDescription: `Toko resmi ke-${s} untuk produk fashion berkualitas tinggi.`,
            logoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
            wallet: {
              create: {
                escrowBalance: Math.floor(Math.random() * 5000000),
                withdrawableBalance: Math.floor(Math.random() * 10000000),
              },
            },
            warehouses: {
              create: [
                {
                  warehouseName: `Gudang Utama Bandung ${s}`,
                  province: "JAWA BARAT",
                  city: "BANDUNG",
                  cityId: "55",
                  district: "BANDUNG WETAN",
                  districtId: "436",
                  village: "CIHAPIT",
                  villageId: "4878",
                  postcode: "40114",
                  streetAddress: `Jl. Contoh Alamat No. 123, Bandung - Toko ${s}`,
                  latitude: -6.914744,
                  longitude: 107.60981,
                  isMain: true,
                },
                {
                  warehouseName: `Gudang Cabang Surabaya ${s}`,
                  province: "JAWA TIMUR",
                  city: "SURABAYA",
                  cityId: "577",
                  district: "GAYUNGAN",
                  districtId: "5878",
                  village: "GAYUNGAN",
                  villageId: "69233",
                  postcode: "60235",
                  streetAddress: `Jl. Contoh Alamat No. 456, Surabaya - Toko ${s}`,
                  latitude: -7.257471,
                  longitude: 112.75209,
                  isMain: false,
                }
              ],
            },
          },
        },
      },
      include: {
        storeProfile: {
          include: {
            warehouses: true,
            wallet: true
          },
        },
      },
    });

    allSellers.push(sellerUser);

    const storeProfileId = sellerUser.storeProfile?.id;
    const warehouses = sellerUser.storeProfile?.warehouses || [];

    if (!storeProfileId || warehouses.length === 0) {
      throw new Error(`❌ Gagal seeding: storeProfileId atau Gudang tidak ditemukan untuk seller ${s}.`);
    }

    const gudangUtama = warehouses.find((w) => w.isMain) || warehouses[0];
    const gudangSurabaya = warehouses.find((w) => !w.isMain) || warehouses[1] || warehouses[0];

    // Create 3 Employees
    for (let e = 1; e <= 3; e++) {
      await prisma.user.create({
        data: {
          name: `Employee ${e} - Toko ${s}`,
          email: `employee${e}_toko${s}@email.com`,
          password: hashedPassword,
          role: "EMPLOYEE",
          createdAt: past6Months,
          employeeProfile: {
            create: {
              storeProfileId,
              canManageProducts: true,
              canManageOrders: true,
              canManageCustomers: e === 1,
              warehouses: {
                connect: [{ id: warehouses[e % warehouses.length].id }]
              }
            }
          }
        }
      });
    }

    // Create 30 Products for this seller (Status Active)
    for (let p = 1; p <= 30; p++) {
      const category = createdCategories[Math.floor(Math.random() * createdCategories.length)];
      const style = styles[Math.floor(Math.random() * styles.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const name = `${category.name} ${style} - ${color} Edition ${s}-${p}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const price = Math.floor(Math.random() * 400000) + 50000;
      const weight = Math.floor(Math.random() * 800) + 150;

      const productCreatedAt = randomDate(past6Months, now);

      const availableSizes = ["S", "M", "L", "XL"];
      const size1 = availableSizes[Math.floor(Math.random() * availableSizes.length)];
      const size2 = availableSizes[Math.floor(Math.random() * availableSizes.length)];

      const qty1 = Math.floor(Math.random() * 100) + 10;
      const qty2 = Math.floor(Math.random() * 50) + 5;

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: `Produk ${category.name} dengan desain ${style} warna ${color} kualitas premium. Sangat nyaman dipakai untuk aktivitas sehari-hari maupun acara khusus.`,
          price,
          weight,
          isFeatured: Math.random() > 0.8,
          // @ts-ignore
          status: "ACTIVE",
          categoryId: category.id,
          storeProfileId,
          createdAt: productCreatedAt,
          images: [images[Math.floor(Math.random() * images.length)]],
          stocks: {
            create: [
              { warehouseId: gudangUtama.id, qty: qty1, size: size1 },
              { warehouseId: gudangSurabaya.id, qty: qty2, size: size2 },
            ],
          },
          histories: {
            create: {
              userId: sellerUser.id,
              action: "CREATED",
              createdAt: productCreatedAt
            }
          }
        }
      });
      allActiveProducts.push(product);

      // Add Stock Movements
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          size: size1,
          toWarehouseId: gudangUtama.id,
          qty: qty1,
          userId: sellerUser.id,
          reason: "INITIAL_STOCK",
          createdAt: productCreatedAt
        }
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          size: size2,
          toWarehouseId: gudangSurabaya.id,
          qty: qty2,
          userId: sellerUser.id,
          reason: "INITIAL_STOCK",
          createdAt: productCreatedAt
        }
      });
    }

    // Create notifications for Seller
    await prisma.notification.createMany({
      data: [
        {
          userId: sellerUser.id,
          title: "Selamat datang di Dress Commerce",
          message: "Toko Anda berhasil dibuat, sekarang Anda dapat mulai berjualan.",
          link: "/seller/onboarding",
          createdAt: past6Months
        },
        {
          userId: sellerUser.id,
          title: "Produk Pertama Berhasil",
          message: "Anda telah menambahkan produk pertama Anda.",
          link: "/seller/products",
          createdAt: past6Months
        }
      ]
    });
  }

  // 6. Buat 50 Buyers beserta Carts dan Orders
  console.log("👥 Membuat 50 akun Buyer beserta alamat, cart, dan orders variatif...");

  const orderStatuses: OrderStatus[] = [
    OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, 
    OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.COMPLETED, 
    OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.RETURN_REQUESTED, OrderStatus.RETURNED
  ];
  const couriers = ["jne", "sicepat", "pos", "jnt"];
  const services = ["REG", "YES", "ECO", "CARGO"];

  for (let i = 1; i <= 50; i++) {
    const buyerCreatedAt = randomDate(past6Months, now);
    // 6a. Buyer User & Profile
    const buyerUser = await prisma.user.create({
      data: {
        name: `Pembeli Setia ${i}`,
        email: `buyer${i}@email.com`,
        password: hashedPassword,
        role: "BUYER",
        createdAt: buyerCreatedAt,
        buyerProfile: {
          create: {
            phone: `081234567${String(i).padStart(3, '0')}`,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
            createdAt: buyerCreatedAt,
            addresses: {
              create: [
                {
                  label: "Home",
                  receiverName: `Pembeli Setia ${i}`,
                  receiverPhone: `081234567${String(i).padStart(3, '0')}`,
                  province: "JAWA BARAT",
                  city: "BANDUNG",
                  cityId: "55",
                  district: "COBLONG",
                  districtId: "443",
                  village: "DAGO",
                  villageId: "4917",
                  postcode: "40135",
                  streetAddress: `Jl. Pelanggan No. ${i}`,
                  isDefault: true,
                }
              ]
            }
          }
        },
        carts: {
          create: {} // Create empty cart
        }
      },
      include: {
        carts: true,
        buyerProfile: { include: { addresses: true } }
      }
    });

    const cartId = buyerUser.carts[0].id;
    const address = buyerUser.buyerProfile?.addresses[0];

    // 6b. Isi Cart (Random)
    const numCartItems = Math.floor(Math.random() * 3);
    for (let j = 0; j < numCartItems; j++) {
      const product = allActiveProducts[Math.floor(Math.random() * allActiveProducts.length)];
      const productStocks = await prisma.productStock.findMany({ where: { productId: product.id } });
      if (productStocks.length > 0) {
        const randomStock = productStocks[Math.floor(Math.random() * productStocks.length)];
        try {
          await prisma.cartItem.create({
            data: {
              cartId,
              productId: product.id,
              warehouseId: randomStock.warehouseId,
              size: randomStock.size,
              quantity: Math.floor(Math.random() * 2) + 1
            }
          });
        } catch (e) { }
      }
    }

    // 6c. Buat 1-4 Orders per Buyer untuk data yang lebih kaya
    const totalOrders = Math.floor(Math.random() * 4) + 1;

    for (let o = 0; o < totalOrders; o++) {
      const orderCreatedAt = randomDate(buyerCreatedAt, now);
      const numOrderItems = Math.floor(Math.random() * 3) + 1;
      const orderItemsData: any[] = [];
      let totalSubtotal = 0;

      for (let j = 0; j < numOrderItems; j++) {
        const product = allActiveProducts[Math.floor(Math.random() * allActiveProducts.length)];
        const qty = Math.floor(Math.random() * 2) + 1;

        const productStocks = await prisma.productStock.findMany({ where: { productId: product.id } });
        if (productStocks.length > 0) {
          const randomStock = productStocks[Math.floor(Math.random() * productStocks.length)];
          if (!orderItemsData.some(item => item.product.id === product.id)) {
            orderItemsData.push({
              product,
              qty,
              warehouseId: randomStock.warehouseId,
              size: randomStock.size
            });
            totalSubtotal += product.price * qty;
          }
        }
      }

      if (orderItemsData.length > 0 && address) {
        const shipmentsData = [];
        const warehousesUsed = Array.from(new Set(orderItemsData.map(item => item.warehouseId)));
        let totalShippingCost = 0;

        for (const wId of warehousesUsed) {
          const cost = Math.floor(Math.random() * 20000) + 10000;
          totalShippingCost += cost;
          shipmentsData.push({
            warehouseId: wId as string,
            shippingCourier: couriers[Math.floor(Math.random() * couriers.length)],
            shippingService: services[Math.floor(Math.random() * services.length)],
            shippingCost: cost,
            trackingNumber: Math.random() > 0.5 ? `RESI${Math.floor(Math.random() * 1000000)}` : null,
            status: "PENDING",
          });
        }

        const totalAmount = totalSubtotal + totalShippingCost;
        const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

        const isPaid = orderStatus !== OrderStatus.PENDING && orderStatus !== OrderStatus.CANCELLED;
        const paymentMethod = isPaid ? ["credit_card", "bank_transfer", "gopay"][Math.floor(Math.random() * 3)] : null;
        const paymentToken = isPaid ? `TOK_${Math.floor(Math.random() * 1000000)}` : null;

        for (const shipment of shipmentsData) {
          shipment.status = orderStatus;
        }

        const order = await prisma.order.create({
          data: {
            userId: buyerUser.id,
            totalAmount,
            shippingCost: totalShippingCost,
            status: orderStatus,
            paymentMethod,
            paymentToken,
            shippingAddress: `${address.streetAddress}, ${address.village}, ${address.district}, ${address.city}, ${address.province} ${address.postcode}`,
            createdAt: orderCreatedAt,
            shipments: {
              create: shipmentsData
            }
          },
          include: {
            shipments: true
          }
        });

        // Create OrderItems linked to shipment
        for (const item of orderItemsData) {
          const shipment = (order as any).shipments.find((s: any) => s.warehouseId === item.warehouseId);
          if (shipment) {
            const createdOrderItem = await prisma.orderItem.create({
              data: {
                orderId: order.id,
                shipmentId: shipment.id,
                productId: item.product.id,
                quantity: item.qty,
                price: item.product.price,
                size: item.size
              }
            });

            // 6d. Buat Reviews & Returns
            if (orderStatus === OrderStatus.COMPLETED || orderStatus === OrderStatus.DELIVERED) {
              // 70% chance to leave a review
              if (Math.random() > 0.3) {
                const ratings = [3, 4, 4, 5, 5, 5];
                await prisma.productReview.create({
                  data: {
                    userId: buyerUser.id,
                    productId: item.product.id,
                    orderId: order.id,
                    rating: ratings[Math.floor(Math.random() * ratings.length)],
                    message: "Produk sangat bagus dan sesuai dengan deskripsi. Pengiriman juga cepat!",
                    images: Math.random() > 0.8 ? [images[Math.floor(Math.random() * images.length)]] : [],
                    createdAt: randomDate(orderCreatedAt, now)
                  }
                });
              }
            }

            if (orderStatus === OrderStatus.RETURN_REQUESTED || orderStatus === OrderStatus.RETURNED) {
              const returnStatus: ReturnStatus = orderStatus === OrderStatus.RETURNED ? ReturnStatus.COMPLETED : ReturnStatus.PENDING;
              await prisma.orderReturn.create({
                data: {
                  orderItemId: createdOrderItem.id,
                  reason: "Barang rusak saat diterima atau ukuran tidak sesuai.",
                  images: [images[Math.floor(Math.random() * images.length)]],
                  refundMethod: "BANK_TRANSFER",
                  refundAccount: "BCA 123456789",
                  shippingCourier: "JNE",
                  shippingService: "REG",
                  shippingCost: 15000,
                  status: returnStatus,
                  createdAt: randomDate(orderCreatedAt, now)
                }
              });
            }
          }
        }

        // Send order notification
        await prisma.notification.create({
          data: {
            userId: buyerUser.id,
            title: `Update Pesanan ${order.id.slice(-6)}`,
            message: `Pesanan Anda saat ini berstatus ${orderStatus}.`,
            link: `/orders`,
            createdAt: orderCreatedAt
          }
        });
      }
    }
  }

  console.log("🎉 Proses seeding seluruh data master berhasil (sellers, employees, products, orders, returns, reviews, notifications, stock movements)!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Terjadi kesalahan saat proses seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
