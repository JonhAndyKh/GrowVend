import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import { z } from "zod";

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "";

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: GlobalMongoose | undefined;
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set");
  }
  
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// Mongoose Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  growId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  depositWorld: { type: String, default: "" },
});

const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stockData: { type: [String], default: [] },
  category: { type: String, default: "general" },
  createdAt: { type: Date, default: Date.now },
});

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  stockData: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const slideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  imageUrl: { type: String, required: true },
  ctaLabel: { type: String, default: null },
  ctaHref: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
const PurchaseModel = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
const TransactionModel = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
const SettingsModel = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
const SlideModel = mongoose.models.Slide || mongoose.model("Slide", slideSchema);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const setGrowIdSchema = z.object({
  growId: z.string().min(3, "GrowID must be at least 3 characters").max(20, "GrowID must be at most 20 characters"),
});

const updateSettingsSchema = z.object({
  depositWorld: z.string().min(1, "Deposit world is required").max(50, "Deposit world must be at most 50 characters"),
});

const insertChatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(500, "Message must be at most 500 characters"),
});

const insertSlideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL"),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Express app setup
const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware - must be synchronous and applied before routes
if (MONGODB_URI) {
  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60,
      }),
      secret: process.env.SESSION_SECRET || "grow4bot-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
      },
    })
  );
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Helper functions
function toUser(doc: any) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    password: doc.password,
    balance: doc.balance,
    isAdmin: doc.isAdmin,
    isBanned: doc.isBanned,
    growId: doc.growId || null,
    createdAt: doc.createdAt,
  };
}

function toSettings(doc: any) {
  return {
    id: doc._id.toString(),
    depositWorld: doc.depositWorld || "",
  };
}

function toChatMessage(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userEmail: doc.userEmail,
    message: doc.message,
    createdAt: doc.createdAt,
  };
}

function toProduct(doc: any) {
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

function toPurchase(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    productId: doc.productId.toString(),
    productName: doc.productName,
    price: doc.price,
    stockData: doc.stockData,
    purchaseDate: doc.purchaseDate,
  };
}

function toTransaction(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    amount: doc.amount,
    description: doc.description,
    createdAt: doc.createdAt,
  };
}

function toSlide(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    subtitle: doc.subtitle || null,
    imageUrl: doc.imageUrl,
    ctaLabel: doc.ctaLabel || null,
    ctaHref: doc.ctaHref || null,
    order: doc.order || 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
  };
}

// Middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await UserModel.findById(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

