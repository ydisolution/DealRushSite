import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerRealEstateRoutes } from "./realEstateRoutes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { notificationService } from "./websocket";
import { dealClosureService } from "./dealClosureService";
import { whatsappService } from "./whatsappService";
import { initSentry, setupSentryErrorHandler } from "./monitoring";

const app = express();
const httpServer = createServer(app);

// Initialize Sentry before anything else
const sentryEnabled = initSentry(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  notificationService.initialize(httpServer);
  await registerRoutes(httpServer, app);
  registerRealEstateRoutes(app); // Register real estate routes

  // Sentry error handler (must be after routes, before other error handlers)
  if (sentryEnabled) {
    setupSentryErrorHandler(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error (Sentry already captured it)
    log(`Error ${status}: ${message}`, 'error');

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
    log(`WhatsApp service status: ${whatsappService.isEnabled() ? 'ENABLED ✅' : 'DISABLED ⚠️'}`);
    dealClosureService.start();
  });
})().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
