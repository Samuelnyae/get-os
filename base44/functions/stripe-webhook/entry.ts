import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.3.1';

const PLAN_MAP = {
  'price_1ToPx8DljdveYLb0MyCAdX6r': { plan: 'starter', max_branches: 1 },
  'price_1ToPx8DljdveYLb0b4DoJKyJ': { plan: 'professional', max_branches: 10 },
  'price_1ToPxCDljdveYLb0sRyiGdjG': { plan: 'enterprise', max_branches: 50 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata?.organization_id || session.client_reference_id;
        const plan = session.metadata?.plan;

        if (orgId) {
          const updates = {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: 'active',
            is_active: true,
            suspended_at: null,
          };

          if (plan) {
            const planConfig = Object.values(PLAN_MAP).find((p) => p.plan === plan);
            if (planConfig) {
              updates.plan = plan;
              updates.max_branches = planConfig.max_branches;
            }
          }

          await base44.asServiceRole.entities.Organization.update(orgId, updates);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const planConfig = priceId ? PLAN_MAP[priceId] : null;

          const statusMap = {
            active: 'active',
            trialing: 'active',
            past_due: 'suspended',
            canceled: 'cancelled',
            unpaid: 'suspended',
          };

          const updates = {
            stripe_subscription_id: subscription.id,
            status: statusMap[subscription.status] || 'suspended',
            is_active: subscription.status === 'active' || subscription.status === 'trialing',
          };

          if (planConfig) {
            updates.plan = planConfig.plan;
            updates.max_branches = planConfig.max_branches;
          }

          await base44.asServiceRole.entities.Organization.update(orgId, updates);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          await base44.asServiceRole.entities.Organization.update(orgId, {
            status: 'cancelled',
            is_active: false,
            suspended_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const orgId = invoice.metadata?.organization_id || invoice.subscription_details?.metadata?.organization_id;

        if (orgId && invoice.amount_paid) {
          const mrr = Math.round(invoice.amount_paid / 100);
          await base44.asServiceRole.entities.Organization.update(orgId, { mrr });
        }
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});