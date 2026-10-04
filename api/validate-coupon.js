const COUPONS = {
  MUSAWEEK: { discount: 0.20, start: "2026-10-03T00:00:00-03:00", end: "2026-10-12T00:00:00-03:00" },
  MAMA2026: { discount: 0.20, start: "2026-10-12T00:00:00-03:00", end: "2026-10-19T00:00:00-03:00" },
  BIENVENIDA10: { discount: 0.10, welcome: true }
};

const CLUB_SEGMENT_ID = process.env.MUSA_CLUB_SEGMENT_ID || "6f8be3ee-a58a-4b21-8d17-b891eacc3d88";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getClubContact(email, headers) {
  const contactResponse = await fetch(
    "https://api.resend.com/contacts/" + encodeURIComponent(email),
    { headers }
  );
  if (!contactResponse.ok) return null;
  return contactResponse.json();
}

async function isClubMember(email, headers) {
  const response = await fetch(
    "https://api.resend.com/contacts/" + encodeURIComponent(email) + "/segments",
    { headers }
  );
  if (!response.ok) return false;
  const data = await response.json();
  const segments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return segments.some(segment => String(segment.id || "") === CLUB_SEGMENT_ID || String(segment.name || "").toUpperCase() === "MUSA CLUB");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido." });

  const code = String(req.body?.code || "").trim().toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!code) return json(res, 400, { valid: false, error: "Ingresá un código." });

  const coupon = COUPONS[code];
  if (!coupon) return json(res, 400, { valid: false, error: "Ese código no está disponible." });

  if (coupon.welcome) {
    if (!validEmail(email)) {
      return json(res, 400, { valid: false, error: "Ingresá el email con el que te sumaste a MUSA CLUB." });
    }

    const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY || process.env.RESEND_API_KEY;
    if (!contactsApiKey) return json(res, 503, { valid: false, error: "MUSA CLUB todavía no está conectado." });

    const headers = {
      Authorization: `Bearer ${contactsApiKey}`,
      "Content-Type": "application/json"
    };

    try {
      const contact = await getClubContact(email, headers);
      if (!contact) {
        return json(res, 403, { valid: false, error: "Ese email todavía no está registrado en MUSA CLUB. Sumate primero. ♡" });
      }

      const member = await isClubMember(email, headers);
      if (!member) {
        return json(res, 403, { valid: false, error: "Ese email todavía no figura en MUSA CLUB. Sumate primero. ♡" });
      }

      const used = String(contact?.properties?.welcome_coupon_used || "no").toLowerCase();
      if (used === "yes") {
        return json(res, 409, { valid: false, error: "Este beneficio de bienvenida ya fue utilizado." });
      }

      return json(res, 200, { valid: true, discount: coupon.discount });
    } catch (error) {
      console.error("Welcome coupon validation error", error);
      return json(res, 500, { valid: false, error: "No pudimos verificar MUSA CLUB en este momento." });
    }
  }

  const now = Date.now();
  if (now < new Date(coupon.start).getTime() || now >= new Date(coupon.end).getTime()) {
    return json(res, 400, { valid: false, error: "Ese código no está disponible." });
  }

  return json(res, 200, { valid: true, discount: coupon.discount });
};