"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { revalidatePath } from "next/cache";
import { hash } from "bcrypt-ts";


export async function createEmployee(data: {
  name: string;
  email: string;
  password?: string;
  warehouseIds: string[];
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SELLER") {
    return { error: "Unauthorized" };
  }

  const storeProfileId = (session.user as any).storeProfile?.id;
  if (!storeProfileId) return { error: "Store not found" };

  try {
    
    // Cek email apakah sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Email sudah digunakan oleh akun lain." };
    }

    const hashedPassword = data.password ? await hash(data.password, 10) : undefined;

    // Buat User dan EmployeeProfile sekaligus
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        employeeProfile: {
          create: {
            storeProfileId: storeProfileId,
            canManageProducts: data.canManageProducts,
            canManageOrders: data.canManageOrders,
            canManageCustomers: data.canManageCustomers,
            warehouses: {
              connect: data.warehouseIds.map((id) => ({ id })),
            },
          },
        },
      },
    });

    revalidatePath("/[locale]/(seller)/seller/settings", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return { error: "An error occurred while creating employee account." };
  }
}

export async function updateEmployee(
  employeeId: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    warehouseIds: string[];
    canManageProducts: boolean;
    canManageOrders: boolean;
    canManageCustomers: boolean;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SELLER") {
    return { error: "Unauthorized" };
  }

  const storeProfileId = (session.user as any).storeProfile?.id;
  if (!storeProfileId) return { error: "Store not found" };

  try {
    
    const employee = await prisma.employeeProfile.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee || employee.storeProfileId !== storeProfileId) {
      return { error: "Employee not found" };
    }

    if (data.email && data.email !== employee.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return { error: "Email sudah digunakan oleh akun lain." };
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await hash(data.password, 10);

    // Update User
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: updateData,
      });
    }

    // Update Employee Profile
    await prisma.employeeProfile.update({
      where: { id: employeeId },
      data: {
        canManageProducts: data.canManageProducts,
        canManageOrders: data.canManageOrders,
        canManageCustomers: data.canManageCustomers,
        warehouses: {
          set: data.warehouseIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/[locale]/(seller)/seller/settings", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return { error: "An error occurred while updating employee account." };
  }
}

export async function deleteEmployee(employeeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SELLER") {
    return { error: "Unauthorized" };
  }

  const storeProfileId = (session.user as any).storeProfile?.id;
  if (!storeProfileId) return { error: "Store not found" };

  try {
    
    const employee = await prisma.employeeProfile.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.storeProfileId !== storeProfileId) {
      return { error: "Employee not found" };
    }

    // Karena onDelete Cascade, menghapus User akan menghapus EmployeeProfile juga
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    revalidatePath("/[locale]/(seller)/seller/settings", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return { error: "An error occurred while deleting employee account." };
  }
}
