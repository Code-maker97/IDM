/**
 * Mock API — replaces real backend calls for local/offline demo.
 * All data is generated client-side; no server or database required.
 */

// ─── Storage key ──────────────────────────────────────────────────────────────
const TOKEN_KEY = "spath_session_token";
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { } };

// ─── In-memory stores (reset on page refresh — fine for a demo) ───────────────
const _store = {
  user: null,
  contacts: [
    { contact_id: "ct_demo01", user_id: "user_demo", name: "Priya Sharma", phone: "+919876543210", relation: "Sister", created_at: new Date().toISOString() },
    { contact_id: "ct_demo02", user_id: "user_demo", name: "Rahul Gupta", phone: "+919823456789", relation: "Brother", created_at: new Date().toISOString() },
  ],
  incidents: [],
  chatHistory: {},
  sosAlerts: [],
};

// ─── Seed incidents (Indore hotspots) ────────────────────────────────────────
const SEED = [
  ["theft", "Chain snatching near Rajwada Palace", 22.7169, 75.8548, 3],
  ["harassment", "Catcalling reported near Sarafa Bazaar", 22.7190, 75.8580, 2],
  ["poor_lighting", "Narrow lanes behind Rajwada poorly lit", 22.7157, 75.8561, 2],
  ["harassment", "Verbal harassment at MG Road bus stop", 22.7206, 75.8734, 2],
  ["stalking", "Auto-rickshaw driver following passenger", 22.7212, 75.8711, 3],
  ["poor_lighting", "Service road along AB Road broken lights", 22.7305, 75.8810, 2],
  ["isolated", "Empty stretch near Bombay Hospital after 10pm", 22.7452, 75.8935, 2],
  ["harassment", "Group of men loitering outside C21 Mall", 22.7536, 75.8929, 2],
  ["stalking", "Reports of stalkers near Vijay Nagar metro", 22.7510, 75.8957, 3],
  ["poor_lighting", "Inner lanes of Scheme 54 poorly lit", 22.7423, 75.8870, 2],
  ["theft", "Phone snatching near Bengali Square signal", 22.7410, 75.8935, 3],
  ["harassment", "Eve-teasing outside Palasia Square coaching", 22.7279, 75.8920, 2],
  ["isolated", "Park road near Palasia isolated after 9pm", 22.7285, 75.8893, 1],
  ["harassment", "Comments on college girls at Bhawarkuan", 22.6964, 75.8648, 2],
  ["stalking", "Bikers following students from Khandwa Road", 22.6880, 75.8660, 3],
  ["poor_lighting", "DAVV back gate road very dark", 22.6793, 75.8670, 2],
  ["theft", "Purse snatching near Chappan Dukan", 22.7080, 75.8729, 2],
  ["isolated", "Long unlit stretch on Rau-Pithampur road", 22.6541, 75.8186, 3],
  ["stalking", "Female passengers followed from Sarwate Bus", 22.7205, 75.8747, 3],
  ["harassment", "Touts and harassment at Indore Junction", 22.7186, 75.8750, 2],
  ["theft", "Chain snatching near Khajrana temple lane", 22.7286, 75.9100, 2],
  ["stalking", "Stalking case reported at LIG Square", 22.7420, 75.8819, 3],
  ["isolated", "Ring road stretch near Dewas Naka dangerous", 22.7598, 75.8870, 3],
  ["theft", "Chain snatching near Tukoganj main road", 22.7258, 75.8806, 2],
  ["stalking", "Tukoganj inner lanes stalking complaint", 22.7245, 75.8812, 2],
];
SEED.forEach(([category, description, lat, lng, severity], i) => {
  _store.incidents.push({
    incident_id: `inc_seed${String(i).padStart(3, "0")}`,
    user_id: null,
    source: "public_dataset:indore",
    category, description, lat, lng, severity,
    time_of_day: "night",
    reported_at: new Date(Date.now() - i * 3600000).toISOString(),
    status: "active",
  });
});

// ─── Routing via real OSRM public API ────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Call OSRM (free public walking API) with optional via-waypoint for route variation.
 * Returns [lng,lat] coordinate array of the actual road-following polyline.
 */
