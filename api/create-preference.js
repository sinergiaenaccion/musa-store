const PRODUCTS = {
  "MUSA-D01": { name: "Workbook Glow Up", price: 4990 },
  "MUSA-D02": { name: "Workbook Study Girl", price: 4990 },
  "MUSA-D03": { name: "Workbook Sunday Reset", price: 4990 },
  "MUSA-D04": { name: "Workbook Bestie", price: 4990 },
  "MUSA-D05": { name: "Workbook Money Girl", price: 4990 },
  "MUSA-D06": { name: "My Life Planner", price: 6990 },
  "MUSA-D07": { name: "Workbook Agradecimiento", price: 4990 },
  "MUSA-D08": { name: "Workbook Relax", price: 4990 }
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });
  if (!process.env.MP_ACCESS_TOKEN) return json(res, 503, { error: "Mercado Pago todavía no está configurado." });

  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const items = rawItems
      .map(item => ({ productId: String(item.id || ""), quantity: Math.max(1, Math.min(10, Number(item.qty) || 1)) }))
      .filter(item => PRODUCTS[item.productId]);

    if (!items.length) return json(res, 400, { error: "No hay productos digitales válidos." });

    const mpItems = items.map(item => {
      const product = PRODUCTS[item.productId];
      return {
        id: item.productId,
        title: product.name,
        description: `Producto digital MUSA · ${product.name}`,
        quantity: item.quantity,
        currency_id: "ARS",
        unit_price: product.price
      };
    });

    const siteUrl = (process.env.MUSA_SITE_URL || "https://musa-store-nine.vercel.app").replace(/\/$/, "");
    const orderId = `MUSA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const productIds = items.map(item => item.productId);

    const preference = {
      items: mpItems,
      external_reference: orderId,
      metadata: {
        product_ids: productIds.join(",")
      },
      back_urls: {
        success: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}`,
        pending: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=pending`,
        failure: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=failure`
      },
      auto_return: "approved",
      notification_url: `${(process.env.MUSA_API_BASE_URL || "https://musa-store-nine.vercel.app").replace(/\/$/, "")}/api/webhook`
    };

    const mp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await mp.json();
    if (!mp.ok) {
      console.error("Mercado Pago preference error", data);
      return json(res, 502, { error: "No se pudo crear el pago." });
    }

    return json(res, 200, {
      orderId,
      preferenceId: data.id,
      initPoint: data.init_point
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Error interno al iniciar el pago." });
  }
};