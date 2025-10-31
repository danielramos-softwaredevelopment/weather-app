//  =====   API KEY =====
const apiKey = "c3de06200a636b1b3f9717c908bd7210";

//  =====   LINKING BUTTONS/INPUTS =====
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const locationBtn = document.getElementById('location-btn');

//  =====   EVENT LISTENERS =====

//  -----   Manual Search by City, State, or ZIP Code  -----
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getWeatherByCity(city);
});

//  -----   Search By Pressing Enter    -----
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const city = cityInput.value.trim();
        if(city) getWeatherByCity(city);
    }
});

//  -----   Auto-detect User's Location -----
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                alert("Unable to acess location. Please allow permissions or search manually.");
                console.error(error);
            }
        );
    } else {
        alert("Geolocation is not supported by browser.");
    }
});

//  =====   GET WEATHER BY CITY, STATE, ZIP CODE  =====
async function getWeatherByCity(cityInputText) {
    let query = cityInputText.trim();
    const isZip = /^\d{5}$/.test(query);

    let url, data;

    if (isZip) {

        //  -----   ZIP Code Search -----
        url = `https://api.openweathermap.org/data/2.5/weather?zip=${query},US&appid=${apiKey}&units=imperial`;
        const response = await fetch(url);
        data = await response.json();

        //  If result is not in the US (e.g., 46168 Spain mix-up), retry as city name
        if (data.sys?.country !== "US") {
            console.warn("ZIP code search returned non-US location. Retrying as city search...");
            url = `https://api.openweathermap.org/data/2.5/weather?q=${query},US&appid=${apiKey}&units=imperial`;
            data = await fetchAndDisplay(url);
        } else {
            displayWeather(data);
        } 
    } else {
        //  --- City/State Search ---
    if (query.includes(",")) {
        const parts = query.split(",").map(part => part.trim());
        if (parts.length === 2) {
            query = `${parts[0]},${parts[1]},US`;
            }
        }
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=imperial`;
    data = await fetchAndDisplay(url);
    }

    //Fetch Forecast if data and coordinates are valid
    if (data && data.coord) {
        await get5DayForecast(data.coord.lat, data.coord.lon);
    }
}

//  =====   GET WEATHER BY GEOLOCATION  =====
async function getWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    const data = await fetchAndDisplay(url);

    if (data && data.coord) {
        await get5DayForecast(data.coord.lat, data.coord.lon);
    }
}

//  =====   SHARED FETCH + DISPLAY FUNCTION =====
async function fetchAndDisplay(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Location not found. Please try again.");
        const data = await response.json();
        displayWeather(data);
        return data; // --- Return Fetched Data So Coordinates Are Available
    } catch (error) {
        alert(error.message);
    }
}

//  =====   DISPLAY RESULTS IN THE UI   =====
function displayWeather(data) {
    const resultSection = document.getElementById("weather-result");
    resultSection.classList.remove("hidden");

    document.getElementById("city-name").textContent = data.name;
    document.getElementById("temperature").textContent = `${data.main.temp}°F`;
    document.getElementById("description").textContent = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

//  =====   FETCH 5 DAY FORECAST  =====
async function get5DayForecast(lat, lon) {
    const url =`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    try {
        const response = await fetch(url);
    if (!response.ok) return alert("Forecast not available.");
    const data = await response.json();

    display5DayForecast(data);
    } catch (error) {
        console.error(error);
    }
}

//  =====   DISPLAY 5-DAY FORECAST  =====
function display5DayForecast(data) {
    const container = document.getElementById("forecast");
    const wrapper = document.getElementById("forecast-wrapper");

    //Clear Previous Forecast
    container.innerHTML = "";

    //Filter For 12:00:00PM Each Day
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    daily.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;
        const description = day.weather[0].description;

        const html = `
            <div class="forecast-day">
                <p>${date}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                <p>${temp}°F</p>
                <p>${description}</p>
            </div>
        `;
        container.innerHTML += html;
    });

    //Reveal Forecast Only After Successful Fetching
    wrapper.classList.remove("hidden");
}