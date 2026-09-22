const PRODUCTS = {
  "MUSA-D01": { name: "Kit Glow Up", price: 4990 },
  "MUSA-D02": { name: "Study Girl Kit", price: 4990 },
  "MUSA-D03": { name: "Sunday Reset Kit", price: 4990 },
  "MUSA-D04": { name: "Bestie Kit", price: 4990 },
  "MUSA-D05": { name: "Money Girl Kit", price: 4990 },
  "MUSA-D06": { name: "My Life Planner", price: 6990 }
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });
  if (!process.env.MP_ACCESS_TOKEN) return json(res, 503, { error: "Mercado Pago todavía no está configurado." });

  try {
    const { productId } = req.body || {};
    const product = PRODUCTS[productId];
    if (!product) return json(res, 400, { error: "Producto digital inválido." });

    const siteUrl = (process.env.MUSA_SITE_URL || "https://sinergiaenaccion.github.io/musa-store").replace(/\/$/, "");
    const orderId = `MUSA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const preference = {
      items: [{
        id: productId,
        title: product.name,
        description: `Producto digital MUSA · ${product.name}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: product.price
      }],
      external_reference: orderId,
      metadata: { product_id: productId },
      back_urls: {
        success: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}`,
        pending: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=pending`,
        failure: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=failure`
      },
      auto_return: "approved",
      notification_url: `${siteUrl.replace("https://sinergiaenaccion.github.io/musa-store", process.env.MUSA_API_BASE_URL || "")}/api/webhook`
    };

    // notification_url must point to the serverless deployment, not GitHub Pages.
    preference.notification_url = `${(process.env.MUSA_API_BASE_URL || "").replace(/\/$/, "")}/api/webhook`;

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
