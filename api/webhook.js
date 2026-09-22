function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });

  // Mercado Pago can send payment notifications here.
  // The definitive payment verification is always performed against
  // GET /v1/payments/{id} before a download token is issued.
  try {
    const body = req.body || {};
    console.log("MUSA Mercado Pago webhook", JSON.stringify({
      type: body.type,
      action: body.action,
      data: body.data
    }));
    return json(res, 200, { received: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { received: false });
  }
};