async function _osrmRoute(originLat, originLng, destLat, destLng, viaLat, viaLng) {
  let coords = viaLat != null
    ? `${originLng},${originLat};${viaLng},${viaLat};${destLng},${destLat}`
    : `${originLng},${originLat};${destLng},${destLat}`;
  const url = `https://router.project-osrm.org/route/v1/foot/${coords}?geometries=geojson&overview=full&steps=false`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("OSRM error");
  const data = await r.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route");
  const route = data.routes[0];
  return {
    geometry: route.geometry.coordinates,   // [[lng,lat], ...]
    distance_m: route.distance,
    duration_s: route.duration,
  };
}

/**
 * Pick a via-waypoint that steers clear of the worst incident clusters.
 * For the "safer" variant we move perpendicular to the direct line to avoid hotspots.
 * For the "longer detour" variant we swing wider.
 */
function _safeViaWaypoint(originLat, originLng, destLat, destLng, incidents, mode) {
  // Midpoint
  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  // Perpendicular direction (rotate direction vector 90°)
  const dLat = destLat - originLat;
  const dLng = destLng - originLng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  const perpLat = -dLng / len;
  const perpLng = dLat / len;

  // Large enough offsets to force OSRM onto genuinely different streets
  // "safer" = ~2km perpendicular, "detour" = ~4km perpendicular
  const magnitude = mode === "detour" ? 0.038 : 0.020;
  const offsets = [magnitude, -magnitude];

  let bestScore = Infinity, bestLat = midLat, bestLng = midLng;
  for (const off of offsets) {
    const vLat = midLat + perpLat * off;
    const vLng = midLng + perpLng * off;
    let score = 0;
    incidents.filter(i => i.status === "active").forEach(inc => {
      const d = haversineKm(inc.lat, inc.lng, vLat, vLng);
      if (d < 0.8) score += inc.severity * (1 - d / 0.8);
    });
    if (score < bestScore) { bestScore = score; bestLat = vLat; bestLng = vLng; }
  }
  return { vLat: bestLat, vLng: bestLng };
}

function _scoreRoute(coords, incidents, timeOfDay, routeIndex = 0) {
  let nearby = 0, sevSum = 0;
  const BUF = 0.25;
  incidents.filter(i => i.status === "active").forEach(inc => {
    let minD = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = haversineKm(inc.lat, inc.lng, coords[i][1], coords[i][0]);
      if (d < minD) minD = d;
    }
    if (minD < BUF) { nearby++; sevSum += inc.severity; }
  });

  // Lighting/crowd: use total path length variation so each route differs
  const totalLen = coords.reduce((s, c, i) => {
    if (i === 0) return s;
    return s + haversineKm(coords[i-1][1], coords[i-1][0], c[1], c[0]);
  }, 0);
  const seed = Math.round(totalLen * 137) % 100; // unique per route geometry
  let lighting = parseFloat((0.50 + (seed % 45) / 100).toFixed(2));
  let crowd    = parseFloat((0.38 + (seed % 50) / 100).toFixed(2));

  // Night penalty — large, visible drop (~20-25 pts)
  if (timeOfDay === "night") {
    lighting = Math.max(0.10, lighting - 0.38);
    crowd    = Math.max(0.10, crowd    - 0.32);
  }

  let base = 100
    - Math.min(50, sevSum * 7)           // up to -50 for incident severity
    - Math.round((1 - lighting) * 28)    // up to -28 for poor lighting
    - Math.round((1 - crowd)    * 14);   // up to -14 for low crowd
  if (timeOfDay === "night") base -= 12; // flat night penalty

  const score = Math.max(5, Math.min(100, base));
  return {
    safety_score: score,
    level: score >= 75 ? "safe" : score >= 50 ? "caution" : "danger",
    nearby_incidents: nearby,
    incident_severity_sum: sevSum,
    lighting_score: lighting,
    crowd_density: crowd,
  };
}

