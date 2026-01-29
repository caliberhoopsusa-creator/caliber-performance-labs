import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { users, coinTransactions } from '../shared/schema';
import { eq, sql, and, like } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Let stripe-replit-sync process and verify the webhook
    // It handles signature verification internally with the managed webhook secret
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Parse the raw payload to get the event data
    // The signature was already verified by stripe-replit-sync above
    try {
      const rawBody = payload.toString('utf8');
      const event = JSON.parse(rawBody);
      
      // Handle coin purchase events
      await WebhookHandlers.handleCoinPurchase(event);
    } catch (err: any) {
      console.error('Error parsing webhook event for coin purchase:', err.message);
    }
  }

  static async handleCoinPurchase(event: any): Promise<void> {
    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = event.data.object;
    const metadata = session.metadata || {};

    // Only handle coin purchases
    if (metadata.type !== 'coin_purchase') {
      return;
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.log('Coin purchase session not paid:', session.id, session.payment_status);
      return;
    }

    const userId = metadata.userId;
    const coins = parseInt(metadata.coins, 10);
    const packageId = metadata.packageId;
    const sessionId = session.id;

    if (!userId || !coins || isNaN(coins) || !sessionId) {
      console.error('Invalid coin purchase metadata:', metadata);
      return;
    }

    // Idempotency check: verify this session hasn't already been processed
    const existingTransaction = await db.select()
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.type, 'purchased'),
          like(coinTransactions.description, `%session:${sessionId}%`)
        )
      )
      .limit(1);

    if (existingTransaction.length > 0) {
      console.log(`Coin purchase already processed for session ${sessionId}, skipping duplicate`);
      return;
    }

    console.log(`Processing coin purchase: ${coins} coins for user ${userId} (session: ${sessionId})`);

    try {
      // Credit the coins to the user
      await db.update(users)
        .set({ 
          coinBalance: sql`COALESCE(${users.coinBalance}, 0) + ${coins}` 
        })
        .where(eq(users.id, userId));

      // Record the transaction with session ID for idempotency
      await db.insert(coinTransactions).values({
        userId,
        amount: coins,
        type: 'purchased',
        description: `Purchased ${packageId} (${coins} coins) [session:${sessionId}]`,
      });

      console.log(`Successfully credited ${coins} coins to user ${userId}`);
    } catch (err) {
      console.error('Failed to credit coins:', err);
      throw err;
    }
  }
}
