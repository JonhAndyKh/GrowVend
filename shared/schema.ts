import { z } from "zod";

export type User = {
  id: string;
  email: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  growId: string | null;
  createdAt: Date;
};

export type Settings = {
  id: string;
  depositWorld: string;
  updatedAt: Date;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stockData: string[];
  category: string;
  createdAt: Date;
};

export type Purchase = {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  stockData: string;
  status: "pending" | "approved" | "rejected";
  purchaseDate: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: Date;
};

export type ChatMessage = {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  createdAt: Date;
};

export type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
};

export type PendingProduct = {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  stockData: string[];
  createdAt: Date;
};

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const setGrowIdSchema = z.object({
  growId: z.string().min(3, "GrowID must be at least 3 characters").max(20, "GrowID must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "GrowID can only contain letters, numbers, and underscores"),
});

export const updateSettingsSchema = z.object({
  depositWorld: z.string().min(1, "Deposit World is required"),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  image: z.string().optional().nullable(),
  stockData: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export const insertPurchaseSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  productName: z.string(),
  price: z.number(),
  stockData: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const insertTransactionSchema = z.object({
  userId: z.string(),
  type: z.string(),
  amount: z.number(),
  description: z.string(),
});

export const insertChatMessageSchema = z.object({
  message: z.string().min(1).max(500),
});

export const insertSlideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL"),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const insertPendingProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  image: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
});

export const approvePendingProductSchema = z.object({
  stockData: z.array(z.string()).min(1, "At least one stock item is required"),
  adminNote: z.string().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type InsertPendingProduct = z.infer<typeof insertPendingProductSchema>;
export type ApprovePendingProduct = z.infer<typeof approvePendingProductSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
