import { z } from "zod";

// Skema untuk elemen di dalam array stocks (Reused)
export const stockSchema = z.object({
  id: z.string().min(1, { message: "Validation.stock.warehouseIdRequired" }),
  size: z.string().default("ALL"),
  qty: z
    .number({ message: "Validation.stock.qtyMustBeNumber" })
    .min(0, { message: "Validation.stock.qtyMinZero" }),
});

// Skema untuk Create Product
export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.nameRequired" })
    .min(3, { message: "Validation.product.nameMin3" }),
  slug: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.slugRequired" }),
  price: z
    .number({ message: "Validation.product.priceMustBeNumber" })
    .min(0, { message: "Validation.product.priceMinZero" }),
  weight: z
    .number({ message: "Validation.product.weightMustBeNumber" })
    .min(0, { message: "Validation.product.weightMinZero" })
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.descriptionRequired" }),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "BLOCKED"]).default("DRAFT"),
  categoryId: z
    .string()
    .min(1, { message: "Validation.product.categoryRequired" }),
  images: z.array(
    z.string().url({ message: "Validation.product.imageUrlInvalid" }),
  ),
  stocks: z.array(stockSchema).default([]),
});

// Skema untuk Update Product
export const updateProductSchema = z.object({
  id: z.string().min(1, { message: "Validation.product.idRequired" }),
  name: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.nameRequired" })
    .min(3, { message: "Validation.product.nameMin3" }),
  slug: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.slugRequired" }),
  price: z
    .number({ message: "Validation.product.priceMustBeNumber" })
    .min(0, { message: "Validation.product.priceMinZero" }),
  weight: z
    .number({ message: "Validation.product.weightMustBeNumber" })
    .min(0, { message: "Validation.product.weightMinZero" })
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, { message: "Validation.product.descriptionRequired" }),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "BLOCKED"]).catch("DRAFT"),
  categoryId: z
    .string()
    .min(1, { message: "Validation.product.categoryRequired" }),
  images: z
    .array(z.string().url({ message: "Validation.product.imageUrlInvalid" }))
    .optional()
    .default([]),
  stocks: z.array(stockSchema).optional().default([]),
});

// Export Alias jika masih dibutuhkan di file lain
export const updateStockSchema = stockSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
