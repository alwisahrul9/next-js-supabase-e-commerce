import { z } from "zod";

export const warehouseSchema = z.object({
  id: z.string().optional(),
  warehouseName: z.string().min(3, "warehouseNameMin"),
  isMain: z.boolean().optional(),
  province: z.string().min(1, "provinceRequired"),
  city: z.string().min(1, "cityRequired"),
  cityId: z.string().nullable().optional(),
  district: z.string().min(1, "districtRequired"),
  districtId: z.string().nullable().optional(),
  village: z.string().min(1, "villageRequired"),
  villageId: z.string().nullable().optional(),
  postcode: z.string().min(3, "postcodeInvalid"),
  streetAddress: z.string().min(5, "streetAddressMin"),
  latitude: z.number({ message: "locationRequired" }),
  longitude: z.number({ message: "locationRequired" }),
});

export const sellerOnboardingSchema = z.object({
  storeName: z.string().min(3, "storeNameMin"),
  storeDescription: z.string().optional().or(z.literal("")),
  logoUrl: z.string().url("logoUrlInvalid").optional().or(z.literal("")),
  warehouses: z.array(warehouseSchema).min(1, "warehouseRequired"),
});

export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
