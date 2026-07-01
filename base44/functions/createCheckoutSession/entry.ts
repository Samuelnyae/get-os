import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.3.1';

const PLAN_PRICES = {
  starter: 'price_1ToPx8DljdveYLb0MyCAdX6r',
  professional: 'price_1ToPx8DljdveYLb0b4DoJKyJ',
  enterprise: 'price_1ToPxCDljdveYLb0sRyiGdjG',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return Response.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const orgId = user.data?.organization_id;
    if (!orgId) {
      return Response.json({ error: 'No organization found. Please complete onboarding first.' }, { status: 400 });
    }

    const org = await base44.asServiceRole.entities.Organization.get(orgId);
    if (!org) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
      success_url: `${origin}/Billing?status=success&plan=${plan}`,
      cancel_url: `${origin}/Billing?status=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        organization_id: orgId,
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          organization_id: orgId,
          plan,
        },
      },
      client_reference_id: orgId,
    };

    if (org.stripe_customer_id) {
      sessionParams.customer = org.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});