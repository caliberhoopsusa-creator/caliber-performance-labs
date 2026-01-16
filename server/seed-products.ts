import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating Caliber products in Stripe...');

  // Check if products already exist
  const existingProducts = await stripe.products.search({ query: "name:'Caliber Pro'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    return;
  }

  // 1. Premium Monthly Subscription
  const proMonthly = await stripe.products.create({
    name: 'Caliber Pro',
    description: 'Unlock all premium features including AI video analysis, advanced reports, and unlimited players',
    metadata: {
      type: 'subscription',
      features: 'ai_video,advanced_reports,unlimited_players,priority_support'
    }
  });

  await stripe.prices.create({
    product: proMonthly.id,
    unit_amount: 999, // $9.99/month
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  await stripe.prices.create({
    product: proMonthly.id,
    unit_amount: 7999, // $79.99/year (save ~33%)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly' }
  });

  console.log('Created: Caliber Pro subscription with monthly and yearly prices');

  // 2. Coach Pro Subscription (for coaches with teams)
  const coachPro = await stripe.products.create({
    name: 'Coach Pro',
    description: 'Full access to all coach tools, team analytics, and scouting features',
    metadata: {
      type: 'subscription',
      features: 'all_coach_tools,team_dashboard,scouting,drill_recommendations,lineup_analysis'
    }
  });

  await stripe.prices.create({
    product: coachPro.id,
    unit_amount: 1999, // $19.99/month
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { billing: 'monthly' }
  });

  await stripe.prices.create({
    product: coachPro.id,
    unit_amount: 15999, // $159.99/year
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { billing: 'yearly' }
  });

  console.log('Created: Coach Pro subscription with monthly and yearly prices');

  // 3. One-time Video Analysis
  const videoAnalysis = await stripe.products.create({
    name: 'Video Analysis Credit',
    description: 'Single AI-powered video analysis to extract game statistics',
    metadata: {
      type: 'one_time',
      credits: '1'
    }
  });

  await stripe.prices.create({
    product: videoAnalysis.id,
    unit_amount: 299, // $2.99 per analysis
    currency: 'usd',
  });

  console.log('Created: Video Analysis Credit (one-time purchase)');

  // 4. Report Card Bundle
  const reportBundle = await stripe.products.create({
    name: 'Report Card Bundle',
    description: '5 premium player report cards with advanced analytics',
    metadata: {
      type: 'one_time',
      credits: '5'
    }
  });

  await stripe.prices.create({
    product: reportBundle.id,
    unit_amount: 499, // $4.99 for 5 reports
    currency: 'usd',
  });

  console.log('Created: Report Card Bundle (one-time purchase)');

  console.log('All products created successfully!');
}

createProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error creating products:', err);
    process.exit(1);
  });
