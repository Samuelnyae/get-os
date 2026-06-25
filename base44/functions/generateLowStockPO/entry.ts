import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Entity automation payload
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    if (!data) {
      return Response.json({ error: 'No product data in payload' }, { status: 400 });
    }

    // Only react to stock_available changes
    if (!changed_fields || !changed_fields.includes('stock_available')) {
      return Response.json({ skipped: true, reason: 'stock_available not changed' });
    }

    const stock = Number(data.stock_available) || 0;
    const threshold = Number(data.min_order_qty) || 0;
    const prevStock = old_data ? (Number(old_data.stock_available) || 0) : null;

    // Trigger only when stock crosses below the threshold (not on every edit while already low)
    if (stock >= threshold) {
      return Response.json({ skipped: true, reason: `stock ${stock} >= threshold ${threshold}` });
    }
    if (prevStock !== null && prevStock < threshold) {
      return Response.json({ skipped: true, reason: 'already below threshold before update' });
    }

    // Avoid duplicate draft POs for the same low-stock product
    const existing = await base44.asServiceRole.entities.PurchaseOrder.filter({
      supplier_id: data.supplier_id,
      status: 'draft',
    });

    const duplicate = existing.find(po =>
      (po.items || []).some(it => it.item_name === data.product_name)
    );
    if (duplicate) {
      return Response.json({ skipped: true, reason: 'draft PO already exists for this product' });
    }

    // Reorder quantity: 2x threshold (a sensible default restock multiple)
    const reorderQty = threshold * 2;
    const unitPrice = Number(data.unit_price) || 0;
    const lineTotal = reorderQty * unitPrice;

    const po = await base44.asServiceRole.entities.PurchaseOrder.create({
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
      status: 'draft',
      items: [{
        item_name: data.product_name,
        quantity: reorderQty,
        unit: data.unit || 'kg',
        unit_price: unitPrice,
        total: lineTotal,
      }],
      total_amount: lineTotal,
      notes: `Auto-generated draft PO — stock for "${data.product_name}" dropped to ${stock} ${data.unit || ''} (reorder threshold: ${threshold}).`,
      requested_by: 'system:low_stock_automation',
    });

    return Response.json({ created: true, po_id: po.id, po_number: po.po_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});