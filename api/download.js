const PRODUCT_ENV = {
  "MUSA-D01": "MUSA_PDF_URL_MUSA_D01",
  "MUSA-D02": "MUSA_PDF_URL_MUSA_D02",
  "MUSA-D03": "MUSA_PDF_URL_MUSA_D03",
  "MUSA-D04": "MUSA_PDF_URL_MUSA_D04",
  "MUSA-D05": "MUSA_PDF_URL_MUSA_D05",
  "MUSA-D06": "MUSA_PDF_URL_MUSA_D06",
  "MUSA-D07": "MUSA_PDF_URL_MUSA_D07",
  "MUSA-D08": "MUSA_PDF_URL_MUSA_D08"
};

const NAMES = {
  "MUSA-D01": "MUSA_Glow_Up.pdf",
  "MUSA-D02": "MUSA_Study_Girl.pdf",
  "MUSA-D03": "MUSA_Sunday_Reset.pdf",
  "MUSA-D04": "MUSA_Bestie.pdf",
  "MUSA-D05": "MUSA_Money_Girl.pdf",
  "MUSA-D06": "MUSA_My_Life_Planner.pdf",
  "MUSA-D07": "MUSA_Agradecimiento.pdf",
  "MUSA-D08": "MUSA_Relax.pdf"
};

async function verify(payload, signature) {
  const secret = process.env.MUSA_DOWNLOAD_SECRET;
  if (!secret) return false;
  const crypto = await import("node:crypto");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  try {
    const token = String(req.query.token || "");
    const requestedProduct = String(req.query.product || "");
    const dot = token.lastIndexOf(".");
    if (dot < 1 || !requestedProduct) return res.status(403).json({ error: "Descarga no autorizada." });

    const payloadB64 = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    if (!(await verify(payload, signature))) return res.status(403).json({ error: "Descarga no autorizada." });

    const data = JSON.parse(payload);
    if (!data.exp || Date.now() > data.exp) return res.status(410).json({ error: "Este enlace de descarga expiró." });
    if (!Array.isArray(data.products) || !data.products.includes(requestedProduct)) return res.status(403).json({ error: "Este producto no pertenece a la compra." });

    const envName = PRODUCT_ENV[requestedProduct];
    const sourceUrl = envName && process.env[envName];
    if (!sourceUrl) return res.status(503).json({ error: "El archivo digital todavía no está configurado." });

    const file = await fetch(sourceUrl);
    if (!file.ok) return res.status(502).json({ error: "No se pudo recuperar el archivo." });

    const bytes = Buffer.from(await file.arrayBuffer());
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${NAMES[requestedProduct] || "MUSA_Digital.pdf"}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(bytes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No se pudo preparar la descarga." });
  }
};