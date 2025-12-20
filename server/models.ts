import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  growId?: string;
  createdAt: Date;
}

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  depositWorld: string;
  updatedAt: Date;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image?: string;
  stockData: string[];
  category: string;
  createdAt: Date;
}

export interface IPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  price: number;
  stockData: string;
  status: "pending" | "approved" | "rejected";
  purchaseDate: Date;
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  message: string;
  createdAt: Date;
}

export interface ISlide extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IPendingProduct extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  stockData: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  isAdmin: { type: Boolean, required: true, default: false },
  isBanned: { type: Boolean, required: true, default: false },
  growId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

const SettingsSchema = new Schema<ISettings>({
  depositWorld: { type: String, required: true, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stockData: { type: [String], default: [] },
  category: { type: String, required: true, default: "general" },
  createdAt: { type: Date, default: Date.now },
});

const PurchaseSchema = new Schema<IPurchase>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  stockData: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  purchaseDate: { type: Date, default: Date.now },
});

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SlideSchema = new Schema<ISlide>({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  imageUrl: { type: String, required: true },
  ctaLabel: { type: String, default: "" },
  ctaHref: { type: String, default: "" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const PendingProductSchema = new Schema<IPendingProduct>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  category: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminNote: { type: String, default: "" },
  stockData: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export const PurchaseModel = mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
export const SlideModel = mongoose.models.Slide || mongoose.model<ISlide>("Slide", SlideSchema);
export const PendingProductModel = mongoose.models.PendingProduct || mongoose.model<IPendingProduct>("PendingProduct", PendingProductSchema);
