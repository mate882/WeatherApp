const API_KEY = '9a65b0804ef2fb1e40c7791920cccd0b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const weatherIcons = {
    '01d': { icon: '☀️', class: 'sunny' },
    '01n': { icon: '🌙', class: 'sunny' },
    '02d': { icon: '⛅', class: 'cloudy' },
    '02n': { icon: '☁️', class: 'cloudy' },
    '03d': { icon: '☁️', class: 'cloudy' },
    '03n': { icon: '☁️', class: 'cloudy' },
    '04d': { icon: '☁️', class: 'cloudy' },
    '04n': { icon: '☁️', class: 'cloudy' },
    '09d': { icon: '🌦️', class: 'rainy' },
    '09n': { icon: '🌦️', class: 'rainy' },
    '10d': { icon: '🌧️', class: 'rainy' },
    '10n': { icon: '🌧️', class: 'rainy' },
    '11d': { icon: '⛈️', class: 'storm' },
    '11n': { icon: '⛈️', class: 'storm' },
    '13d': { icon: '❄️', class: 'snow' },
    '13n': { icon: '❄️', class: 'snow' },
    '50d': { icon: '🌫️', class: 'mist' },
    '50n': { icon: '🌫️', class: 'mist' }
};

let currentCity = 'Madrid';
let isLoading = false;

function createParticles() {
    const container = document.getElementById('particles');
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (10 + Math.random() * 20) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(particle);
    }
}

function showLoading(loading = true) {
    const elements = ['currentTemp', 'realFeel', 'windSpeed', 'humidity', 'uvIndex'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (loading) {
            element.textContent = '...';
            element.style.opacity = '0.5';
        } else {
            element.style.opacity = '1';
        }
    });

    if (loading) {
        document.getElementById('hourlyItems').innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.7); grid-column: 1/-1; padding: 20px;">Loading forecast...</div>';
        document.getElementById('dailyForecast').innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.7); padding: 20px;">Loading forecast...</div>';
    }
}

async function fetchCurrentWeather(city) {
    const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error(`Weather data not found for ${city}`);
    return await response.json();
}

async function fetchForecast(city) {
    const response = await fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error(`Forecast data not found for ${city}`);
    return await response.json();
}

function processForecastData(forecastData) {
    const hourly = [];
    const daily = {};
    const today = new Date().toDateString();

    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        const dayKey = date.toDateString();

        if (hourly.length < 6) {
            const weatherIcon = weatherIcons[item.weather[0].icon];
            hourly.push({
                time: time,
                temp: Math.round(item.main.temp),
                condition: weatherIcon.class,
                icon: weatherIcon.icon
            });
        }

        if (!daily[dayKey]) {
            const dayName = dayKey === today ? 'Today' : 
                            date.toLocaleDateString('en-US', { weekday: 'short' });
            
            daily[dayKey] = {
                day: dayName,
                high: Math.round(item.main.temp_max),
                low: Math.round(item.main.temp_min),
                condition: weatherIcons[item.weather[0].icon].class,
                icon: weatherIcons[item.weather[0].icon].icon
            };
        } else {
            daily[dayKey].high = Math.max(daily[dayKey].high, Math.round(item.main.temp_max));
            daily[dayKey].low = Math.min(daily[dayKey].low, Math.round(item.main.temp_min));
        }
    });

    return {
        hourly: hourly,
        daily: Object.values(daily).slice(0, 7)
    };
}

function updateWeatherDisplay(currentData, forecastData) {
    const weatherIcon = weatherIcons[currentData.weather[0].icon];
    const rainChance = currentData.clouds?.all || 0;

    document.getElementById('currentTemp').textContent = `${Math.round(currentData.main.temp)}°`;
    document.getElementById('rainChance').textContent = `Chance of rain: ${rainChance}%`;
    document.getElementById('realFeel').textContent = `${Math.round(currentData.main.feels_like)}°`;
    document.getElementById('windSpeed').textContent = `${Math.round(currentData.wind.speed)} km/h`;
    document.getElementById('humidity').textContent = `${currentData.main.humidity}%`;
    document.getElementById('uvIndex').textContent = '5';

    const mainIcon = document.getElementById('mainWeatherIcon');
    mainIcon.className = `weather-icon ${weatherIcon.class}`;
    mainIcon.textContent = weatherIcon.icon;

    const { hourly, daily } = processForecastData(forecastData);

    const hourlyContainer = document.getElementById('hourlyItems');
    hourlyContainer.innerHTML = '';
    hourly.forEach(hour => {
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${hour.time}</div>
            <div class="hourly-icon ${hour.condition}">${hour.icon}</div>
            <div class="hourly-temp">${hour.temp}°</div>
        `;
        hourlyContainer.appendChild(hourlyItem);
    });

    const dailyContainer = document.getElementById('dailyForecast');
    dailyContainer.innerHTML = '';
    daily.forEach(day => {
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        dailyItem.innerHTML = `
            <div class="daily-day">${day.day}</div>
            <div class="daily-icon ${day.condition}">${day.icon}</div>
            <div class="daily-temps">
                <span class="daily-high">${day.high}°</span>
                <span class="daily-low">/${day.low}°</span>
            </div>
        `;
        dailyContainer.appendChild(dailyItem);
    });

    showLoading(false);
}

async function loadWeatherData(city) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);

    try {
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);

        currentCity = currentData.name;
        document.getElementById('cityName').textContent = currentCity;
        updateWeatherDisplay(currentData, forecastData);

        const searchInput = document.querySelector('.search-input');
        searchInput.style.borderColor = 'rgba(46, 204, 113, 0.6)';
        setTimeout(() => {
            searchInput.style.borderColor = '';
        }, 2000);

    } catch (error) {
        console.error('Error loading weather data:', error);
        
        const searchInput = document.querySelector('.search-input');
        searchInput.style.borderColor = 'rgba(231, 76, 60, 0.6)';
        searchInput.placeholder = 'City not found. Try again...';
        
        setTimeout(() => {
            searchInput.style.borderColor = '';
            searchInput.placeholder = 'Search for any city...';
        }, 3000);

        showLoading(false);
    } finally {
        isLoading = false;
    }
}

let searchTimeout;
document.getElementById('citySearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (searchTerm.length < 2) return;

    searchTimeout = setTimeout(() => {
        loadWeatherData(searchTerm);
    }, 800);  
});

document.getElementById('citySearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const searchTerm = e.target.value.trim();
        if (searchTerm.length >= 2) {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            loadWeatherData(searchTerm);
        }
    }
});

document.querySelector('.details-btn').addEventListener('click', (e) => {
    const button = e.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    
    setTimeout(() => {
        button.textContent = originalText;
    }, 1000);
});

createParticles();
loadWeatherData(currentCity);