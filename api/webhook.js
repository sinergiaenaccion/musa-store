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

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });

  try {
    if (!(await validSignature(req))) {
      return json(res, 401, { received: false, error: "Firma inválida." });
    }

    console.log("MUSA Mercado Pago webhook", JSON.stringify({
      type: req.body?.type,
      action: req.body?.action,
      data: req.body?.data
    }));

    return json(res, 200, { received: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { received: false });
  }
};
