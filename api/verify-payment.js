const PRODUCTS = {
  "MUSA-D01": "Workbook Glow Up",
  "MUSA-D02": "Workbook Study Girl",
  "MUSA-D03": "Workbook Sunday Reset",
  "MUSA-D04": "Workbook Bestie",
  "MUSA-D05": "Workbook Money Girl",
  "MUSA-D06": "My Life Planner",
  "MUSA-D07": "Workbook Agradecimiento",
  "MUSA-D08": "Workbook Relax"
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function sign(payload) {
  const secret = process.env.MUSA_DOWNLOAD_SECRET;
  if (!secret) throw new Error("MUSA_DOWNLOAD_SECRET no configurado");
  const crypto = await import("node:crypto");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

async function getPreference(payment, orderId) {
  const headers = {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
  };

  const preferenceId = String(payment.preference_id || "").trim();
  if (preferenceId) {
    const response = await fetch(
      `https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preferenceId)}`,
      { headers }
    );
    if (response.ok) {
      const preference = await response.json();
      if (String(preference.external_reference || "") === orderId) return preference;
    }
  }

  const response = await fetch(
    `https://api.mercadopago.com/checkout/preferences/search?external_reference=${encodeURIComponent(orderId)}&limit=10`,
    { headers }
  );
  if (!response.ok) return null;

  const data = await response.json();
  const elements = Array.isArray(data.elements) ? data.elements : [];
  return elements.find(item => String(item.external_reference || "") === orderId) || null;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return json(res, 405, { error: "Método no permitido" });
  if (!process.env.MP_ACCESS_TOKEN) return json(res, 503, { error: "Mercado Pago todavía no está configurado." });

  const paymentId = String(req.query.payment_id || "");
  const orderId = String(req.query.order || "");
  if (!paymentId || !orderId) return json(res, 400, { error: "Faltan datos de pago." });

  try {
    const mp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mp.json();
    if (!mp.ok) {
      const errorMessage = String(payment?.message || payment?.error || "").slice(0, 200);
      return json(res, 502, {
        error: "No se pudo verificar el pago.",
        diagnostic: {
          mercadoPagoHttpStatus: mp.status,
          mercadoPagoError: errorMessage || null
        }
      });
    }

    const paidOrderCandidates = [
      payment.external_reference,
      payment.order?.external_reference,
      payment.order?.external_reference_id
    ].filter(Boolean).map(String);

    const approved = payment.status === "approved";
    let sameOrder = paidOrderCandidates.includes(orderId);

    let productIds = String(payment.metadata?.product_ids || "")
      .split(",")
      .map(id => id.trim())
      .filter(id => PRODUCTS[id]);

    const additionalItems = Array.isArray(payment.additional_info?.items)
      ? payment.additional_info.items
      : [];

    if (!productIds.length && additionalItems.length) {
      productIds = additionalItems
        .flatMap(item => [
          String(item.id || ""),
          Object.entries(PRODUCTS).find(([, name]) => name === String(item.title || ""))?.[0] || ""
        ])
        .filter(id => PRODUCTS[id]);
    }

    if (!productIds.length) {
      const description = String(payment.description || "").trim();
      productIds = Object.entries(PRODUCTS)
        .filter(([, name]) => name === description)
        .map(([id]) => id);
    }

    const preference = await getPreference(payment, orderId);

    if (preference) {
      sameOrder = sameOrder || String(preference.external_reference || "") === orderId;

      if (!productIds.length && Array.isArray(preference.items)) {
        productIds = preference.items
          .flatMap(item => [
            String(item.id || ""),
            Object.entries(PRODUCTS).find(([, name]) => name === String(item.title || ""))?.[0] || ""
          ])
          .filter(id => PRODUCTS[id]);
      }
    }

    if (!approved || !sameOrder || !productIds.length) {
      return json(res, 200, {
        approved: false,
        status: payment.status || "unknown",
        message: payment.status === "pending"
          ? "El pago todavía está pendiente. La descarga se habilitará cuando Mercado Pago confirme la aprobación."
          : "El pago todavía no está aprobado."
      });
    }

    const payload = JSON.stringify({
      order: orderId,
      products: [...new Set(productIds)],
      exp: Date.now() + 15 * 60 * 1000
    });
    const token = `${b64url(payload)}.${await sign(payload)}`;

    return json(res, 200, {
      approved: true,
      downloads: [...new Set(productIds)].map(productId => ({
        productId,
        name: PRODUCTS[productId],
        downloadUrl: `/api/download?token=${encodeURIComponent(token)}&product=${encodeURIComponent(productId)}`
      }))
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "No se pudo verificar el pago." });
  }
};
