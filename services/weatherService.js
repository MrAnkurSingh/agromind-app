import fetch from 'node-fetch';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export const syncWeatherData = async (lat, lon) => {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    try {
        // Fetch both forecast and current weather data at the same time
        const [forecastResponse, currentResponse] = await Promise.all([
            fetch(forecastUrl),
            fetch(currentUrl)
        ]);

        if (!forecastResponse.ok) throw new Error(`Forecast API responded with status ${forecastResponse.status}`);
        if (!currentResponse.ok) throw new Error(`Current Weather API responded with status ${currentResponse.status}`);
        
        const forecastData = await forecastResponse.json();
        const currentData = await currentResponse.json();

        // Process the 5-day forecast (same as before)
        const dailyForecasts = {};
        forecastData.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = { temps: [], descriptions: {}, icons: {} };
            }
            dailyForecasts[date].temps.push(item.main.temp);
            const desc = item.weather[0].description;
            const icon = item.weather[0].icon;
            dailyForecasts[date].descriptions[desc] = (dailyForecasts[date].descriptions[desc] || 0) + 1;
            dailyForecasts[date].icons[icon] = (dailyForecasts[date].icons[icon] || 0) + 1;
        });

        const processedForecast = Object.keys(dailyForecasts).slice(0, 5).map(date => {
            const dayData = dailyForecasts[date];
            const mostCommonDesc = Object.keys(dayData.descriptions).reduce((a, b) => dayData.descriptions[a] > dayData.descriptions[b] ? a : b);
            const mostCommonIcon = Object.keys(dayData.icons).reduce((a, b) => dayData.icons[a] > dayData.icons[b] ? a : b);
            
            return {
                date: date,
                temp_max: Math.max(...dayData.temps),
                temp_min: Math.min(...dayData.temps),
                description: mostCommonDesc,
                icon: mostCommonIcon
            };
        });

        // Combine all data into one object
        return {
            region: forecastData.city.name,
            current: {
                temp: currentData.main.temp,
                wind_speed: currentData.wind.speed,
                sunrise: currentData.sys.sunrise,
                sunset: currentData.sys.sunset
            },
            forecast: processedForecast,
            last_updated: new Date()
        };

    } catch (error) {
        console.error("Error in weatherService:", error);
        return { error: "Failed to fetch weather data" };
    }
};