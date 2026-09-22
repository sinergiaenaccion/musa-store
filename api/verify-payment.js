const PRODUCTS = new Set(["MUSA-D01","MUSA-D02","MUSA-D03","MUSA-D04","MUSA-D05","MUSA-D06"]);

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
    if (!mp.ok) return json(res, 502, { error: "No se pudo verificar el pago." });

    const productId = payment.metadata?.product_id || "";
    const paidOrder = payment.external_reference || "";
    const approved = payment.status === "approved";
    const sameOrder = paidOrder === orderId;
    const validProduct = PRODUCTS.has(productId);

    if (!approved || !sameOrder || !validProduct) {
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
      product: productId,
      exp: Date.now() + 15 * 60 * 1000
    });
    const token = `${b64url(payload)}.${await sign(payload)}`;

    return json(res, 200, {
      approved: true,
      productId,
      downloadUrl: `/api/download?token=${encodeURIComponent(token)}`
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "No se pudo verificar el pago." });
  }
};
