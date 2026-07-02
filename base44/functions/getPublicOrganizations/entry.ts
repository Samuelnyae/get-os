import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const orgs = await base44.asServiceRole.entities.Organization.filter(
      { is_active: true, onboarded_at: { $exists: true } },
      '-onboarded_at',
      30
    );
    const publicOrgs = orgs.map(o => ({
      name: o.name,
      logo_url: o.logo_url,
      industry: o.industry
    }));
    return Response.json({ organizations: publicOrgs });
  } catch (error) {
    console.error('getPublicOrganizations error:', error);
    return Response.json({ organizations: [] });
  }
});