// ─── AI chat responses (hardcoded but realistic) ──────────────────────────────
const AI_RESPONSES = {
  "being followed": "If you feel you're being followed, immediately move toward a well-lit, crowded area — a shop, a dhaba, or a police post. Call someone trusted and keep talking. If the situation escalates, call 112. Use the SOS button above to alert your trusted contacts with your live GPS. Trust your instincts — you are right to take action.",
  "safe to walk": "After dark, it's best to plan routes through well-lit main roads rather than shortcuts. Check the SurakshitPath safety score before you go. Let at least one trusted contact know your route and ETA. Walk with confidence, keep your phone accessible (not in hand), and avoid looking at your phone while walking. 112 and 1091 are always available.",
  "auto": "When taking an auto-rickshaw at night: check the driver's ID plate, share the auto number with a contact, sit towards the door (not against the driver), and enable your phone's live location sharing. The SurakshitPath SOS button will ping your contacts if needed. Prefer registered app-based autos where possible.",
  "unsafe": "I hear you. Please prioritize your immediate safety. Move toward a crowded, well-lit area right now. Use the red SOS button to alert your contacts with your live location. Call 112 (Police) or 1091 (Women's Helpline). You can also call a contact directly from the SOS panel. You are not alone — help is on the way.",
  "incident": "Thank you for wanting to report this. Tap the orange ⚠️ button on the map to submit an incident report. Your report helps protect every person who walks this route. Reports are anonymous and reviewed by civic moderators within 24 hours.",
  "default": "I'm here to help you navigate safely. You can ask me about: staying safe while walking at night, what to do if followed, how to take autos safely, or how to report an incident. For emergencies, call 112 or use the SOS button on the map."
};

function _aiReply(message) {
  const msg = message.toLowerCase();
  for (const [key, reply] of Object.entries(AI_RESPONSES)) {
    if (key !== "default" && msg.includes(key)) return reply;
  }
  return AI_RESPONSES.default;
}

// ─── Mock axios-like API object ───────────────────────────────────────────────
function _delay(ms = 400 + Math.random() * 400) {
  return new Promise(r => setTimeout(r, ms));
}

function _ok(data) { return { data }; }
function _err(status, detail) {
  const e = new Error(detail);
  e.response = { status, data: { detail } };
  throw e;
}

function _authCheck() {
  if (!_store.user) _err(401, "Not authenticated");
}

