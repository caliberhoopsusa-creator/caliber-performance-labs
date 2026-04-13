import * as Sentry from "@sentry/node";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, type Server } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { seedColleges } from './seeds/colleges';
import { updateCollegeStats } from './seeds/updateCollegeStats';
import { seedRecruitingContacts, seedAdditionalLowerDivisionColleges } from './seeds/recruitingContacts';
import type Stripe from 'stripe';

// Initialize Sentry before anything else (only when DSN is configured)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Store webhook secret globally for verification
let webhookEndpointSecret: string | null = null;

export function getWebhookSecret(): string | null {
  return webhookEndpointSecret;
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();

    console.log('Setting up webhook...');
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
    const devDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
    const knownProdDomain = 'hoops-analyst--moppenheim25.replit.app';

    // Determine the webhook URL for THIS environment
    const currentWebhookUrl = isProduction
      ? `https://${knownProdDomain}/api/stripe/webhook`
      : devDomain ? `https://${devDomain}/api/stripe/webhook` : null;

    console.log(`Webhook URL: ${currentWebhookUrl || 'none'} (production: ${isProduction})`);

    const webhookEvents: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
    ];

    // Use stored secret from env if available (avoids recreating the endpoint on every restart)
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      webhookEndpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      console.log('Using STRIPE_WEBHOOK_SECRET from environment');
    } else if (currentWebhookUrl) {
      try {
        const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
        const existing = existingWebhooks.data.find(w => w.url === currentWebhookUrl);

        if (existing) {
          // Can't retrieve secret from existing endpoint — set STRIPE_WEBHOOK_SECRET env var
          console.log(`Webhook already registered (${existing.id}). Set STRIPE_WEBHOOK_SECRET in env to enable signature verification.`);
        } else {
          const webhook = await stripe.webhookEndpoints.create({
            url: currentWebhookUrl,
            enabled_events: webhookEvents,
          });
          webhookEndpointSecret = webhook.secret || null;
          console.log(`Webhook created: ${webhook.url}`);
          if (webhookEndpointSecret) {
            console.log(`Webhook secret captured. Add STRIPE_WEBHOOK_SECRET=${webhookEndpointSecret} to your env to avoid recreating on restart.`);
          }
        }
      } catch (webhookErr: any) {
        console.log('Webhook setup error:', webhookErr.message);
      }
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

initStripe();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // managed separately to avoid breaking Vite/WS in dev
}));

// Block admin API on the main public port — only reachable via the admin port
app.use('/api/admin', (req, res, next) => {
  const adminPort = parseInt(process.env.ADMIN_PORT || '3099', 10);
  const localPort = (req.socket as any)?.localPort;
  if (localPort !== adminPort) {
    return res.status(403).json({ error: 'Admin API is not accessible on this port.' });
  }
  next();
});

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/admin/login", authLimiter);

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/stripe/'),
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Stripe webhook: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

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
        const body = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${body.length > 200 ? body.slice(0, 200) + "…" : body}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  try {
    await seedColleges();
    await updateCollegeStats();
    await seedAdditionalLowerDivisionColleges();
    await seedRecruitingContacts();
  } catch (error) {
    console.error('Failed to seed colleges:', error);
  }

  // Sentry error handler must be before any other error handler
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
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
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Admin server — binds to 127.0.0.1 only (never publicly reachable).
  // Access via: http://localhost:ADMIN_PORT  or SSH tunnel from a remote machine.
  const adminPort = parseInt(process.env.ADMIN_PORT || "3099", 10);
  const adminHttpServer: Server = createServer(app);
  adminHttpServer.listen(adminPort, "127.0.0.1", () => {
    log(`admin serving on port ${adminPort} (localhost only)`);
  });
})();
