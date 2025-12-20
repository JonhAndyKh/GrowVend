import { 
  UserModel, 
  ProductModel, 
  PurchaseModel, 
  TransactionModel,
  SettingsModel,
  ChatMessageModel,
  SlideModel,
  PendingProductModel
} from "./models";
import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Purchase, 
  type InsertPurchase,
  type Transaction, 
  type InsertTransaction,
  type Settings,
  type ChatMessage,
  type Slide,
  type InsertSlide,
  type PendingProduct,
  type InsertPendingProduct
} from "@shared/schema";
import { connectDB } from "./db";
import mongoose from "mongoose";

function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    balance: doc.balance,
    isAdmin: doc.isAdmin,
    isBanned: doc.isBanned,
    growId: doc.growId || null,
    resetToken: doc.resetToken || null,
    resetTokenExpiry: doc.resetTokenExpiry || null,
    createdAt: doc.createdAt,
  };
}

function toSettings(doc: any): Settings {
  return {
    id: doc._id.toString(),
    depositWorld: doc.depositWorld,
    updatedAt: doc.updatedAt,
  };
}

function toProduct(doc: any): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description || null,
    price: doc.price,
    image: doc.image || null,
    stockData: doc.stockData || [],
    category: doc.category,
    createdAt: doc.createdAt,
  };
}

function toPurchase(doc: any): Purchase {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    productId: doc.productId.toString(),
    productName: doc.productName,
    price: doc.price,
    stockData: doc.stockData,
    status: doc.status || "pending",
    purchaseDate: doc.purchaseDate,
  };
}

function toTransaction(doc: any): Transaction {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amount: doc.amount,
    description: doc.description,
    createdAt: doc.createdAt,
  };
}

function toChatMessage(doc: any): ChatMessage {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userEmail: doc.userEmail,
    message: doc.message,
    createdAt: doc.createdAt,
  };
}

function toSlide(doc: any): Slide {
  return {
    id: doc._id.toString(),
    title: doc.title,
    subtitle: doc.subtitle || null,
    imageUrl: doc.imageUrl,
    ctaLabel: doc.ctaLabel || null,
    ctaHref: doc.ctaHref || null,
    order: doc.order,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
  };
}

