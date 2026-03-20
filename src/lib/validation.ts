import { z } from 'zod';

export const ProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    brand: z.string().optional(),
    variant: z.string().optional(),
    size: z.string().optional(),
    price: z.union([z.number(), z.string()]),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    storeId: z.string().optional(),
    storeLocation: z.string().optional(),
});

export const MessageSchema = z.object({
    content: z.string().min(1, "Content is required").max(300, "Content exceeds 300 characters"),
    productId: z.string().optional(),
    parentId: z.string().optional(),
});
