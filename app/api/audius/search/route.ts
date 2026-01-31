import { type NextRequest, NextResponse } from "next/server"

const AUDIUS_APP_NAME = process.env.NEXT_PUBLIC_AUDIUS_APP_NAME || "vibra-unspoken"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")
  const trimmed = (query || "").trim()
  if (!trimmed) {
    return NextResponse.json({ data: [] })
  }

  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=${encodeURIComponent(AUDIUS_APP_NAME)}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) {
      console.error(`Audius search failed with status ${res.status}`)
      return NextResponse.json({ data: [] })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Audius search proxy error:", error)
    return NextResponse.json({ data: [], error: "Failed to fetch" }, { status: 502 })
  }
}
