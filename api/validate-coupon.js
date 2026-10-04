const COUPONS = {
  MUSAWEEK: { discount: 0.20, start: "2026-10-03T00:00:00-03:00", end: "2026-10-12T00:00:00-03:00" },
  MAMA2026: { discount: 0.20, start: "2026-10-12T00:00:00-03:00", end: "2026-10-19T00:00:00-03:00" }
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido." });
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!code) return json(res, 400, { valid: false, error: "Ingresá un código." });

  const coupon = COUPONS[code];
  const now = Date.now();
  if (!coupon || now < new Date(coupon.start).getTime() || now >= new Date(coupon.end).getTime()) {
    return json(res, 400, { valid: false, error: "Ese código no está disponible." });
  }

  return json(res, 200, { valid: true, discount: coupon.discount });
};
