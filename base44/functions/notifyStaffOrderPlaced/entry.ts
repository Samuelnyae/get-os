import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event, data: order, entity_id } = body;

    // Support both automation-triggered calls (with event/data) and direct calls (with order in body)
    const orderData = order || body.order;
    if (!orderData) {
      return Response.json({ error: 'No order data provided' }, { status: 400 });
    }

    console.log(`[notifyStaffOrderPlaced] Processing order ${orderData.order_reference || entity_id}`);

    // Fetch staff for this organization — notify waiters, managers, and chefs
    const orgId = orderData.organization_id;
    if (!orgId) {
      console.log('[notifyStaffOrderPlaced] No organization_id on order, skipping');
      return Response.json({ success: false, message: 'No organization_id on order' });
    }

    // Get all staff for the org that have phone numbers and are not offline
    const allStaff = await base44.asServiceRole.entities.Staff.filter({
      organization_id: orgId
    });

    // Prioritize waiters and managers, but include chefs too
    const notifiableRoles = ['waiter', 'manager', 'chef', 'kitchen_assistant', 'host', 'bartender'];
    const staffToNotify = allStaff.filter(s =>
      s.phone &&
      s.status !== 'offline' &&
      notifiableRoles.includes(s.role)
    );

    if (staffToNotify.length === 0) {
      console.log(`[notifyStaffOrderPlaced] No staff with phone numbers found for org ${orgId}`);
      return Response.json({ success: false, message: 'No staff with phone numbers to notify' });
    }

    // Build the notification message
    const typeLabel = orderData.order_type === 'takeaway' ? 'Takeaway'
      : orderData.order_type === 'delivery' ? 'Delivery'
      : 'Dine-in';

    const itemsList = (orderData.items || [])
      .map(i => `  • ${i.name} x${i.quantity}`)
      .join('\n');

    const messageText = `🔔 *NEW ORDER ALERT*\n\n` +
      `Order Ref: *${orderData.order_reference || 'N/A'}*\n` +
      `Type: ${typeLabel}\n` +
      (orderData.table_room_number ? `Table: ${orderData.table_room_number}\n` : '') +
      `Customer: ${orderData.customer_name || 'N/A'}\n` +
      (orderData.customer_phone ? `Phone: ${orderData.customer_phone}\n` : '') +
      (orderData.pickup_time ? `Pickup/Delivery: ${orderData.pickup_time}\n` : '') +
      (orderData.special_instructions ? `Notes: ${orderData.special_instructions}\n` : '') +
      `\n🍽️ *Items:*\n${itemsList}\n\n` +
      `💰 *Total: KES ${orderData.total_amount?.toLocaleString() || 0}*\n\n` +
      `Please process this order promptly.`;

    // Check if WhatsApp Business API is configured
    const waIntegrations = await base44.asServiceRole.entities.Integration.filter({
      organization_id: orgId,
      provider: 'whatsapp',
      status: 'active'
    });

    const waConfig = waIntegrations[0];
    const hasWhatsAppAPI = waConfig?.api_key && waConfig?.api_secret;

    const results = [];

    // Send via WhatsApp Business API if configured
    if (hasWhatsAppAPI) {
      console.log('[notifyStaffOrderPlaced] WhatsApp Business API configured, sending messages...');
      for (const staff of staffToNotify) {
        try {
          const phoneNumber = formatPhoneNumber(staff.phone);
          const waRes = await fetch(
            `https://graph.facebook.com/v18.0/${waConfig.api_secret}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${waConfig.api_key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: messageText },
              }),
            }
          );

          const waData = await waRes.json();
          const success = waRes.ok;

          // Log to WhatsAppMessage entity
          await base44.asServiceRole.entities.WhatsAppMessage.create({
            organization_id: orgId,
            hotel_id: orderData.hotel_id,
            customer_name: staff.name,
            customer_phone: staff.phone,
            message_type: 'order_confirm',
            direction: 'outbound',
            message_body: messageText,
            status: success ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
            reference_id: orderData.order_reference || entity_id,
            reference_type: 'order',
          });

          results.push({ staff: staff.name, phone: staff.phone, channel: 'whatsapp_api', success, messageId: waData?.messages?.[0]?.id, error: !success ? JSON.stringify(waData?.error) : null });
        } catch (e) {
          console.error(`[notifyStaffOrderPlaced] WhatsApp API send failed for ${staff.name}:`, e.message);
          results.push({ staff: staff.name, phone: staff.phone, channel: 'whatsapp_api', success: false, error: e.message });
        }
      }
    } else {
      // Fallback: Send email notifications to staff + log WhatsApp messages as pending
      console.log('[notifyStaffOrderPlaced] No WhatsApp API configured, using email fallback + logging');

      for (const staff of staffToNotify) {
        // Log a pending WhatsApp message (for the audit trail / manual send later)
        try {
          await base44.asServiceRole.entities.WhatsAppMessage.create({
            organization_id: orgId,
            hotel_id: orderData.hotel_id,
            customer_name: staff.name,
            customer_phone: staff.phone,
            message_type: 'order_confirm',
            direction: 'outbound',
            message_body: messageText,
            status: 'pending',
            reference_id: orderData.order_reference || entity_id,
            reference_type: 'order',
          });
        } catch (e) {
          console.error(`[notifyStaffOrderPlaced] Failed to log WhatsAppMessage for ${staff.name}:`, e.message);
        }

        // Send email if staff has an email
        if (staff.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: staff.email,
              subject: `🔔 New Order ${orderData.order_reference || ''} - ${typeLabel} - Table ${orderData.table_room_number || 'N/A'}`,
              body: messageText,
            });
            results.push({ staff: staff.name, channel: 'email', success: true });
          } catch (e) {
            console.error(`[notifyStaffOrderPlaced] Email failed for ${staff.name}:`, e.message);
            results.push({ staff: staff.name, channel: 'email', success: false, error: e.message });
          }
        } else {
          results.push({ staff: staff.name, channel: 'whatsapp_pending', success: true, note: 'Logged as pending - no WhatsApp API or email configured' });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[notifyStaffOrderPlaced] Notified ${successCount}/${staffToNotify.length} staff for order ${orderData.order_reference || entity_id}`);

    return Response.json({
      success: true,
      order_reference: orderData.order_reference,
      staff_notified: successCount,
      total_staff: staffToNotify.length,
      channel: hasWhatsAppAPI ? 'whatsapp_api' : 'email_fallback',
      results,
    });
  } catch (error) {
    console.error('[notifyStaffOrderPlaced] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Format Kenyan phone numbers to international format for WhatsApp
function formatPhoneNumber(phone = '') {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    cleaned = '254' + cleaned.slice(1);
  }
  return cleaned;
}