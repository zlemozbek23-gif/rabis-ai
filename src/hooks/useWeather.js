import { useState, useCallback } from 'react'
import { fetchCurrentWeather } from '../lib/weather'
import { useAppStore } from '../store/useAppStore'

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export function useWeather() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { weather, weatherFetchedAt, setWeather } = useAppStore()

  const loadWeather = useCallback(
    async (forceRefresh = false) => {
      // Use cached weather if fresh enough
      if (
        !forceRefresh &&
        weather &&
        weatherFetchedAt &&
        Date.now() - weatherFetchedAt < CACHE_DURATION
      ) {
        return weather
      }

      setLoading(true)
      setError(null)
      try {
        const data = await fetchCurrentWeather()
        setWeather(data)
        return data
      } catch (err) {
        setError(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [weather, weatherFetchedAt, setWeather]
  )

  return { weather, loading, error, loadWeather }
}