// Routes
let routesInitialized = false;
function initRoutes() {
  if (routesInitialized) return;

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      await connectDB();
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === "admin@grow4bot.com";
      
      const user = await UserModel.create({
        email,
        password: hashedPassword,
        isAdmin,
        balance: 0,
        isBanned: false,
      });

      if (req.session) {
        req.session.userId = user._id.toString();
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) console.error("Session save error:", err);
            resolve();
          });
        });
      }
      
      const userData = toUser(user);
      const { password: _, ...userWithoutPassword } = userData;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Registration error:", error.message, error.stack);
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      await connectDB();
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (req.session) {
        req.session.userId = user._id.toString();
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) console.error("Session save error:", err);
            resolve();
          });
        });
      }
      
      const userData = toUser(user);
      const { password: _, ...userWithoutPassword } = userData;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error.message, error.stack);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      await connectDB();
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await UserModel.findById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      const userData = toUser(user);
      const { password: _, ...userWithoutPassword } = userData;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Get me error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      await connectDB();
      const products = await ProductModel.find().sort({ createdAt: -1 });
      res.json(products.map(toProduct));
    } catch (error: any) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;
      const userId = req.session.userId!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Product not found" });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.stockData || product.stockData.length === 0) {
        return res.status(400).json({ message: "Product is out of stock" });
      }

      if (user.balance < product.price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const stockItem = product.stockData[0];
      const newStockData = product.stockData.slice(1);

      await ProductModel.findByIdAndUpdate(id, { stockData: newStockData });

      const newBalance = user.balance - product.price;
      await UserModel.findByIdAndUpdate(userId, { balance: newBalance });

      const purchase = await PurchaseModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        productId: new mongoose.Types.ObjectId(id),
        productName: product.name,
        price: product.price,
        stockData: stockItem,
      });

      await TransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: "purchase",
        amount: product.price,
        description: `Purchased ${product.name}`,
      });

      res.json({ purchase: toPurchase(purchase), stockData: stockItem });
    } catch (error: any) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Purchase failed" });
    }
  });

  app.get("/api/purchases", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const userId = req.session.userId!;
      const purchases = await PurchaseModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ purchaseDate: -1 });
      res.json(purchases.map(toPurchase));
    } catch (error: any) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const userId = req.session.userId!;
      const transactions = await TransactionModel.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
      res.json(transactions.map(toTransaction));
    } catch (error: any) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const userId = req.session.userId!;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await UserModel.findByIdAndUpdate(userId, { balance: newBalance });

      await TransactionModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: "topup",
        amount,
        description: `Topped up wallet with $${amount.toFixed(2)}`,
      });

      res.json({ balance: newBalance });
    } catch (error: any) {
      console.error("Top up error:", error);
      res.status(500).json({ message: "Top up failed" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const users = await UserModel.find().sort({ createdAt: -1 });
      const usersWithoutPasswords = users.map((u) => {
        const userData = toUser(u);
        const { password, ...rest } = userData;
        return rest;
      });
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;
      const { banned } = req.body;

      if (typeof banned !== "boolean") {
        return res.status(400).json({ message: "Invalid banned value" });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = await UserModel.findByIdAndUpdate(id, { isBanned: banned }, { new: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = toUser(user);
      const { password: _, ...userWithoutPassword } = userData;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/balance", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await UserModel.findByIdAndUpdate(id, { balance: newBalance });

      await TransactionModel.create({
        userId: new mongoose.Types.ObjectId(id),
        type: "admin_add",
        amount,
        description: `Admin added $${amount.toFixed(2)} to wallet`,
      });

      res.json({ balance: newBalance });
    } catch (error: any) {
      console.error("Add balance error:", error);
      res.status(500).json({ message: "Failed to add balance" });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { name, description, price, image, stockData, category } = req.body;

      if (!name || typeof price !== "number") {
        return res.status(400).json({ message: "Name and price are required" });
      }

      const product = await ProductModel.create({
        name,
        description: description || "",
        price,
        image: image || "",
        stockData: stockData || [],
        category: category || "general",
      });
      res.status(201).json(toProduct(product));
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;
      const { name, description, price, image, stockData, category } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || "";
      if (price !== undefined) updateData.price = price;
      if (image !== undefined) updateData.image = image || "";
      if (stockData !== undefined) updateData.stockData = stockData;
      if (category !== undefined) updateData.category = category;

      const product = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(toProduct(product));
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Product not found" });
      }

      await ProductModel.findByIdAndDelete(id);
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // GrowID endpoint - Set or update user's GrowID
  app.post("/api/wallet/growid", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const userId = req.session.userId!;
      const parseResult = setGrowIdSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid GrowID" });
      }

      const { growId } = parseResult.data;
      const normalizedGrowId = growId.toLowerCase();

      // Check if this GrowID is already taken by another user
      const existingUser = await UserModel.findOne({ growId: normalizedGrowId });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "This GrowID is already taken by another user" });
      }

      const user = await UserModel.findByIdAndUpdate(userId, { growId: normalizedGrowId }, { new: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = toUser(user);
      const { password: _, ...userWithoutPassword } = userData;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Set GrowID error:", error);
      res.status(500).json({ message: "Failed to set GrowID" });
    }
  });

  // Get settings (public for deposit world display)
  app.get("/api/settings", async (req, res) => {
    try {
      await connectDB();
      let settings = await SettingsModel.findOne({ key: "global" });
      if (!settings) {
        settings = await SettingsModel.create({ key: "global", depositWorld: "" });
      }
      res.json(toSettings(settings));
    } catch (error: any) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings (admin only)
  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const parseResult = updateSettingsSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { depositWorld } = parseResult.data;
      const settings = await SettingsModel.findOneAndUpdate(
        { key: "global" },
        { depositWorld },
        { new: true, upsert: true }
      );
      res.json(toSettings(settings));
    } catch (error: any) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get chat messages
  app.get("/api/chat", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const messages = await ChatMessageModel.find().sort({ createdAt: -1 }).limit(100);
      res.json(messages.map(toChatMessage).reverse());
    } catch (error: any) {
      console.error("Get chat messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Post a chat message
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      await connectDB();
      const userId = req.session.userId!;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "You are banned from chatting" });
      }

      const parseResult = insertChatMessageSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid message" });
      }

      const { message } = parseResult.data;
      const chatMessage = await ChatMessageModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        userEmail: user.email,
        message,
      });
      res.status(201).json(toChatMessage(chatMessage));
    } catch (error: any) {
      console.error("Create chat message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get active slides (public)
  app.get("/api/slides", async (req, res) => {
    try {
      await connectDB();
      const slides = await SlideModel.find({ isActive: true }).sort({ order: 1 });
      res.json(slides.map(toSlide));
    } catch (error: any) {
      console.error("Get slides error:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  // Get all slides (admin)
  app.get("/api/admin/slides", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const slides = await SlideModel.find().sort({ order: 1 });
      res.json(slides.map(toSlide));
    } catch (error: any) {
      console.error("Get all slides error:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  // Create slide (admin)
  app.post("/api/admin/slides", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const parseResult = insertSlideSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const slide = await SlideModel.create(parseResult.data);
      res.status(201).json(toSlide(slide));
    } catch (error: any) {
      console.error("Create slide error:", error);
      res.status(500).json({ message: "Failed to create slide" });
    }
  });

  // Update slide (admin)
  app.patch("/api/admin/slides/:id", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Slide not found" });
      }

      const slide = await SlideModel.findByIdAndUpdate(id, req.body, { new: true });
      if (!slide) {
        return res.status(404).json({ message: "Slide not found" });
      }
      res.json(toSlide(slide));
    } catch (error: any) {
      console.error("Update slide error:", error);
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  // Delete slide (admin)
  app.delete("/api/admin/slides/:id", requireAdmin, async (req, res) => {
    try {
      await connectDB();
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Slide not found" });
      }

      await SlideModel.findByIdAndDelete(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete slide error:", error);
      res.status(500).json({ message: "Failed to delete slide" });
    }
  });

  routesInitialized = true;
}

// Initialize routes at module level
initRoutes();

// Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
