export function getOwmApiKey() {
  return (
    localStorage.getItem('styleai_owm_key') ||
    import.meta.env.VITE_OWM_API_KEY ||
    ''
  )
}

export function setOwmApiKey(key) {
  if (key) {
    localStorage.setItem('styleai_owm_key', key)
  } else {
    localStorage.removeItem('styleai_owm_key')
  }
}

/**
 * Fetch current weather by coordinates
 */
export async function fetchWeatherByCoords(lat, lon) {
  const apiKey = getOwmApiKey()
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    // Return realistic fallback weather if no key is configured yet
    return {
      temp: 22,
      feelsLike: 23,
      humidity: 50,
      condition: 'Clear',
      description: 'Güneşli ve Açık',
      icon: '01d',
      city: 'İstanbul',
      country: 'TR',
      windSpeed: 3,
      iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
    }
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=tr`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Hava durumu alınamadı')
  const data = await res.json()

  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    city: data.name,
    country: data.sys.country,
    windSpeed: Math.round(data.wind.speed),
    iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
  }
}

/**
 * Get user's current geolocation, then fetch weather
 */
export function fetchCurrentWeather() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback
      resolve(fetchWeatherByCoords(41.0082, 28.9784))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const weather = await fetchWeatherByCoords(coords.latitude, coords.longitude)
          resolve(weather)
        } catch (err) {
          reject(err)
        }
      },
      async () => {
        // Geolocation denied/failed -> fallback to Istanbul coords
        try {
          const weather = await fetchWeatherByCoords(41.0082, 28.9784)
          resolve(weather)
        } catch (fallbackErr) {
          reject(fallbackErr)
        }
      },
      { timeout: 8000 }
    )
  })
}

/**
 * Returns a clothing-relevant weather label
 */
export function getWeatherLabel(temp) {
  if (temp < 5) return 'Çok soğuk ❄️'
  if (temp < 12) return 'Soğuk 🧥'
  if (temp < 18) return 'Serin 🌬️'
  if (temp < 24) return 'Ilık 🌤️'
  if (temp < 30) return 'Sıcak ☀️'
  return 'Çok sıcak 🔥'
}