export const api = {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  async get(path, opts) {
    await _delay();
    const params = opts?.params || {};

    // /auth/me
    if (path === "/auth/me") {
      if (!_store.user) _err(401, "Not authenticated");
      return _ok(_store.user);
    }

    // /incidents
    if (path === "/incidents") {
      const limit = params.limit || 200;
      return _ok({ incidents: _store.incidents.filter(i => i.status === "active").slice(0, limit), count: _store.incidents.length });
    }

    // /contacts
    if (path === "/contacts") {
      _authCheck();
      return _ok({ contacts: _store.contacts.filter(c => c.user_id === _store.user.user_id) });
    }

    // /admin/incidents
    if (path === "/admin/incidents") {
      _authCheck();
      return _ok({ incidents: _store.incidents });
    }

    // /admin/stats
    if (path === "/admin/stats") {
      _authCheck();
      const total = _store.incidents.length;
      const active = _store.incidents.filter(i => i.status === "active").length;
      const resolved = _store.incidents.filter(i => i.status === "resolved").length;
      const cats = {};
      _store.incidents.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
      const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => ({ category: c, count: n }));
      return _ok({ total_incidents: total, active_incidents: active, resolved_incidents: resolved, total_users: 1, total_sos: _store.sosAlerts.length, top_categories: top });
    }

    // /geocode/search?q=...
    if (path === "/geocode/search") {
      // Try real Photon API (no auth needed, free)
      const q = params.q || "";
      try {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`);
        if (r.ok) {
          const data = await r.json();
          const results = (data.features || []).map(f => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates;
            if (!coords) return null;
            const name = p.name || "";
            const bits = [p.city, p.state, p.country].filter(Boolean);
            const label = [name, ...bits].filter(Boolean).join(", ");
            return { label, short: name || (bits[0] || q), lat: coords[1], lng: coords[0], type: p.type, osm_id: p.osm_id };
          }).filter(Boolean);
          return _ok({ results });
        }
      } catch { }
      return _ok({ results: [] });
    }

    // /sos/history
    if (path === "/sos/history") {
      _authCheck();
      return _ok({ alerts: _store.sosAlerts.filter(a => a.user_id === _store.user.user_id) });
    }

    return _err(404, "Not found");
  },

  async post(path, body) {
    await _delay();

    // Dev login — instant login without OAuth
    if (path === "/auth/dev-login") {
      const token = "dev_" + Math.random().toString(36).slice(2, 18);
      _store.user = {
        user_id: "user_demo",
        email: body?.email || "demo@surakshitpath.in",
        name: body?.name || "Demo User",
        picture: null,
        is_admin: true,
        created_at: new Date().toISOString(),
      };
      setToken(token);
      return _ok({ user: _store.user, session_token: token });
    }

    // /auth/session (called after Emergent OAuth — we skip in mock)
    if (path === "/auth/session") {
      _err(503, "OAuth not available in offline demo mode. Use dev login.");
    }

    // /auth/logout
    if (path === "/auth/logout") {
      _store.user = null;
      setToken(null);
      return _ok({ ok: true });
    }

    // /routes/safest — real OSRM roads + incident-aware safety scoring
    if (path === "/routes/safest") {
      const { origin, destination, time_of_day } = body;
      const tod = time_of_day || (new Date().getHours() >= 19 || new Date().getHours() < 6 ? "night" : "day");

      // Build 3 route variants using different via-waypoints through real road network
      const routeConfigs = [
        { id: "r_0", label: "Direct",       via: null },
        { id: "r_1", label: "Safer detour", via: "safer" },
        { id: "r_2", label: "Longer detour",via: "detour" },
      ];

      const routePromises = routeConfigs.map(async (cfg) => {
        try {
          let vLat = null, vLng = null;
          if (cfg.via) {
            const v = _safeViaWaypoint(origin.lat, origin.lng, destination.lat, destination.lng, _store.incidents, cfg.via);
            vLat = v.vLat; vLng = v.vLng;
          }
          const osrm = await _osrmRoute(origin.lat, origin.lng, destination.lat, destination.lng, vLat, vLng);
          const scored = _scoreRoute(osrm.geometry, _store.incidents, tod);
          return {
            route_id: cfg.id,
            geometry: osrm.geometry,
            distance_km: parseFloat((osrm.distance_m / 1000).toFixed(2)),
            duration_min: parseFloat((osrm.duration_s / 60).toFixed(1)),
            time_of_day: tod,
            ...scored,
          };
        } catch {
          return null;
        }
      });

      let routes = (await Promise.all(routePromises)).filter(Boolean);

      // Deduplicate near-identical routes (OSRM may return same path for different vias)
      routes = routes.filter((r, i) => {
        if (i === 0) return true;
        const prev = routes[i - 1];
        const diff = Math.abs(r.distance_km - prev.distance_km);
        return diff > 0.05; // keep only if meaningfully different distance
      });

      // If OSRM failed entirely (offline), fall back to straight-line approximation
      if (routes.length === 0) {
        [-0.5, 0, 0.4].forEach((off, idx) => {
          const n = 30;
          const coords = [];
          for (let i = 0; i <= n; i++) {
            const t = i / n;
            coords.push([
              origin.lng + (destination.lng - origin.lng) * t + off * Math.sin(Math.PI * t) * 0.008,
              origin.lat + (destination.lat - origin.lat) * t + off * Math.sin(Math.PI * t) * 0.006,
            ]);
          }
          const dist = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * (1 + Math.abs(off) * 0.25);
          const scored = _scoreRoute(coords, _store.incidents, tod);
          routes.push({ route_id: `r_${idx}`, geometry: coords, distance_km: parseFloat(dist.toFixed(2)), duration_min: parseFloat((dist / 0.083).toFixed(1)), time_of_day: tod, ...scored });
        });
      }

      routes.sort((a, b) => b.safety_score - a.safety_score || a.distance_km - b.distance_km);
      return _ok({ routes, time_of_day: tod });
    }

    // /incidents (report new)
    if (path === "/incidents") {
      _authCheck();
      const inc = {
        incident_id: `inc_${Math.random().toString(36).slice(2, 12)}`,
        user_id: _store.user.user_id,
        ...body,
        reported_at: new Date().toISOString(),
        status: "active",
      };
      _store.incidents.unshift(inc);
      return _ok(inc);
    }

    // /contacts
    if (path === "/contacts") {
      _authCheck();
      const c = {
        contact_id: `ct_${Math.random().toString(36).slice(2, 12)}`,
        user_id: _store.user.user_id,
        ...body,
        created_at: new Date().toISOString(),
      };
      _store.contacts.push(c);
      return _ok(c);
    }

    // /sos/trigger
    if (path === "/sos/trigger") {
      _authCheck();
      const contacts = _store.contacts.filter(c => c.user_id === _store.user.user_id);
      const alert_id = `sos_${Math.random().toString(36).slice(2, 12)}`;
      const gmaps = `https://maps.google.com/?q=${body.lat},${body.lng}`;
      const deliveries = contacts.map(c => ({ sent: true, simulated: true, to: c.phone }));
      _store.sosAlerts.unshift({ alert_id, user_id: _store.user.user_id, ...body, deliveries, simulated: true, triggered_at: new Date().toISOString() });
      return _ok({ alert_id, contacts_notified: contacts.length, deliveries, simulated: true, maps_url: gmaps });
    }

    // /ai/risk-analysis
    if (path === "/ai/risk-analysis") {
      const { safety_score, nearby_incidents, time_of_day, lighting_score, crowd_density } = body;
      const level = safety_score >= 75 ? "safe" : safety_score >= 50 ? "caution" : "high risk";
      const insight = `**Insight**\nThis route scores **${safety_score}/100** — considered **${level}**. ${safety_score >= 75
          ? "Conditions look favourable. Lighting and crowd density are adequate for this time of day."
          : safety_score >= 50
            ? "Exercise awareness on this route. Some segments may have reduced visibility or fewer people."
            : "This route has multiple reported incidents nearby. Consider an alternate path if possible."
        } There ${nearby_incidents === 1 ? "is 1 incident" : `are ${nearby_incidents} incidents`} reported within 300 m.\n\n**Tips**\n- ${time_of_day === "night" ? "Prefer main roads with active street lighting" : "Stick to populated, open pathways"}\n- Share your live location with a trusted contact before you start\n- Keep the SOS button accessible — one tap alerts all your contacts`;
      return _ok({ analysis: insight, model: "mock-ai" });
    }

    // /ai/chat
    if (path === "/ai/chat") {
      const reply = _aiReply(body.message);
      const sid = body.session_id;
      if (!_store.chatHistory[sid]) _store.chatHistory[sid] = [];
      _store.chatHistory[sid].push({ user: body.message, ai: reply });
      return _ok({ reply, session_id: sid, model: "mock-gemini" });
    }

    // /admin/incidents/bulk
    if (path === "/admin/incidents/bulk") {
      _authCheck();
      const docs = (body.incidents || []).map(it => ({
        incident_id: `inc_${Math.random().toString(36).slice(2, 12)}`,
        user_id: null, source: "bulk_import",
        category: it.category, description: it.description || "", lat: it.lat, lng: it.lng,
        severity: Math.max(1, Math.min(3, it.severity || 2)), time_of_day: it.time_of_day || "night",
        reported_at: new Date().toISOString(), status: "active",
      }));
      _store.incidents.unshift(...docs);
      return _ok({ inserted: docs.length, skipped: 0, total_now: _store.incidents.length });
    }

    return _err(404, "Not found");
  },

  async patch(path, body) {
    await _delay();
    // /admin/incidents/:id
    const m = path.match(/^\/admin\/incidents\/(.+)$/);
    if (m) {
      _authCheck();
      const inc = _store.incidents.find(i => i.incident_id === m[1]);
      if (!inc) _err(404, "Not found");
      Object.assign(inc, body);
      return _ok(inc);
    }
    return _err(404, "Not found");
  },

  async delete(path) {
    await _delay();
    // /contacts/:id
    const m = path.match(/^\/contacts\/(.+)$/);
    if (m) {
      _authCheck();
      const idx = _store.contacts.findIndex(c => c.contact_id === m[1] && c.user_id === _store.user.user_id);
      if (idx === -1) _err(404, "Contact not found");
      _store.contacts.splice(idx, 1);
      return _ok({ ok: true });
    }
    return _err(404, "Not found");
  },
};
