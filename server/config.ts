const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },
  session: {
    secret: process.env.SESSION_SECRET || "grow4bot-secret-key-dev",
  },
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
    isProduction: process.env.NODE_ENV === "production",
    isVercel: !!process.env.VERCEL,
  },
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    get secure() {
      return config.server.isProduction || config.server.isVercel;
    },
    get sameSite(): "none" | "lax" {
      return (config.server.isProduction || config.server.isVercel) ? "none" : "lax";
    },
  },
};

export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.mongodb.uri) {
    errors.push("MONGODB_URI environment variable is required");
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join("\n")}`);
  }
}

export default config;
