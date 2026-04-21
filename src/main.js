import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = import.meta.env.VITE_BASE_URL

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

searchBtn.addEventListener('click', fetchWeatherData);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') fetchWeatherData();
});

// improved code

async function fetchWeatherData() {
  const city = cityInput.value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric' 
      }
    });
    
    displayWeatherData(response.data);
  } catch (err) {
    showError('City not found. Please try another location.');
    console.error(err);
  }
}


function displayWeatherData(data) {
  errorMessage.classList.add('hidden');
  
  // Set basic info
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  
  // Set current date
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const iconCode = data.weather[0].icon;
  weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${data.weather[0].description}">`;
  
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  weatherDescription.textContent = data.weather[0].description;
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} m/s`;
  
  weatherInfo.classList.remove('hidden');
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  weatherInfo.classList.add('hidden');
}
