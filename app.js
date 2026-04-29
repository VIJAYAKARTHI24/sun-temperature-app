const state = {
  unit: localStorage.getItem("sunTempUnit") || "c",
  lastReading: null,
  recent: readRecent(),
};

const elements = {
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#locationInput"),
  geoButton: document.querySelector("#geoButton"),
  recentStrip: document.querySelector("#recentStrip"),
  unitButtons: document.querySelectorAll(".unit-button"),
  placeName: document.querySelector("#placeName"),
  timeNote: document.querySelector("#timeNote"),
  temperature: document.querySelector("#temperature"),
  degree: document.querySelector("#degree"),
  condition: document.querySelector("#condition"),
  feelsLike: document.querySelector("#feelsLike"),
  sunStatus: document.querySelector("#sunStatus"),
  uvIndex: document.querySelector("#uvIndex"),
  humidity: document.querySelector("#humidity"),
  cloudCover: document.querySelector("#cloudCover"),
  windSpeed: document.querySelector("#windSpeed"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  dailyRange: document.querySelector("#dailyRange"),
  statusLine: document.querySelector("#statusLine"),
};

const weatherCodes = new Map([
  [0, "Clear sky"],
  [1, "Mostly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Foggy"],
  [48, "Rime fog"],
  [51, "Light drizzle"],
  [53, "Drizzle"],
  [55, "Dense drizzle"],
  [56, "Freezing drizzle"],
  [57, "Freezing drizzle"],
  [61, "Light rain"],
  [63, "Rain"],
  [65, "Heavy rain"],
  [66, "Freezing rain"],
  [67, "Freezing rain"],
  [71, "Light snow"],
  [73, "Snow"],
  [75, "Heavy snow"],
  [77, "Snow grains"],
  [80, "Light showers"],
  [81, "Showers"],
  [82, "Heavy showers"],
  [85, "Snow showers"],
  [86, "Heavy snow showers"],
  [95, "Thunderstorm"],
  [96, "Thunderstorm with hail"],
  [99, "Thunderstorm with hail"],
]);

function setStatus(message, isError = false) {
  elements.statusLine.textContent = message;
  elements.statusLine.style.color = isError ? "#b42318" : "";
}

function readRecent() {
  try {
    const recent = JSON.parse(localStorage.getItem("sunTempRecent") || "[]");
    return Array.isArray(recent) ? recent : [];
  } catch {
    return [];
  }
}

function toFahrenheit(celsius) {
  return celsius * 1.8 + 32;
}

function formatTemp(celsius) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return "--";
  const value = state.unit === "f" ? toFahrenheit(celsius) : celsius;
  return Math.round(value).toString();
}

function formatWind(kph) {
  if (kph === null || kph === undefined || Number.isNaN(kph)) return "--";
  if (state.unit === "f") {
    return `${Math.round(kph / 1.609)} mph`;
  }
  return `${Math.round(kph)} km/h`;
}

function parseLocalIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value)}%`;
}

function formatTime(value) {
  if (!value) return "--";
  const date = parseLocalIso(value);
  if (!date) return "--";
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Live weather";
  const date = parseLocalIso(value);
  if (!date) return "Live weather";
  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function uvLabel(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (value < 3) return `${Math.round(value)} Low`;
  if (value < 6) return `${Math.round(value)} Medium`;
  if (value < 8) return `${Math.round(value)} High`;
  if (value < 11) return `${Math.round(value)} Very high`;
  return `${Math.round(value)} Extreme`;
}

function buildPlaceName(place) {
  const parts = [place.name, place.admin1, place.country].filter(Boolean);
  return parts.join(", ");
}

function saveRecent(place) {
  if (!place?.name) return;
  const saved = {
    name: place.name,
    admin1: place.admin1,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
  state.recent = [saved, ...state.recent.filter((item) => buildPlaceName(item) !== buildPlaceName(saved))].slice(0, 5);
  localStorage.setItem("sunTempRecent", JSON.stringify(state.recent));
  renderRecent();
}

function renderRecent() {
  elements.recentStrip.innerHTML = "";
  state.recent.forEach((place) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-chip";
    button.textContent = buildPlaceName(place);
    button.addEventListener("click", () => loadWeather(place));
    elements.recentStrip.append(button);
  });
}

function renderReading() {
  const reading = state.lastReading;
  if (!reading) return;

  const { place, weather } = reading;
  const current = weather.current;
  const daily = weather.daily;
  const minTemp = daily.temperature_2m_min?.[0];
  const maxTemp = daily.temperature_2m_max?.[0];

  elements.placeName.textContent = buildPlaceName(place);
  elements.timeNote.textContent = `Updated ${formatDateTime(current.time)}`;
  elements.temperature.textContent = formatTemp(current.temperature_2m);
  elements.degree.textContent = state.unit === "f" ? "°F" : "°C";
  elements.condition.textContent = weatherCodes.get(current.weather_code) || "Current conditions";
  elements.feelsLike.textContent = `${formatTemp(current.apparent_temperature)}°`;
  elements.sunStatus.textContent = current.is_day ? "Daylight" : "Night";
  elements.uvIndex.textContent = uvLabel(daily.uv_index_max?.[0]);
  elements.humidity.textContent = formatPercent(current.relative_humidity_2m);
  elements.cloudCover.textContent = formatPercent(current.cloud_cover);
  elements.windSpeed.textContent = formatWind(current.wind_speed_10m);
  elements.sunrise.textContent = formatTime(daily.sunrise?.[0]);
  elements.sunset.textContent = formatTime(daily.sunset?.[0]);
  elements.dailyRange.textContent = `${formatTemp(minTemp)}° / ${formatTemp(maxTemp)}°`;
}

async function fetchJson(url, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

async function geocodeLocation(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });
  const data = await fetchJson(url, "Location search failed.");
  if (!data.results?.length) throw new Error("No matching location found.");
  return data.results[0];
}

async function fetchWeather(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
    ].join(","),
    daily: ["sunrise", "sunset", "uv_index_max", "temperature_2m_max", "temperature_2m_min"].join(","),
    wind_speed_unit: "kmh",
    timezone: "auto",
  });
  return fetchJson(url, "Weather service is unavailable right now.");
}

async function loadWeather(place) {
  setStatus(`Checking ${buildPlaceName(place)}...`);
  elements.form.classList.add("loading");
  try {
    const weather = await fetchWeather(place);
    state.lastReading = { place, weather };
    saveRecent(place);
    renderReading();
    setStatus("Live weather data from Open-Meteo.");
  } catch (error) {
    setStatus(error.message || "Could not load weather for this place.", true);
  } finally {
    elements.form.classList.remove("loading");
  }
}

async function searchLocation(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    setStatus("Enter a location name first.", true);
    elements.input.focus();
    return;
  }

  setStatus(`Searching for ${cleanQuery}...`);
  try {
    const place = await geocodeLocation(cleanQuery);
    elements.input.value = "";
    await loadWeather(place);
  } catch (error) {
    setStatus(error.message || "Could not find that location.", true);
  }
}

function loadCurrentPosition() {
  if (!navigator.geolocation) {
    setStatus("Location detection is not available in this browser.", true);
    return;
  }

  setStatus("Detecting your location...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const place = {
        name: "Current Location",
        admin1: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
        country: "",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      loadWeather(place);
    },
    () => setStatus("Location permission was blocked or unavailable.", true),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
  );
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchLocation(elements.input.value);
});

elements.geoButton.addEventListener("click", loadCurrentPosition);

elements.unitButtons.forEach((button) => {
  button.classList.toggle("active", button.dataset.unit === state.unit);
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    localStorage.setItem("sunTempUnit", state.unit);
    elements.unitButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderReading();
  });
});

renderRecent();
searchLocation("New York");
