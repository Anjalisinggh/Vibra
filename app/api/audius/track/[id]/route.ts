import { type NextRequest, NextResponse } from "next/server"

const AUDIUS_APP_NAME = process.env.NEXT_PUBLIC_AUDIUS_APP_NAME || "vibra-unspoken"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing track id" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/${encodeURIComponent(id)}?app_name=${encodeURIComponent(AUDIUS_APP_NAME)}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) {
      console.error(`Audius track lookup failed with status ${res.status}`)
      return NextResponse.json({ error: "Track not found" }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Audius track proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 })
  }
}
