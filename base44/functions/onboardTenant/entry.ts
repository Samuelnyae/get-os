import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      org_name, industry, plan, business_email, contact_phone,
      country, city, address, timezone, currency, logo_url,
      branches, enabled_modules, ai_modules, team_invites
    } = body;

    if (!org_name || !branches || branches.length === 0 || !branches[0].name) {
      return Response.json({ error: 'Business name and at least one branch are required' }, { status: 400 });
    }

    if (user.data?.organization_id) {
      return Response.json({ error: 'You already belong to an organization' }, { status: 409 });
    }

    const slug = org_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create Organization with all onboarding data
    const org = await base44.asServiceRole.entities.Organization.create({
      name: org_name,
      slug: slug + '-' + Date.now().toString().slice(-4),
      industry: industry || 'restaurant',
      plan: plan || 'starter',
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      owner_email: user.email,
      owner_user_id: user.id,
      billing_email: business_email || user.email,
      contact_phone: contact_phone || '',
      address: address || '',
      city: city || '',
      country: country || 'Kenya',
      timezone: timezone || 'Africa/Nairobi',
      currency: currency || 'KES',
      logo_url: logo_url || '',
      enabled_modules: enabled_modules || [],
      ai_modules: ai_modules || [],
      is_active: true,
      onboarded_at: new Date().toISOString(),
      max_branches: plan === 'enterprise' ? 50 : plan === 'professional' ? 10 : 1
    });

    // Create branches (first is main, rest are regular branches)
    const createdBranches = [];
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      const hotel = await base44.asServiceRole.entities.Hotel.create({
        organization_id: org.id,
        organization_name: org.name,
        name: b.name,
        slug: slug + '-' + (i === 0 ? 'main' : 'branch-' + i) + '-' + Date.now().toString().slice(-4),
        branch_type: i === 0 ? 'main' : 'branch',
        location: b.city || b.address || '',
        address: b.address || '',
        phone: contact_phone || '',
        email: business_email || user.email,
        logo_url: logo_url || '',
        is_active: true
      });
      createdBranches.push(hotel);
    }

    // Assign user as owner of this org
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        role: 'owner',
        organization_id: org.id,
        branch_id: createdBranches[0].id,
        is_active: true
      });
      console.log(`User ${user.id} updated with organization_id=${org.id}, branch_id=${createdBranches[0].id}`);
    } catch (userUpdateErr) {
      console.error('Failed to update user with organization_id:', userUpdateErr);
    }

    // Invite team members (non-blocking — failures are logged but don't fail onboarding)
    const inviteResults = [];
    if (team_invites && team_invites.length > 0 && base44.asServiceRole.users?.inviteUser) {
      for (const invite of team_invites) {
        if (!invite.email) continue;
        try {
          await base44.asServiceRole.users.inviteUser(invite.email, invite.role || 'user');
          inviteResults.push({ email: invite.email, status: 'invited' });
        } catch (e) {
          console.error(`Failed to invite ${invite.email}:`, e.message);
          inviteResults.push({ email: invite.email, status: 'failed', error: e.message });
        }
      }
    }

    return Response.json({
      organization: org,
      branches: createdBranches,
      team_invites: inviteResults,
      success: true
    });
  } catch (error) {
    console.error('onboardTenant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});