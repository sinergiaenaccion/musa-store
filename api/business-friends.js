function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function clean(value, max = 200) {
  return String(value || "").trim().replace(/[<>]/g, "").slice(0, max);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido." });

  const body = req.body || {};
  if (clean(body.website, 80)) return json(res, 400, { error: "No pudimos procesar la solicitud." });

  const email = clean(body.email, 180).toLowerCase();
  const name = clean(body.name, 100);
  const surname = clean(body.surname, 100);
  const dni = clean(body.dni, 30);
  const company = clean(body.company, 160);
  const role = clean(body.role, 120);
  const area = clean(body.area, 120);

  if (!validEmail(email)) return json(res, 400, { error: "Ingresá un email válido." });
  if (!name || !surname || !dni || !company) {
    return json(res, 400, { error: "Completá todos los campos obligatorios." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(res, 503, { error: "El formulario todavía no está conectado." });

  const from = process.env.MUSA_FROM_EMAIL || "MUSA <hola@hellomusa.store>";
  const destination = process.env.MUSA_BUSINESS_EMAIL || "hola@hellomusa.store";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  const internalHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#252331">
      <h2 style="color:#b52b6d">Nueva solicitud · MUSA EMPRESA AMIGA ♡</h2>
      <p>Una persona solicitó activar el beneficio corporativo MUSA.</p>
      <hr>
      <p><strong>Nombre:</strong> ${escapeHtml(name)} ${escapeHtml(surname)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>DNI:</strong> ${escapeHtml(dni)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(company)}</p>
      <p><strong>Área:</strong> ${escapeHtml(area) || "No informado"}</p>
      <p><strong>Cargo:</strong> ${escapeHtml(role) || "No informado"}</p>
      <hr>
      <p style="color:#766b74;font-size:12px">Solicitud enviada desde hellomusa.store · MUSA Empresa Amiga.</p>
    </div>
  `;

  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.65;color:#252331">
      <p style="font-size:18px;font-weight:700">MUSA ♡</p>
      <h2 style="font-size:30px;line-height:1.05">Recibimos tu solicitud.</h2>
      <p>Hola ${escapeHtml(name)}, gracias por solicitar la activación de tu beneficio <strong>Empresa Amiga MUSA</strong>.</p>
      <p>Vamos a verificar tus datos y la vinculación con <strong>${escapeHtml(company)}</strong>. El proceso puede demorar hasta 5 días hábiles.</p>
      <p>Cuando el beneficio esté activo, te indicaremos cómo utilizarlo en MUSA.</p>
      <p style="margin-top:28px;font-weight:700">SHINE YOUR WAY. ♡</p>
      <p style="font-size:12px;color:#766b74">Si necesitás ayuda, escribinos a hola@hellomusa.store.</p>
    </div>
  `;

  try {
    const internal = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: [destination],
        reply_to: email,
        subject: `MUSA Empresa Amiga · ${company} · ${name} ${surname}`,
        html: internalHtml
      })
    });

    if (!internal.ok) {
      const detail = (await internal.text()).slice(0, 300);
      console.error("MUSA Empresa Amiga internal email error", internal.status, detail);
      return json(res, 502, { error: "No pudimos enviar tu solicitud. Probá nuevamente en unos segundos." });
    }

    const confirmation = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Recibimos tu solicitud · MUSA Empresa Amiga ♡",
        html: confirmationHtml
      })
    });

    if (!confirmation.ok) {
      console.warn("MUSA Empresa Amiga confirmation email error", confirmation.status);
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("MUSA Empresa Amiga error", error);
    return json(res, 500, { error: "No pudimos completar la solicitud. Probá nuevamente en unos segundos." });
  }
};