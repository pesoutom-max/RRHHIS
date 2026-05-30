const SUPABASE_URL = "https://psdtmyoouqsldxskncth.supabase.co";
const ADMIN_EMAIL = "pesoutom@gmail.com";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function supabaseFetch(path, options = {}) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.msg || payload?.message || payload?.error || "Supabase request failed");
  return payload;
}

async function currentUser(token) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY || "sb_publishable_tjTcbQ6_4Sc2xmOPH9eSbA_cQd4jLZf",
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.msg || payload?.message || "No autorizado");
  return payload;
}

async function isAdmin(user) {
  if (user.email === ADMIN_EMAIL) return true;
  const rows = await supabaseFetch(`/rest/v1/user_profiles?user_id=eq.${user.id}&role=eq.admin&select=user_id`);
  return rows.length > 0;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 500, { error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel." });

  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return json(res, 401, { error: "No autorizado" });

    const requester = await currentUser(token);
    if (!(await isAdmin(requester))) return json(res, 403, { error: "Solo el administrador puede crear accesos." });

    const { email, password, employeeId } = req.body || {};
    if (!email || !password || !employeeId) return json(res, 400, { error: "Email, clave y empleado son obligatorios." });

    const createdUser = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { employee_id: employeeId },
      }),
    });

    await supabaseFetch("/rest/v1/user_profiles?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: createdUser.id,
        email,
        role: "employee",
        employee_id: employeeId,
      }),
    });

    return json(res, 200, { userId: createdUser.id });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
