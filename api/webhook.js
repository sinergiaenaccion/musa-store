function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function validSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"] || "";
  const dataId = String(req.query["data.id"] || "").toLowerCase();
  if (!signature || !dataId) return false;

  let ts = "";
  let v1 = "";
  for (const part of String(signature).split(",")) {
    const [key, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const crypto = await import("node:crypto");
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}


async function markWelcomeCouponUsed(email, payment) {
  if (!email) return;
  const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY || process.env.RESEND_API_KEY;
  if (!contactsApiKey) return;

  let coupon = String(payment.metadata?.coupon || "").trim().toUpperCase();

  if (!coupon && payment.preference_id) {
    try {
      const preferenceResponse = await fetch(
        `https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(payment.preference_id)}`,
        { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
      );
      if (preferenceResponse.ok) {
        const preference = await preferenceResponse.json();
        coupon = String(preference.metadata?.coupon || "").trim().toUpperCase();
      }
    } catch (error) {
      console.warn("No se pudo leer el cupón desde la preferencia.", error?.message || error);
    }
  }

  if (coupon !== "BIENVENIDA10") return;

  try {
    const response = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${contactsApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: { welcome_coupon_used: "yes" }
        })
      }
    );

    if (!response.ok) {
      console.warn("No se pudo marcar BIENVENIDA10 como usado.", response.status);
    }
  } catch (error) {
    console.warn("Welcome coupon mark error", error?.message || error);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });

  try {
    if (!(await validSignature(req))) {
      return json(res, 401, { received: false, error: "Firma inválida." });
    }

    const type = String(req.body?.type || "");
    const paymentId = String(req.body?.data?.id || "");

    console.log("MUSA Mercado Pago webhook", JSON.stringify({
      type,
      action: req.body?.action,
      data: req.body?.data
    }));

    if (type !== "payment" || !paymentId) {
      return json(res, 200, { received: true });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY no configurado; webhook recibido sin envío de email.");
      return json(res, 200, { received: true });
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    if (!paymentResponse.ok) {
      console.error("No se pudo consultar el pago para email.", paymentResponse.status);
      return json(res, 200, { received: true });
    }

    const payment = await paymentResponse.json();
    if (payment.status !== "approved") {
      return json(res, 200, { received: true });
    }


    const email = String(payment.payer?.email || "").trim();
    const orderId = String(
      payment.external_reference ||
      payment.order?.external_reference ||
      payment.order?.external_reference_id ||
      ""
    ).trim();

    if (!email || !orderId) {
      console.warn("Pago aprobado sin email u orden externa.");
      return json(res, 200, { received: true });
    }

    await markWelcomeCouponUsed(email, payment);

    const siteUrl = process.env.MUSA_SITE_URL || "https://www.hellomusa.store";
    const verifyUrl = `${siteUrl.replace(/\/$/, "")}/api/verify-payment?payment_id=${encodeURIComponent(paymentId)}&order=${encodeURIComponent(orderId)}`;
    const verifyResponse = await fetch(verifyUrl);
    if (!verifyResponse.ok) {
      console.error("No se pudo generar la descarga.", verifyResponse.status);
      return json(res, 200, { received: true });
    }

    const verified = await verifyResponse.json();
    if (!verified.approved || !Array.isArray(verified.downloads)) {
      console.warn("Pago aprobado sin descargas verificadas.");
      return json(res, 200, { received: true });
    }

    for (const download of verified.downloads) {
      const absoluteDownloadUrl = download.downloadUrl.startsWith("http")
        ? download.downloadUrl
        : `${siteUrl.replace(/\/$/, "")}${download.downloadUrl}`;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.MUSA_FROM_EMAIL || "MUSA <hola@hellomusa.store>",
          to: [email],
          template: {
            id: "ed431d94-3cb2-4740-b818-c6092bb24161",
            variables: {
              PRODUCT_NAME: download.name,
              DOWNLOAD_URL: absoluteDownloadUrl
            }
          },
          idempotency_key: `musa-purchase-${paymentId}-${download.productId}`
        })
      });

      if (!resendResponse.ok) {
        console.error("Resend no pudo enviar el email.", resendResponse.status, await resendResponse.text());
      }
    }

    return json(res, 200, { received: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { received: false });
  }
};
