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

const COUPONS = {
  MUSAWEEK: { discount: 0.20, start: "2026-10-03T00:00:00-03:00", end: "2026-10-12T00:00:00-03:00" },
  MAMA2026: { discount: 0.20, start: "2026-10-12T00:00:00-03:00", end: "2026-10-19T00:00:00-03:00" },
  BIENVENIDA10: { discount: 0.10, welcome: true }
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function getCoupon(code) {
  const coupon = COUPONS[String(code || "").trim().toUpperCase()];
  if (!coupon) return null;
  if (coupon.welcome) return coupon;
  const now = Date.now();
  if (now < Date.parse(coupon.start) || now >= Date.parse(coupon.end)) return null;
  return coupon;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function validateWelcomeCoupon(email) {
  if (!validEmail(email)) return { ok: false, error: "Ingresá el email con el que te sumaste a MUSA CLUB." };
  const apiKey = process.env.RESEND_CONTACTS_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "MUSA CLUB todavía no está conectado." };
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const contactResponse = await fetch("https://api.resend.com/contacts/" + encodeURIComponent(email), { headers });
  if (!contactResponse.ok) return { ok: false, error: "Ese email no figura en MUSA CLUB. Sumate primero. ♡" };
  const contact = await contactResponse.json();

  const segmentResponse = await fetch("https://api.resend.com/contacts/" + encodeURIComponent(email) + "/segments", { headers });
  if (!segmentResponse.ok) return { ok: false, error: "No pudimos verificar MUSA CLUB en este momento." };
  const segmentData = await segmentResponse.json();
  const segments = Array.isArray(segmentData?.data) ? segmentData.data : Array.isArray(segmentData) ? segmentData : [];
  const member = segments.some(segment => String(segment.id || "") === (process.env.MUSA_CLUB_SEGMENT_ID || "6f8be3ee-a58a-4b21-8d17-b891eacc3d88") || String(segment.name || "").toUpperCase() === "MUSA CLUB");
  if (!member) return { ok: false, error: "Ese email no figura en MUSA CLUB. Sumate primero. ♡" };

  const used = String(contact?.properties?.welcome_coupon_used || "no").toLowerCase();
  if (used === "yes") return { ok: false, error: "Este beneficio de bienvenida ya fue utilizado." };
  return { ok: true };
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

    const couponCode = String(req.body?.coupon || "").trim().toUpperCase();
    const buyerEmail = String(req.body?.buyerEmail || "").trim().toLowerCase();
    const coupon = couponCode ? getCoupon(couponCode) : null;
    if (couponCode && !coupon) return json(res, 400, { error: "El cupón no está disponible o ya venció." });
    if (coupon?.welcome) {
      const welcome = await validateWelcomeCoupon(buyerEmail);
      if (!welcome.ok) return json(res, 403, { error: welcome.error });
    }

    const subtotal = items.reduce((sum, item) => sum + PRODUCTS[item.productId].price * item.quantity, 0);
    const discount = coupon ? Math.round(subtotal * coupon.discount) : 0;
    const total = subtotal - discount;

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

    if (discount > 0) {
      mpItems.push({
        id: `DISCOUNT-${couponCode}`,
        title: `Descuento MUSA · ${couponCode}`,
        description: "Descuento promocional MUSA",
        quantity: 1,
        currency_id: "ARS",
        unit_price: -discount
      });
    }

    const siteUrl = (process.env.MUSA_SITE_URL || "https://musa-store-nine.vercel.app").replace(/\/$/, "");
    const orderId = `MUSA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const productIds = items.map(item => item.productId);

    const preference = {
      items: mpItems,
      external_reference: orderId,
      metadata: {
        product_ids: productIds.join(","),
        coupon: couponCode || "",
        discount_ars: String(discount),
        buyer_email: buyerEmail
      },
      back_urls: {
        success: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}`,
        pending: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=pending`,
        failure: `${siteUrl}/digital-success.html?order=${encodeURIComponent(orderId)}&state=failure`
      },
      auto_return: "approved",
      ...(validEmail(buyerEmail) ? { payer: { email: buyerEmail } } : {}),
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
      initPoint: data.init_point,
      subtotal,
      discount,
      total,
      coupon: couponCode || null
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Error interno al iniciar el pago." });
  }
};