"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface CrimeData {
  id: string
  lat: number
  lng: number
  severity: "low" | "medium" | "high"
  type: string
  timestamp: string
}

interface RoutePoint {
  lat: number
  lng: number
  address: string
}

interface MapComponentProps {
  center: { lat: number; lng: number }
  crimeData: CrimeData[]
  route: RoutePoint[]
  currentLocation: { lat: number; lng: number }
  isTracking: boolean
}

export default function MapComponent({ center, crimeData, route, currentLocation, isTracking }: MapComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [zoom, setZoom] = useState(13)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [hoveredCrime, setHoveredCrime] = useState<CrimeData | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback(
    (lat: number, lng: number, canvasWidth: number, canvasHeight: number) => {
      const scale = Math.pow(2, zoom)
      const worldWidth = 256 * scale
      const worldHeight = 256 * scale

      const pixelX = ((lng + 180) / 360) * worldWidth
      const pixelY =
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        worldHeight

      const centerPixelX = ((mapCenter.lng + 180) / 360) * worldWidth
      const centerPixelY =
        ((1 -
          Math.log(Math.tan((mapCenter.lat * Math.PI) / 180) + 1 / Math.cos((mapCenter.lat * Math.PI) / 180)) /
            Math.PI) /
          2) *
        worldHeight

      return {
        x: pixelX - centerPixelX + canvasWidth / 2,
        y: pixelY - centerPixelY + canvasHeight / 2,
      }
    },
    [mapCenter, zoom],
  )

  // Draw the map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas

    // Clear canvas
    ctx.fillStyle = "#f0f9ff"
    ctx.fillRect(0, 0, width, height)

    // Draw grid pattern to simulate map tiles
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw streets (simplified)
    ctx.strokeStyle = "#94a3b8"
    ctx.lineWidth = 2
    const streets = [
      { start: { x: 0, y: height * 0.3 }, end: { x: width, y: height * 0.3 } },
      { start: { x: 0, y: height * 0.7 }, end: { x: width, y: height * 0.7 } },
      { start: { x: width * 0.2, y: 0 }, end: { x: width * 0.2, y: height } },
      { start: { x: width * 0.5, y: 0 }, end: { x: width * 0.5, y: height } },
      { start: { x: width * 0.8, y: 0 }, end: { x: width * 0.8, y: height } },
    ]

    streets.forEach((street) => {
      ctx.beginPath()
      ctx.moveTo(street.start.x, street.start.y)
      ctx.lineTo(street.end.x, street.end.y)
      ctx.stroke()
    })

    // Draw crime heatmap circles
    crimeData.forEach((crime) => {
      const pos = latLngToPixel(crime.lat, crime.lng, width, height)
      if (pos.x >= -50 && pos.x <= width + 50 && pos.y >= -50 && pos.y <= height + 50) {
        const colors = {
          high: { fill: "rgba(239, 68, 68, 0.1)", stroke: "rgba(239, 68, 68, 0.3)" },
          medium: { fill: "rgba(249, 115, 22, 0.1)", stroke: "rgba(249, 115, 22, 0.3)" },
          low: { fill: "rgba(234, 179, 8, 0.1)", stroke: "rgba(234, 179, 8, 0.3)" },
        }

        const radius = crime.severity === "high" ? 40 : crime.severity === "medium" ? 30 : 20

        // Heatmap circle
        ctx.fillStyle = colors[crime.severity].fill
        ctx.strokeStyle = colors[crime.severity].stroke
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // Crime marker
        ctx.fillStyle = crime.severity === "high" ? "#ef4444" : crime.severity === "medium" ? "#f97316" : "#eab308"
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    // Draw route
    if (route.length > 1) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 4
      ctx.setLineDash([10, 10])
      ctx.beginPath()

      route.forEach((point, index) => {
        const pos = latLngToPixel(point.lat, point.lng, width, height)
        if (index === 0) {
          ctx.moveTo(pos.x, pos.y)
        } else {
          ctx.lineTo(pos.x, pos.y)
        }
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Draw route markers
      route.forEach((point, index) => {
        const pos = latLngToPixel(point.lat, point.lng, width, height)
        ctx.fillStyle = index === 0 ? "#10b981" : index === route.length - 1 ? "#ef4444" : "#3b82f6"
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI)
        ctx.fill()
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    // Draw current location
    if (isTracking) {
      const pos = latLngToPixel(currentLocation.lat, currentLocation.lng, width, height)

      // Pulsing circle
      const pulseRadius = 20 + Math.sin(Date.now() / 500) * 5
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, pulseRadius, 0, 2 * Math.PI)
      ctx.fill()

      // Current location marker
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }, [mapCenter, zoom, crimeData, route, currentLocation, isTracking, latLngToPixel])

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    setMousePos({ x: mouseX, y: mouseY })

    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      const scale = Math.pow(2, zoom)
      const worldWidth = 256 * scale

      const lngDelta = (deltaX / worldWidth) * 360
      const latDelta = (deltaY / worldWidth) * 360 * Math.cos((mapCenter.lat * Math.PI) / 180)

      setMapCenter((prev) => ({
        lat: Math.max(-85, Math.min(85, prev.lat + latDelta)),
        lng: ((prev.lng - lngDelta + 180) % 360) - 180,
      }))

      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else {
      // Check for crime hover
      const canvas = canvasRef.current
      if (!canvas) return

      let hoveredCrimeData: CrimeData | null = null
      crimeData.forEach((crime) => {
        const pos = latLngToPixel(crime.lat, crime.lng, canvas.width, canvas.height)
        const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2)
        if (distance <= 10) {
          hoveredCrimeData = crime
        }
      })
      setHoveredCrime(hoveredCrimeData)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    setZoom((prev) => Math.max(1, Math.min(18, prev + delta)))
  }

  // Setup canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      drawMap()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const animationFrame = () => {
      drawMap()
      requestAnimationFrame(animationFrame)
    }
    requestAnimationFrame(animationFrame)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [drawMap])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-blue-50 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom((prev) => Math.min(18, prev + 1))}
          className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(1, prev - 1))}
          className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
        >
          −
        </button>
      </div>

      {/* Crime Info Tooltip */}
      {hoveredCrime && (
        <div
          className="absolute bg-white p-3 rounded-lg shadow-lg border pointer-events-none z-10 min-w-[200px]"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 10,
            transform: mousePos.x > 300 ? "translateX(-100%)" : "none",
          }}
        >
          <div className="font-semibold text-gray-900 mb-2">{hoveredCrime.type}</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Severity:</span>
              <span
                className={`font-medium capitalize ${
                  hoveredCrime.severity === "high"
                    ? "text-red-600"
                    : hoveredCrime.severity === "medium"
                      ? "text-orange-600"
                      : "text-yellow-600"
                }`}
              >
                {hoveredCrime.severity}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{new Date(hoveredCrime.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Lat: {hoveredCrime.lat.toFixed(4)}, Lng: {hoveredCrime.lng.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
        <div className="text-sm font-semibold mb-2">Crime Risk Levels</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Low Risk</span>
          </div>
          {isTracking && (
            <div className="flex items-center gap-2 pt-1 border-t">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
