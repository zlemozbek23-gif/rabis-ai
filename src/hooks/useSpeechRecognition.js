import { useState, useEffect, useRef, useCallback } from 'react'
import { transcribeAudio } from '../lib/gemini'

/**
 * Advanced Speech Recognition Hook with Google AI Style Voice Waveform Visualizer
 * - Real-time AudioContext frequency analysis for glowing, bouncing audio wave bars
 * - Accurate recording timer (00:04)
 * - Studio-grade audio constraints (echoCancellation, noiseSuppression, autoGainControl)
 * - Dual engine: real-time Web Speech API + Gemini Multimodal Audio Transcription fallback
 */
export function useSpeechRecognition({ onTranscript, lang = 'tr-TR' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const [duration, setDuration] = useState(0) // in seconds
  const [audioLevels, setAudioLevels] = useState([0.15, 0.25, 0.15, 0.3, 0.15]) // 5 bar wave levels (0 to 1)

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)
  const speechTextCollectedRef = useRef('')
  const hadNetworkErrorRef = useRef(false)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [])

  const cleanupAudio = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    try {
      recognitionRef.current?.abort()
    } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
    } catch {}
  }

  // Audio wave animation loop using Web Audio API AnalyserNode
  const startAudioWaveAnalysis = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateWave = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        // Sample 5 representative frequency bands
        const b0 = Math.max(0.1, dataArray[1] / 255)
        const b1 = Math.max(0.1, dataArray[4] / 255)
        const b2 = Math.max(0.1, dataArray[8] / 255)
        const b3 = Math.max(0.1, dataArray[12] / 255)
        const b4 = Math.max(0.1, dataArray[16] / 255)

        setAudioLevels([b0, b1, b2, b3, b4])
        animFrameRef.current = requestAnimationFrame(updateWave)
      }

      updateWave()
    } catch (e) {
      console.warn('Audio visualization not available:', e)
    }
  }

  const stopListening = useCallback(async () => {
    setIsListening(false)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    // Stop native recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    // Stop media recorder
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {}
    }
  }, [])

  const startListening = useCallback(async () => {
    setError(null)
    speechTextCollectedRef.current = ''
    hadNetworkErrorRef.current = false
    audioChunksRef.current = []
    setDuration(0)

    let stream = null
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tarayıcınız mikrofon erişimini desteklemiyor.')
      }

      // Studio grade audio constraints for crystal clear voice recognition
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
        },
      })
      streamRef.current = stream
    } catch (err) {
      console.warn('Microphone permission or hardware error:', err)
      setError('Mikrofon erişimi sağlanamadı. Lütfen tarayıcı izinlerinden mikrofona izin verin.')
      return
    }

    // Start real-time audio wave analysis
    startAudioWaveAnalysis(stream)

    // Start recording duration timer
    timerIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    // Setup MediaRecorder as universal audio capture
    let mimeType = 'audio/webm'
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
      }

      try {
        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        })
        audioChunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }

        recorder.onstop = async () => {
          // Release mic stream
          stream.getTracks().forEach((track) => track.stop())
          streamRef.current = null

          const collectedText = speechTextCollectedRef.current.trim()

          // If native speech worked and gave text, we are good!
          if (collectedText && !hadNetworkErrorRef.current) {
            return
          }

          // If native speech failed or yielded no text, transcribe via Gemini AI!
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: mimeType })
            if (blob.size > 800) {
              setIsTranscribing(true)
              try {
                const transcribed = await transcribeAudio(blob)
                if (transcribed && onTranscriptRef.current) {
                  onTranscriptRef.current(transcribed)
                  setError(null)
                }
              } catch (transcribeErr) {
                console.warn('Gemini audio transcription fallback error:', transcribeErr)
                if (!collectedText) {
                  setError('Ses tam anlaşılamadı. Lütfen biraz daha yakından tekrar konuşun.')
                }
              } finally {
                setIsTranscribing(false)
              }
            }
          }
        }

        recorder.start(250)
        mediaRecorderRef.current = recorder
      } catch (recErr) {
        console.warn('MediaRecorder error:', recErr)
      }
    }

    // Attempt native Web Speech API for real-time live typing
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort() } catch {}
          recognitionRef.current = null
        }

        const instance = new SpeechRecognition()
        instance.continuous = true
        instance.interimResults = true
        instance.lang = lang

        instance.onresult = (event) => {
          let fullTranscript = ''
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript
          }
          if (fullTranscript) {
            speechTextCollectedRef.current = fullTranscript
            if (onTranscriptRef.current) {
              onTranscriptRef.current(fullTranscript)
            }
          }
        }

        instance.onerror = (e) => {
          console.warn('Native speech recognition notice:', e.error)
          if (e.error === 'network') {
            hadNetworkErrorRef.current = true
          } else if (e.error === 'not-allowed') {
            setError('Mikrofon erişimi engellendi. Lütfen tarayıcıdan izin verin.')
            stopListening()
          }
        }

        recognitionRef.current = instance
        instance.start()
      } catch (e) {
        hadNetworkErrorRef.current = true
      }
    } else {
      hadNetworkErrorRef.current = true
    }

    setIsListening(true)
  }, [lang, stopListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Format seconds to mm:ss
  const formattedDuration = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`

  return {
    isListening,
    isTranscribing,
    isSupported,
    error,
    duration,
    formattedDuration,
    audioLevels,
    startListening,
    stopListening,
    toggleListening,
  }
}
