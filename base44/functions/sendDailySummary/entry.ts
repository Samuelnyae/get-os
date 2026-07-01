import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Build today's date range in UTC
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const dateStr = todayStart.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const startISO = todayStart.toISOString();
    const endISO = todayEnd.toISOString();

    // Get all active organizations
    const orgs = await base44.asServiceRole.entities.Organization.filter({ is_active: true });

    const results = [];

    for (const org of orgs) {
      try {
        const managerEmail = org.owner_email || org.billing_email;
        if (!managerEmail) {
          results.push({ org: org.name, skipped: 'no manager email' });
          continue;
        }

        // Fetch today's orders
        const orders = await base44.asServiceRole.entities.Order.filter({
          organization_id: org.id,
          created_date: { $gte: startISO, $lte: endISO },
        });

        // Fetch today's reservations
        const reservations = await base44.asServiceRole.entities.Reservation.filter({
          organization_id: org.id,
          created_date: { $gte: startISO, $lte: endISO },
        });

        // Fetch today's room bookings
        const roomBookings = await base44.asServiceRole.entities.RoomBooking.filter({
          organization_id: org.id,
          created_date: { $gte: startISO, $lte: endISO },
        });

        // Calculate revenue (exclude cancelled)
        const validOrders = orders.filter(o => o.status !== 'cancelled');
        const validRoomBookings = roomBookings.filter(r => r.status !== 'cancelled');
        const orderRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const roomRevenue = validRoomBookings.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
        const totalRevenue = orderRevenue + roomRevenue;

        // Order status breakdown
        const deliveredOrders = validOrders.filter(o => ['delivered', 'ready', 'out_for_delivery'].includes(o.status)).length;
        const pendingOrders = validOrders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;

        // Build new bookings list
        const newReservations = reservations.filter(r => r.status !== 'cancelled');
        const newRoomBookings = validRoomBookings;

        // Build email body
        let body = [
          `Hello,`,
          ``,
          `Here is your daily activity summary for ${org.name}.`,
          ``,
          `📅 ${dateStr}`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          `💰 TOTAL DAILY REVENUE`,
          `   KES ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `   • Food & Beverage: KES ${orderRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `   • Room Bookings: KES ${roomRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ``,
          `🍽️  ORDERS TODAY: ${validOrders.length}`,
          `   • Completed/Active: ${deliveredOrders}`,
          `   • Pending/In Progress: ${pendingOrders}`,
          ``,
        ];

        // New reservations section
        if (newReservations.length > 0) {
          body.push(`📋 NEW RESERVATIONS: ${newReservations.length}`);
          newReservations.slice(0, 15).forEach((r, i) => {
            body.push(`   ${i + 1}. ${r.customer_name} — ${r.party_size} guests — ${r.reservation_date} at ${r.reservation_time}${r.status === 'confirmed' ? ' ✓' : ` (${r.status})`}`);
          });
          if (newReservations.length > 15) {
            body.push(`   ... and ${newReservations.length - 15} more`);
          }
          body.push('');
        }

        // New room bookings section
        if (newRoomBookings.length > 0) {
          body.push(`🏨 NEW ROOM BOOKINGS: ${newRoomBookings.length}`);
          newRoomBookings.slice(0, 15).forEach((r, i) => {
            body.push(`   ${i + 1}. ${r.guest_name} — Room ${r.room_number || 'TBD'} — Check-in: ${r.check_in_date} to ${r.check_out_date} — KES ${(Number(r.total_amount) || 0).toLocaleString('en-US')}`);
          });
          if (newRoomBookings.length > 15) {
            body.push(`   ... and ${newRoomBookings.length - 15} more`);
          }
          body.push('');
        }

        if (validOrders.length === 0 && newReservations.length === 0 && newRoomBookings.length === 0) {
          body.push('No activity recorded today.');
          body.push('');
        }

        body.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        body.push(`View full dashboard: ${req.headers.get('origin') || ''}/Admin`);
        body.push('');
        body.push(`— ${org.name} Management System`);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: managerEmail,
          subject: `📊 Daily Summary — ${org.name} — ${dateStr}`,
          body: body.join('\n'),
        });

        results.push({
          org: org.name,
          emailed: managerEmail,
          revenue: totalRevenue,
          orders: validOrders.length,
          reservations: newReservations.length,
          roomBookings: newRoomBookings.length,
        });
      } catch (orgError) {
        console.error(`Error processing org ${org.name}:`, orgError.message);
        results.push({ org: org.name, error: orgError.message });
      }
    }

    return Response.json({ date: dateStr, organizationsProcessed: results.length, results });
  } catch (error) {
    console.error('sendDailySummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});