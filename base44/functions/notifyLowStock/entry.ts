import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Entity automation payload
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (!data) {
      return Response.json({ error: 'No inventory data in payload' }, { status: 400 });
    }

    const stock = Number(data.current_stock) || 0;
    const threshold = Number(data.low_stock_threshold) || 0;

    // Only proceed if stock is at or below threshold
    if (stock > threshold) {
      return Response.json({ skipped: true, reason: `stock ${stock} > threshold ${threshold}` });
    }

    // For updates: only notify when stock just crossed below threshold (was above before)
    if (event?.type === 'update' && old_data) {
      const prevStock = Number(old_data.current_stock) || 0;
      if (prevStock <= threshold) {
        return Response.json({ skipped: true, reason: 'already at/below threshold before update' });
      }
    }

    // Look up the organization to get the manager/kitchen email
    let managerEmail = null;
    let orgName = 'Your Restaurant';
    if (data.organization_id) {
      try {
        const org = await base44.asServiceRole.entities.Organization.get(data.organization_id);
        if (org) {
          orgName = org.name || orgName;
          managerEmail = org.owner_email || org.billing_email || null;
        }
      } catch (e) {
        console.error('Failed to fetch organization:', e.message);
      }
    }

    if (!managerEmail) {
      return Response.json({ skipped: true, reason: 'No manager email found for organization' });
    }

    const isOutOfStock = stock === 0;
    const statusLabel = isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK';
    const urgencyColor = isOutOfStock ? '🔴' : '🟡';

    const subject = `${urgencyColor} ${statusLabel} Alert: ${data.name}`;

    const bodyText = [
      `Hello,`,
      ``,
      `This is an automated inventory alert from ${orgName}.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  ${statusLabel}: ${data.name}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `  Current Stock:  ${stock} ${data.unit}`,
      `  Minimum Threshold: ${threshold} ${data.unit}`,
      `  Category: ${data.category || 'N/A'}`,
      `  Supplier: ${data.supplier || 'N/A'}`,
      `${data.notes ? `  Notes: ${data.notes}` : ''}`,
      ``,
      `${isOutOfStock
        ? 'This item is completely out of stock. Please restock immediately to avoid service disruptions.'
        : 'This item has fallen below the minimum threshold. Please arrange restocking soon.'}`,
      ``,
      `Manage inventory: ${req.headers.get('origin') || ''}/Inventory`,
      ``,
      `— ${orgName} Inventory System`,
    ].filter(Boolean).join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: managerEmail,
      subject,
      body: bodyText,
    });

    return Response.json({
      notified: true,
      email: managerEmail,
      item: data.name,
      stock,
      threshold,
    });
  } catch (error) {
    console.error('notifyLowStock error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});