function toPendingProduct(doc: any): PendingProduct {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userEmail: doc.userEmail,
    name: doc.name,
    description: doc.description || null,
    price: doc.price,
    image: doc.image || null,
    category: doc.category,
    status: doc.status,
    adminNote: doc.adminNote || null,
    stockData: doc.stockData || [],
    createdAt: doc.createdAt,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGrowId(growId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  updateUserBalance(id: string, balance: number): Promise<User | undefined>;
  updateUserBanned(id: string, banned: boolean): Promise<User | undefined>;
  updateUserGrowId(id: string, growId: string): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  setResetToken(id: string, token: string, expiry: Date): Promise<User | undefined>;
  clearResetToken(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getProduct(id: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, stockData: string[]): Promise<Product | undefined>;

  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: string): Promise<Purchase[]>;
  getAllPurchases(): Promise<Purchase[]>;
  getPendingPurchases(): Promise<Purchase[]>;
  approvePurchase(id: string): Promise<Purchase | undefined>;
  rejectPurchase(id: string): Promise<Purchase | undefined>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  getSettings(): Promise<Settings>;
  updateSettings(depositWorld: string): Promise<Settings>;

  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(userId: string, userEmail: string, message: string): Promise<ChatMessage>;

  getSlides(activeOnly?: boolean): Promise<Slide[]>;
  getSlide(id: string): Promise<Slide | undefined>;
  createSlide(slide: InsertSlide): Promise<Slide>;
  updateSlide(id: string, slide: Partial<InsertSlide>): Promise<Slide | undefined>;
  deleteSlide(id: string): Promise<boolean>;

}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findById(id);
    return user ? toUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await connectDB();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? toUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    await connectDB();
    const user = await UserModel.create({
      email: insertUser.email.toLowerCase(),
      password: insertUser.password,
      isAdmin: insertUser.isAdmin || false,
      balance: 0,
      isBanned: false,
    });
    return toUser(user);
  }

  async updateUserBalance(id: string, balance: number): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { balance }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async updateUserBanned(id: string, banned: boolean): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { isBanned: banned }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    await connectDB();
    const users = await UserModel.find().sort({ createdAt: -1 });
    return users.map(toUser);
  }

  async getUserByGrowId(growId: string): Promise<User | undefined> {
    await connectDB();
    const user = await UserModel.findOne({ growId: growId.toLowerCase() });
    return user ? toUser(user) : undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    await connectDB();
    const user = await UserModel.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    return user ? toUser(user) : undefined;
  }

  async setResetToken(id: string, token: string, expiry: Date): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(
      id, 
      { resetToken: token, resetTokenExpiry: expiry }, 
      { new: true }
    );
    return user ? toUser(user) : undefined;
  }

  async clearResetToken(id: string): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(
      id,
      { resetToken: null, resetTokenExpiry: null },
      { new: true }
    );
    return user ? toUser(user) : undefined;
  }

  async updateUserGrowId(id: string, growId: string): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { growId: growId.toLowerCase() }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
    return user ? toUser(user) : undefined;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const product = await ProductModel.findById(id);
    return product ? toProduct(product) : undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    await connectDB();
    const products = await ProductModel.find().sort({ createdAt: -1 });
    return products.map(toProduct);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    await connectDB();
    const newProduct = await ProductModel.create({
      name: product.name,
      description: product.description || "",
      price: product.price,
      image: product.image || "",
      stockData: product.stockData || [],
      category: product.category || "general",
    });
    return toProduct(newProduct);
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    
    const updateData: Record<string, any> = {};
    if (product.name !== undefined) updateData.name = product.name;
    if (product.description !== undefined) updateData.description = product.description || "";
    if (product.price !== undefined) updateData.price = product.price;
    if (product.image !== undefined) updateData.image = product.image || "";
    if (product.stockData !== undefined) updateData.stockData = product.stockData;
    if (product.category !== undefined) updateData.category = product.category;
    
    const updated = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
    return updated ? toProduct(updated) : undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await ProductModel.findByIdAndDelete(id);
    return true;
  }

  async updateProductStock(id: string, stockData: string[]): Promise<Product | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await ProductModel.findByIdAndUpdate(id, { stockData }, { new: true });
    return updated ? toProduct(updated) : undefined;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    await connectDB();
    const newPurchase = await PurchaseModel.create({
      userId: new mongoose.Types.ObjectId(purchase.userId),
      productId: new mongoose.Types.ObjectId(purchase.productId),
      productName: purchase.productName,
      price: purchase.price,
      stockData: purchase.stockData,
    });
    return toPurchase(newPurchase);
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const purchases = await PurchaseModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ purchaseDate: -1 });
    return purchases.map(toPurchase);
  }

  async getAllPurchases(): Promise<Purchase[]> {
    await connectDB();
    const purchases = await PurchaseModel.find().sort({ purchaseDate: -1 });
    return purchases.map(toPurchase);
  }

  async getPendingPurchases(): Promise<Purchase[]> {
    await connectDB();
    const purchases = await PurchaseModel.find({ status: "pending" }).sort({ purchaseDate: -1 });
    return purchases.map(toPurchase);
  }

  async approvePurchase(id: string): Promise<Purchase | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await PurchaseModel.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    return updated ? toPurchase(updated) : undefined;
  }

  async rejectPurchase(id: string): Promise<Purchase | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await PurchaseModel.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    return updated ? toPurchase(updated) : undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    await connectDB();
    const newTransaction = await TransactionModel.create({
      userId: new mongoose.Types.ObjectId(transaction.userId),
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
    });
    return toTransaction(newTransaction);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const transactions = await TransactionModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    return transactions.map(toTransaction);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    await connectDB();
    const transactions = await TransactionModel.find().sort({ createdAt: -1 });
    return transactions.map(toTransaction);
  }

  async getSettings(): Promise<Settings> {
    await connectDB();
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({ depositWorld: "" });
    }
    return toSettings(settings);
  }

  async updateSettings(depositWorld: string): Promise<Settings> {
    await connectDB();
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({ depositWorld, updatedAt: new Date() });
    } else {
      settings = await SettingsModel.findByIdAndUpdate(
        settings._id,
        { depositWorld, updatedAt: new Date() },
        { new: true }
      );
    }
    return toSettings(settings);
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    await connectDB();
    const messages = await ChatMessageModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    return messages.map(toChatMessage).reverse();
  }

  async createChatMessage(userId: string, userEmail: string, message: string): Promise<ChatMessage> {
    await connectDB();
    const newMessage = await ChatMessageModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail,
      message,
    });
    return toChatMessage(newMessage);
  }

  async getSlides(activeOnly: boolean = false): Promise<Slide[]> {
    await connectDB();
    const query = activeOnly ? { isActive: true } : {};
    const slides = await SlideModel.find(query).sort({ order: 1, createdAt: -1 });
    return slides.map(toSlide);
  }

  async getSlide(id: string): Promise<Slide | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const slide = await SlideModel.findById(id);
    return slide ? toSlide(slide) : undefined;
  }

  async createSlide(slide: InsertSlide): Promise<Slide> {
    await connectDB();
    const maxOrder = await SlideModel.findOne().sort({ order: -1 });
    const newOrder = maxOrder ? maxOrder.order + 1 : 0;
    
    const newSlide = await SlideModel.create({
      title: slide.title,
      subtitle: slide.subtitle || "",
      imageUrl: slide.imageUrl,
      ctaLabel: slide.ctaLabel || "",
      ctaHref: slide.ctaHref || "",
      order: slide.order ?? newOrder,
      isActive: slide.isActive ?? true,
    });
    return toSlide(newSlide);
  }

  async updateSlide(id: string, slide: Partial<InsertSlide>): Promise<Slide | undefined> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    
    const updateData: Record<string, any> = {};
    if (slide.title !== undefined) updateData.title = slide.title;
    if (slide.subtitle !== undefined) updateData.subtitle = slide.subtitle || "";
    if (slide.imageUrl !== undefined) updateData.imageUrl = slide.imageUrl;
    if (slide.ctaLabel !== undefined) updateData.ctaLabel = slide.ctaLabel || "";
    if (slide.ctaHref !== undefined) updateData.ctaHref = slide.ctaHref || "";
    if (slide.order !== undefined) updateData.order = slide.order;
    if (slide.isActive !== undefined) updateData.isActive = slide.isActive;
    
    const updated = await SlideModel.findByIdAndUpdate(id, updateData, { new: true });
    return updated ? toSlide(updated) : undefined;
  }

  async deleteSlide(id: string): Promise<boolean> {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await SlideModel.findByIdAndDelete(id);
    return true;
  }
}

export const storage = new DatabaseStorage();
