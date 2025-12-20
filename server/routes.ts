import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB, mongoose } from "./db";
import { loginSchema, registerSchema, insertProductSchema, setGrowIdSchema, updateSettingsSchema, insertChatMessageSchema, insertSlideSchema, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import config, { validateConfig } from "./config";
import { sendPasswordResetEmail } from "./email";
import crypto from "crypto";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  validateConfig();
  await connectDB();
  
  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: config.mongodb.uri,
        collectionName: "sessions",
      }),
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        maxAge: config.cookie.maxAge,
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
      },
    })
  );

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email.toLowerCase() === "admin@growvend.com";
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        isAdmin,
      });

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email, password } = parseResult.data;

      const user = await storage.getUserByEmail(email);
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

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
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
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      console.log("📧 Forgot password request received");
      const parseResult = forgotPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { email } = parseResult.data;
      console.log(`🔍 Looking up user with email: ${email}`);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }

      console.log(`✅ User found: ${user.id}`);

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await storage.setResetToken(user.id, resetToken, resetTokenExpiry);
      console.log(`🔐 Reset token created: ${resetToken.substring(0, 8)}...`);

      // Construct the base URL for different deployment environments
      let baseUrl: string;
      const host = req.get('host') || '';
      const forwardedHost = req.get('x-forwarded-host') || '';
      const forwardedProto = req.get('x-forwarded-proto') || 'https';
      
      if (forwardedHost && !forwardedHost.includes('localhost')) {
        // Use forwarded headers (set by reverse proxy/CDN)
        baseUrl = `${forwardedProto}://${forwardedHost}`;
      } else if (process.env.REPLIT_DEV_DOMAIN) {
        // Replit environment
        baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
      } else if (host && !host.includes('localhost')) {
        // Direct request to public domain
        const protocol = req.protocol || 'https';
        baseUrl = `${protocol}://${host}`;
      } else {
        // Fallback for local development
        baseUrl = 'http://localhost:5000';
      }
      
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      console.log(`📤 Sending password reset email...`);
      const emailSent = await sendPasswordResetEmail(user.email, resetLink);

      if (!emailSent) {
        console.error("❌ Email sending returned false");
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      console.log(`✅ Password reset email sent successfully`);
      res.json({ message: "Password reset link sent to your email" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      console.log("🔄 Reset password request received");
      const parseResult = resetPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log("❌ Validation failed:", parseResult.error.errors[0]);
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { token, password } = parseResult.data;
      console.log(`🔍 Looking up token: ${token.substring(0, 20)}...`);

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        console.log("❌ User not found with reset token or token expired");
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      console.log(`✅ User found: ${user.id}`);
      const hashedPassword = await bcrypt.hash(password, 10);

      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearResetToken(user.id);

      console.log("✅ Password reset successfully");
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("❌ Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity = 1 } = req.body;
      const userId = req.session.userId!;

      const requestedQuantity = Math.max(1, Math.floor(quantity));

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.stockData || product.stockData.length === 0) {
        return res.status(400).json({ message: "Product is out of stock" });
      }

      if (product.stockData.length < requestedQuantity) {
        return res.status(400).json({ message: `Only ${product.stockData.length} items available` });
      }

      const totalPrice = product.price * requestedQuantity;
      if (user.balance < totalPrice) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const purchasedStockItems = product.stockData.slice(0, requestedQuantity);
      const newStockData = product.stockData.slice(requestedQuantity);

      console.log(`[Purchase] User ${userId} buying ${requestedQuantity}x ${product.name}`);
      console.log(`[Purchase] Stock items to purchase:`, purchasedStockItems);

      await storage.updateProductStock(id, newStockData);

      const newBalance = user.balance - totalPrice;
      await storage.updateUserBalance(userId, newBalance);

      // Create all purchases in parallel
      const purchasePromises = purchasedStockItems.map((stockItem, i) => {
        console.log(`[Purchase] Creating purchase record ${i + 1}/${purchasedStockItems.length} for stock: ${stockItem}`);
        return storage.createPurchase({
          userId,
          productId: id,
          productName: product.name,
          price: product.price,
          stockData: stockItem,
        }).then(purchase => {
          console.log(`[Purchase] Purchase created:`, purchase.id);
          return purchase;
        });
      });

      const purchases = await Promise.all(purchasePromises);
      console.log(`[Purchase] Total purchases created: ${purchases.length}`);

      await storage.createTransaction({
        userId,
        type: "purchase",
        amount: totalPrice,
        description: `Purchased ${requestedQuantity}x ${product.name}`,
      });

      res.json({ purchases, stockData: purchasedStockItems, quantity: requestedQuantity });
    } catch (error: any) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Purchase failed" });
    }
  });

  app.get("/api/purchases", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error: any) {
      console.error("Get purchases error:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/admin/purchases/pending", requireAdmin, async (req, res) => {
    try {
      const purchases = await storage.getPendingPurchases();
      res.json(purchases);
    } catch (error: any) {
      console.error("Get pending purchases error:", error);
      res.status(500).json({ message: "Failed to fetch pending purchases" });
    }
  });

  app.patch("/api/admin/purchases/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const purchase = await storage.approvePurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error: any) {
      console.error("Approve purchase error:", error);
      res.status(500).json({ message: "Failed to approve purchase" });
    }
  });

  app.patch("/api/admin/purchases/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const purchase = await storage.rejectPurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error: any) {
      console.error("Reject purchase error:", error);
      res.status(500).json({ message: "Failed to reject purchase" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await storage.updateUserBalance(userId, newBalance);

      await storage.createTransaction({
        userId,
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

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...u }) => u);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;

      if (typeof banned !== "boolean") {
        return res.status(400).json({ message: "Invalid banned value" });
      }

      const user = await storage.updateUserBanned(id, banned);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/balance", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBalance = user.balance + amount;
      await storage.updateUserBalance(id, newBalance);

      await storage.createTransaction({
        userId: id,
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
      const parseResult = insertProductSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const product = await storage.createProduct(parseResult.data);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, image, stockData, category } = req.body;

      const product = await storage.updateProduct(id, {
        name,
        description,
        price,
        image,
        stockData,
        category,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // GrowID endpoint - Set or update user's GrowID
  app.post("/api/wallet/growid", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parseResult = setGrowIdSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid GrowID" });
      }

      const { growId } = parseResult.data;
      const normalizedGrowId = growId.toLowerCase();

      // Check if this GrowID is already taken by another user
      const existingUser = await storage.getUserByGrowId(normalizedGrowId);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "This GrowID is already taken by another user" });
      }

      const user = await storage.updateUserGrowId(userId, normalizedGrowId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Set GrowID error:", error);
      res.status(500).json({ message: "Failed to set GrowID" });
    }
  });

  // Get settings (public for deposit world display)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings (admin only)
  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const parseResult = updateSettingsSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const { depositWorld } = parseResult.data;
      const settings = await storage.updateSettings(depositWorld);
      res.json(settings);
    } catch (error: any) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get chat messages
  app.get("/api/chat", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getChatMessages(100);
      res.json(messages);
    } catch (error: any) {
      console.error("Get chat messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Post a chat message
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
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
      const chatMessage = await storage.createChatMessage(userId, user.email, message);
      res.status(201).json(chatMessage);
    } catch (error: any) {
      console.error("Create chat message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get all transactions (admin)
  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      console.error("Get all transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get all purchases (admin)
  app.get("/api/admin/purchases", requireAdmin, async (req, res) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error: any) {
      console.error("Get all purchases error:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Get active slides (public)
  app.get("/api/slides", async (req, res) => {
    try {
      const slides = await storage.getSlides(true);
      res.json(slides);
    } catch (error: any) {
      console.error("Get slides error:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  // Get all slides (admin)
  app.get("/api/admin/slides", requireAdmin, async (req, res) => {
    try {
      const slides = await storage.getSlides(false);
      res.json(slides);
    } catch (error: any) {
      console.error("Get all slides error:", error);
      res.status(500).json({ message: "Failed to fetch slides" });
    }
  });

  // Create slide (admin)
  app.post("/api/admin/slides", requireAdmin, async (req, res) => {
    try {
      const parseResult = insertSlideSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Invalid input" });
      }

      const slide = await storage.createSlide(parseResult.data);
      res.status(201).json(slide);
    } catch (error: any) {
      console.error("Create slide error:", error);
      res.status(500).json({ message: "Failed to create slide" });
    }
  });

  // Update slide (admin)
  app.patch("/api/admin/slides/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const slide = await storage.updateSlide(id, req.body);
      if (!slide) {
        return res.status(404).json({ message: "Slide not found" });
      }
      res.json(slide);
    } catch (error: any) {
      console.error("Update slide error:", error);
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  // Delete slide (admin)
  app.delete("/api/admin/slides/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSlide(id);
      if (!success) {
        return res.status(404).json({ message: "Slide not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete slide error:", error);
      res.status(500).json({ message: "Failed to delete slide" });
    }
  });

  return httpServer;
}
