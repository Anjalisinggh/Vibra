import { type NextRequest, NextResponse } from "next/server"

// Mock YTMusic API response for demonstration
// In production, you would use the actual ytmusicapi Python library
export async function POST(request: NextRequest) {
  try {
    const { query, limit = 30 } = await request.json()

    // Mock response simulating ytmusicapi search results
    const mockResults = [
      {
        videoId: "JGwWNGJdvx8",
        title: "Shape of You",
        artists: [{ name: "Ed Sheeran", id: "6eUKZXaKkcviH0Ku9w2n3V" }],
        album: { name: "÷ (Deluxe)", id: "3T4tUhGYeRNVUGevb0wThu" },
        thumbnails: [
          { url: "https://lh3.googleusercontent.com/proxy/example1", width: 60, height: 60 },
          { url: "https://lh3.googleusercontent.com/proxy/example2", width: 544, height: 544 },
        ],
        duration: "3:53",
        duration_seconds: 233,
        views: "5.8B views",
        category: "Song",
      },
      {
        videoId: "bx1Bh8ZvH84",
        title: "Wonderwall",
        artists: [{ name: "Oasis", id: "2DaxqgrOhkeH0fpeiQq2f4" }],
        album: { name: "(What's the Story) Morning Glory?", id: "1Am0QMUf1Xx5xrKOKvMfgR" },
        thumbnails: [
          { url: "https://lh3.googleusercontent.com/proxy/example3", width: 60, height: 60 },
          { url: "https://lh3.googleusercontent.com/proxy/example4", width: 544, height: 544 },
        ],
        duration: "4:18",
        duration_seconds: 258,
        views: "1.2B views",
        category: "Song",
      },
      {
        videoId: "4NRXx6U8ABQ",
        title: "Blinding Lights",
        artists: [{ name: "The Weeknd", id: "1Xyo4u8uXC1ZmMpatF05PJ" }],
        album: { name: "After Hours", id: "4yP0hdKOZPNshxUOjY0cZj" },
        thumbnails: [
          { url: "https://lh3.googleusercontent.com/proxy/example5", width: 60, height: 60 },
          { url: "https://lh3.googleusercontent.com/proxy/example6", width: 544, height: 544 },
        ],
        duration: "3:20",
        duration_seconds: 200,
        views: "3.1B views",
        category: "Song",
      },
    ]

    // Filter results based on query
    const filteredResults = mockResults.filter(
      (song) =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artists.some((artist) => artist.name.toLowerCase().includes(query.toLowerCase())),
    )

    return NextResponse.json(filteredResults.slice(0, limit))
  } catch (error) {
    console.error("YTMusic search error:", error)
    return NextResponse.json({ error: "Failed to search songs" }, { status: 500 })
  }
}
