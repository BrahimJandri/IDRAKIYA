import { forwardRef, useRef, useState, useEffect, useCallback } from 'react'

const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)
const IconVolume = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
)
const IconVolumeLow = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
  </svg>
)
const IconMute = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
)
const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
)
const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
)

const VideoPlayer = forwardRef(function VideoPlayer({ src, onContextMenu }, ref) {
  const containerRef = useRef(null)
  const progressRef = useRef(null)
  const hideTimer = useRef(null)
  const isDragging = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  const progress = duration ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  const showAndScheduleHide = useCallback(() => {
    setShowControls(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      clearTimeout(hideTimer.current)
    }
  }, [])

  const togglePlay = () => {
    const v = ref?.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const getSeekRatio = (clientX) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  const onProgressClick = (e) => {
    if (!ref?.current) return
    ref.current.currentTime = getSeekRatio(e.clientX) * duration
  }

  const onProgressMouseDown = (e) => {
    isDragging.current = true
    const onMove = (ev) => {
      if (!ref?.current) return
      ref.current.currentTime = getSeekRatio(ev.clientX) * duration
    }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const toggleMute = () => {
    const v = ref?.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const onVolumeChange = (e) => {
    const v = ref?.current
    if (!v) return
    const val = parseFloat(e.target.value)
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  const VolumeIcon = muted || volume === 0 ? IconMute : volume < 0.5 ? IconVolumeLow : IconVolume

  return (
    <div
      ref={containerRef}
      className="cvp"
      onMouseMove={showAndScheduleHide}
      onMouseLeave={() => { if (playing) setShowControls(false) }}
      onMouseEnter={() => setShowControls(true)}
      onClick={togglePlay}
    >
      <video
        ref={ref}
        className="cvp-video"
        src={src}
        onContextMenu={onContextMenu}
        onPlay={() => { setPlaying(true); scheduleHide() }}
        onPause={() => { setPlaying(false); setShowControls(true); clearTimeout(hideTimer.current) }}
        onTimeUpdate={() => {
          const v = ref?.current
          if (!v) return
          setCurrentTime(v.currentTime)
          if (v.buffered.length > 0)
            setBuffered(v.buffered.end(v.buffered.length - 1))
        }}
        onLoadedMetadata={() => setDuration(ref?.current?.duration || 0)}
      />

      {/* Big centre play/pause flash */}
      {!playing && (
        <div className="cvp-center-play">
          <IconPlay />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`cvp-controls${showControls ? '' : ' cvp-hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="cvp-progress"
          onClick={onProgressClick}
          onMouseDown={onProgressMouseDown}
        >
          <div className="cvp-track-bg" />
          <div className="cvp-track-buf" style={{ width: `${bufferedPct}%` }} />
          <div className="cvp-track-played" style={{ width: `${progress}%` }} />
          <div className="cvp-thumb" style={{ left: `${progress}%` }} />
        </div>

        {/* Bottom bar */}
        <div className="cvp-bar">
          <div className="cvp-bar-l">
            <button className="cvp-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <span className="cvp-time">
              {fmt(currentTime)}<span className="cvp-time-sep"> / </span>{fmt(duration)}
            </span>
          </div>
          <div className="cvp-bar-r">
            <div className="cvp-vol-wrap" onClick={(e) => e.stopPropagation()}>
              <button className="cvp-btn" onClick={toggleMute}>
                <VolumeIcon />
              </button>
              <input
                type="range"
                className="cvp-vol-slider"
                min="0" max="1" step="0.02"
                value={muted ? 0 : volume}
                onChange={onVolumeChange}
              />
            </div>
            <button className="cvp-btn" onClick={toggleFullscreen} title="Fullscreen">
              {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default VideoPlayer