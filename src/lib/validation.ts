import { z } from 'zod';

export const ProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    price: z.number().positive("Price must be positive"),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().url("Must be a valid URL"),
});

export const MessageSchema = z.object({
    content: z.string().min(1, "Content is required").max(300, "Content exceeds 300 characters"),
    productId: z.string().optional(),
    parentId: z.string().optional(),
});
