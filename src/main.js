import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherInfo = document.getElementById('weatherInfo');
const errorMessage = document.getElementById('errorMessage');
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');

// Optional elements (add to HTML if desired)
const feelsLike = document.getElementById('feelsLike');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const unitToggle = document.getElementById('unitToggle');
const loadingSpinner = document.getElementById('loadingSpinner');

// State
let isFetching = false;
let useMetric = true;
let lastCity = '';

// Event listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Debounce guard + unit toggle
unitToggle?.addEventListener('click', () => {
  useMetric = !useMetric;
  unitToggle.textContent = useMetric ? '°C / m/s' : '°F / mph';
  if (lastCity) fetchWeatherData(lastCity);
});

// ─── Input sanitization ────────────────────────────────────────────────────
function sanitizeCityInput(input) {
  // Allow only letters, spaces, hyphens, apostrophes, commas (valid in city names)
  return input.replace(/[^a-zA-Z\s\-',\.]/g, '').trim().slice(0, 100);
}

// ─── Debounce ──────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedFetch = debounce(fetchWeatherData, 400);

function handleSearch() {
  const raw = cityInput.value.trim();
  const city = sanitizeCityInput(raw);

  if (!city) {
    showError('Please enter a valid city name.');
    return;
  }

  if (city.toLowerCase() === lastCity.toLowerCase() && weatherInfo && !weatherInfo.classList.contains('hidden')) {
    return; // Avoid redundant fetches for the same city
  }

  debouncedFetch(city);
}

// ─── Fetch weather ─────────────────────────────────────────────────────────
async function fetchWeatherData(city) {
  if (isFetching) return;
  isFetching = true;
  setLoading(true);

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: useMetric ? 'metric' : 'imperial',
      },
      timeout: 8000, // 8s timeout to avoid hanging requests
    });

    lastCity = city;
    displayWeatherData(response.data);
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        showError('City not found. Please check the spelling and try again.');
      } else if (err.response.status === 401) {
        showError('API key error. Please check your configuration.');
      } else if (err.response.status === 429) {
        showError('Too many requests. Please wait a moment and try again.');
      } else {
        showError(`Weather service error (${err.response.status}). Try again later.`);
      }
    } else if (err.code === 'ECONNABORTED') {
      showError('Request timed out. Check your connection.');
    } else {
      showError('Unable to fetch weather. Please try again.');
    }
    console.error('[WeatherApp] Fetch error:', err.message);
  } finally {
    isFetching = false;
    setLoading(false);
  }
}

// ─── Display data ──────────────────────────────────────────────────────────
function displayWeatherData(data) {
  hideError();

  // City & country — set via textContent, never innerHTML (XSS fix)
  cityName.textContent = `${data.name}, ${data.sys.country}`;

  // Date
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Weather icon — use createElement instead of innerHTML (XSS fix)
  const iconCode = data.weather[0].icon;
  const iconDesc = data.weather[0].description;
  const img = document.createElement('img');
  img.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  img.alt = iconDesc;
  img.width = 80;
  img.height = 80;
  weatherIcon.replaceChildren(img); // safe DOM replacement

  // Temperature
  const unit = useMetric ? '°C' : '°F';
  const speedUnit = useMetric ? 'm/s' : 'mph';
  temperature.textContent = `${Math.round(data.main.temp)}${unit}`;
  weatherDescription.textContent = capitalize(iconDesc);
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} ${speedUnit}`;

  // Optional extra details
  if (feelsLike) feelsLike.textContent = `${Math.round(data.main.feels_like)}${unit}`;
  if (visibility) visibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
  if (pressure) pressure.textContent = `${data.main.pressure} hPa`;

  weatherInfo.classList.remove('hidden');

  // Accessibility: announce update to screen readers
  weatherInfo.setAttribute('aria-live', 'polite');
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function showError(message) {
  // Set via textContent — never innerHTML — to prevent XSS
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  weatherInfo.classList.add('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function setLoading(state) {
  searchBtn.disabled = state;
  loadingSpinner?.classList.toggle('hidden', !state);
  searchBtn.textContent = state ? 'Searching…' : 'Search';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
