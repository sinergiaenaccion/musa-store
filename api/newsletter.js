const crypto = require("node:crypto");

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido." });

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!validEmail(email)) return json(res, 400, { error: "Ingresá un email válido." });

  const sendingApiKey = process.env.RESEND_API_KEY;
  const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY || sendingApiKey;

  if (!sendingApiKey) {
    return json(res, 503, { error: "El servicio de email todavía no está configurado." });
  }

  try {
    const sendingHeaders = {
      Authorization: `Bearer ${sendingApiKey}`,
      "Content-Type": "application/json"
    };

    const contactsHeaders = {
      Authorization: `Bearer ${contactsApiKey}`,
      "Content-Type": "application/json"
    };

    let contactSaved = false;
    const contactResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: contactsHeaders,
      body: JSON.stringify({
        email,
        unsubscribed: false
      })
    });

    if (contactResponse.ok || contactResponse.status === 409) {
      contactSaved = true;
      const contact = contactResponse.ok ? await contactResponse.json() : null;
      const contactId = contact?.id || email;
      const segmentId = process.env.MUSA_CLUB_SEGMENT_ID;

      if (segmentId) {
        const segmentResponse = await fetch(
          `https://api.resend.com/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segmentId)}`,
          { method: "POST", headers: contactsHeaders }
        );

        if (!segmentResponse.ok && segmentResponse.status !== 409) {
          console.warn("No se pudo agregar el contacto a MUSA CLUB.", segmentResponse.status);
        }
      }
    } else {
      console.warn("No se pudo guardar el contacto en Resend.", contactResponse.status);
    }

    const hash = crypto.createHash("sha256").update(email).digest("hex").slice(0, 24);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: sendingHeaders,
      body: JSON.stringify({
        from: process.env.MUSA_FROM_EMAIL || "MUSA <hola@hellomusa.store>",
        to: [email],
        template: {
          id: "7e71bd3b-7ccb-46a2-b8b1-3548e9f07d1d"
        },
        idempotency_key: `musa-club-welcome-${hash}`
      })
    });

    if (!emailResponse.ok) {
      console.error("Resend no pudo enviar la bienvenida.", emailResponse.status, await emailResponse.text());
      return json(res, 502, { error: "No pudimos enviar el email de bienvenida." });
    }

    return json(res, 200, { ok: true, contactSaved });
  } catch (error) {
    console.error("Newsletter error", error);
    return json(res, 500, { error: "No pudimos completar la suscripción." });
  }
};