const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(
  /\/+$/,
  "",
);

async function request(path, params = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  url.search = new URLSearchParams(params).toString();

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Backend non raggiungibile. Verifica che il servizio API sia avviato.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Richiesta non riuscita (${response.status})`,
    );
  }

  return data;
}

export async function searchLocations(query) {
  const data = await request("/weather/locations", { q: query });
  return Array.isArray(data.locations) ? data.locations : [];
}

export async function loadForecast(latitude, longitude) {
  const data = await request("/weather/forecast", {
    lat: latitude,
    lon: longitude,
  });

  if (!Array.isArray(data.forecast)) {
    throw new Error("Risposta forecast non valida");
  }

  return data;
}
