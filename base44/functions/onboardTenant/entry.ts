import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { org_name, industry, plan, hotel_name, hotel_location, hotel_phone, hotel_email } = body;

    if (!org_name || !hotel_name || !hotel_location) {
      return Response.json({ error: 'Organization name, hotel name, and location are required' }, { status: 400 });
    }

    // Prevent re-onboarding
    if (user.data?.organization_id) {
      return Response.json({ error: 'You already belong to an organization' }, { status: 409 });
    }

    const slug = org_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create Organization (service role — RLS restricts create to platform_admin)
    const org = await base44.asServiceRole.entities.Organization.create({
      name: org_name,
      slug: slug + '-' + Date.now().toString().slice(-4),
      industry: industry || 'restaurant',
      plan: plan || 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      owner_email: user.email,
      owner_user_id: user.id,
      billing_email: user.email,
      is_active: true,
      onboarded_at: new Date().toISOString(),
      max_branches: plan === 'enterprise' ? 50 : plan === 'professional' ? 10 : 1
    });

    // Create first Hotel/branch
    const hotel = await base44.asServiceRole.entities.Hotel.create({
      organization_id: org.id,
      organization_name: org.name,
      name: hotel_name,
      slug: slug + '-main-' + Date.now().toString().slice(-4),
      branch_type: 'main',
      location: hotel_location,
      phone: hotel_phone || '',
      email: hotel_email || user.email,
      is_active: true
    });

    // Assign user as owner of this org
    await base44.asServiceRole.entities.User.update(user.id, {
      role: 'owner',
      organization_id: org.id,
      branch_id: hotel.id,
      is_active: true
    });

    return Response.json({ organization: org, hotel, success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});