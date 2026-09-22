const PRODUCT_ENV = {
  "MUSA-D01": "MUSA_PDF_URL_MUSA_D01",
  "MUSA-D02": "MUSA_PDF_URL_MUSA_D02",
  "MUSA-D03": "MUSA_PDF_URL_MUSA_D03",
  "MUSA-D04": "MUSA_PDF_URL_MUSA_D04",
  "MUSA-D05": "MUSA_PDF_URL_MUSA_D05",
  "MUSA-D06": "MUSA_PDF_URL_MUSA_D06"
};

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function verify(payload, signature) {
  const secret = process.env.MUSA_DOWNLOAD_SECRET;
  if (!secret) return false;
  const crypto = await import("node:crypto");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return json(res, 405, { error: "Método no permitido" });

  try {
    const token = String(req.query.token || "");
    const dot = token.lastIndexOf(".");
    if (dot < 1) return json(res, 403, { error: "Descarga no autorizada." });

    const payloadB64 = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    if (!(await verify(payload, signature))) return json(res, 403, { error: "Descarga no autorizada." });

    const data = JSON.parse(payload);
    if (!data.exp || Date.now() > data.exp) return json(res, 410, { error: "Este enlace de descarga expiró." });

    const envName = PRODUCT_ENV[data.product];
    const sourceUrl = envName && process.env[envName];
    if (!sourceUrl) return json(res, 503, { error: "El archivo digital todavía no está configurado." });

    const file = await fetch(sourceUrl);
    if (!file.ok) return json(res, 502, { error: "No se pudo recuperar el archivo." });

    const bytes = Buffer.from(await file.arrayBuffer());
    const names = {
      "MUSA-D01": "MUSA_Glow_Up_Kit.pdf",
      "MUSA-D02": "MUSA_Study_Girl_Kit.pdf",
      "MUSA-D03": "MUSA_Sunday_Reset_Kit.pdf",
      "MUSA-D04": "MUSA_Bestie_Kit.pdf",
      "MUSA-D05": "MUSA_Money_Girl_Kit.pdf",
      "MUSA-D06": "MUSA_My_Life_Planner.pdf"
    };

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${names[data.product] || "MUSA_Digital.pdf"}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(bytes);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "No se pudo preparar la descarga." });
  }
};
