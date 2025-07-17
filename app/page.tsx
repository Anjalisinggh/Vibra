"use client"
import { FaInstagram, FaTwitter, FaGithub } from "react-icons/fa"
import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Download, PlusCircle, Share2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Music,
  Heart,
  MessageCircle,
  Search,
  Grid3X3,
  List,
  Moon,
  Sun,
  Play,
  Pause,
  Volume2,
  Headphones,
  Loader2,
  LogIn,
  UserPlus,
  LogOut,
  Plus,
  PlayCircle,
  SkipForward,
  SkipBack,
  Repeat,
  X,
  ListMusic,
  ExternalLink,
  Filter,
  User,
  Trash2,
  Menu,
  ArrowUp,
} from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
// Firebase imports
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  increment,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
// Router import
import { useRouter } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"
import { useDebounce } from "@/hooks/use-debounce"
// Add the Link import
import Link from "next/link"

interface Song {
  id: string
  title: string
  artist: string
  mood: string[]
  emotion: string
  coverUrl: string
  audioUrl: string
  previewUrl: string
  externalUrl: string
  messages: AnonymousMessage[]
  plays: number
  duration: number
  source: "saavn" | "youtube"
  primaryArtists?: string
}

interface AnonymousMessage {
  id: string
  content: string
  emotion: string
  timestamp: any
  likes: number
  songId: string
  likedBy: string[] // Track who liked the message
}

interface Playlist {
  id: string
  name: string
  description: string
  songs: Song[]
  createdAt: string
  isPublic: boolean
  userId: string
  firebaseId?: string
}

const moodColors = {
  joy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  love: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300",
  anxiety: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  melancholy: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  nostalgia: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  upbeat: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  romantic: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300",
  contemplative: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300",
  epic: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
  dramatic: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  cathartic: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  introspective: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300",
  lonely: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  empowerment: "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300",
  tender: "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300",
  celebration: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  loneliness: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  energetic: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
  peaceful: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  motivational: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  edgy: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
}

// Mood-based search queries
const moodQueries = {
  joy: ["happy songs", "upbeat music", "feel good songs", "celebration", "cheerful music"],
  love: ["love songs", "romantic music", "valentine songs", "couple songs", "romance"],
  anxiety: ["calm music", "relaxing songs", "stress relief", "meditation music", "peaceful"],
  melancholy: ["melancholic songs", "indie music", "slow songs", "contemplative", "moody"],
  nostalgia: ["nostalgic songs", "throwback music", "memories", "old songs", "vintage"],
  upbeat: ["energetic songs", "dance music", "party songs", "workout music", "pump up"],
  romantic: ["romantic ballads", "love duets", "wedding songs", "intimate music", "serenade"],
  contemplative: ["thoughtful music", "philosophical songs", "deep lyrics", "introspective", "reflective"],
  epic: ["epic music", "cinematic songs", "powerful anthems", "grand music", "orchestral"],
  dramatic: ["dramatic songs", "theatrical music", "intense ballads", "emotional", "powerful"],
  cathartic: ["cathartic music", "release songs", "healing music", "therapeutic", "cleansing"],
  introspective: ["introspective songs", "self reflection", "deep thoughts", "soul searching", "mindful"],
  lonely: ["lonely songs", "solitude music", "alone time", "isolation", "solitary"],
  empowerment: ["empowering songs", "motivational music", "confidence boost", "strong", "inspiring"],
  tender: ["tender songs", "gentle music", "soft ballads", "caring", "sweet"],
  celebration: ["celebration songs", "victory music", "achievement", "success", "triumph"],
  loneliness: ["loneliness songs", "empty feeling", "missing someone", "solitary", "isolated"],
  energetic: ["high energy", "pump up songs", "adrenaline", "intense", "dynamic"],
  peaceful: ["peaceful music", "serene songs", "tranquil", "harmony", "zen"],
  motivational: ["motivational songs", "inspiration", "never give up", "determination", "drive"],
}

interface AppUser {
  id: string
  name: string
  email: string
}

interface SaavnAlbum {
  id: string
  name: string
  image: Array<{ quality: string; url: string }>
  url: string
  songCount: number
}

// Function to fetch albums from Saavn API
const fetchSaavnAlbums = async (query: string): Promise<SaavnAlbum[]> => {
  try {
    const res = await fetch(`https://saavn.dev/api/search/albums?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (data.success && data.data && data.data.results) {
      return data.data.results.map((album: any) => ({
        id: album.id,
        name: album.name,
        image: album.image,
        url: album.url,
        songCount: album.songCount,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching Saavn albums:", error)
    return []
  }
}

// Function to assign mood based on song title and artist
const assignMoodToSong = (title: string, artist: string): string[] => {
  const lowerTitle = title.toLowerCase()
  const lowerArtist = artist.toLowerCase()
  const text = `${lowerTitle} ${lowerArtist}`
  const moods: string[] = []

  if (text.includes("love") || text.includes("heart") || text.includes("romantic") || text.includes("kiss")) {
    moods.push("love", "romantic")
  }
  if (
    text.includes("sad") ||
    text.includes("cry") ||
    text.includes("tear") ||
    text.includes("broken") ||
    text.includes("hurt") ||
    text.includes("pain")
  ) {
    moods.push("melancholy")
  }
  if (
    text.includes("happy") ||
    text.includes("joy") ||
    text.includes("celebration") ||
    text.includes("party") ||
    text.includes("smile")
  ) {
    moods.push("joy", "upbeat", "celebration")
  }
  if (
    text.includes("dance") ||
    text.includes("beat") ||
    text.includes("energy") ||
    text.includes("pump") ||
    text.includes("rock")
  ) {
    moods.push("energetic", "upbeat")
  }
  if (
    text.includes("calm") ||
    text.includes("peace") ||
    text.includes("relax") ||
    text.includes("quiet") ||
    text.includes("soft")
  ) {
    moods.push("peaceful", "contemplative")
  }
  if (
    text.includes("motivat") ||
    text.includes("strong") ||
    text.includes("power") ||
    text.includes("fight") ||
    text.includes("win")
  ) {
    moods.push("motivational", "empowerment")
  }
  if (
    text.includes("memory") ||
    text.includes("remember") ||
    text.includes("past") ||
    text.includes("yesterday") ||
    text.includes("old")
  ) {
    moods.push("nostalgia", "contemplative")
  }
  if (text.includes("alone") || text.includes("lonely") || text.includes("empty") || text.includes("miss")) {
    moods.push("lonely", "melancholy")
  }

  // Genre-based mood assignment
  if (text.includes("blues")) moods.push("melancholy", "contemplative")
  if (text.includes("jazz")) moods.push("contemplative", "peaceful")
  if (text.includes("classical")) moods.push("peaceful", "epic")
  if (text.includes("metal") || text.includes("punk")) moods.push("energetic", "dramatic")
  if (text.includes("folk")) moods.push("contemplative", "nostalgia")
  if (text.includes("pop")) moods.push("upbeat", "joy")
  if (text.includes("rap") || text.includes("hip hop")) moods.push("energetic", "empowerment")

  // Default moods if none detected
  if (moods.length === 0) {
    if (text.includes("slow") || text.includes("ballad")) {
      moods.push("tender", "contemplative")
    } else if (text.includes("fast") || text.includes("up")) {
      moods.push("energetic", "upbeat")
    } else {
      moods.push("contemplative", "peaceful")
    }
  }

  return [...new Set(moods)] // Remove duplicates
}

// Function to get primary emotion from moods
const getPrimaryEmotion = (moods: string[]): string => {
  const emotionPriority = [
    "love",
    "joy",
    "energetic",
    "peaceful",
    "empowerment",
    "nostalgia",
    "contemplative",
    "melancholy",
  ]
  for (const emotion of emotionPriority) {
    if (moods.includes(emotion)) return emotion
  }
  return moods[0] || "contemplative"
}

// Function to fetch songs from a specific Saavn album
const fetchSongsFromAlbum = async (albumId: string): Promise<Song[]> => {
  try {
    const res = await fetch(`https://saavn.dev/api/albums?id=${encodeURIComponent(albumId)}`)
    const data = await res.json()
    if (data.success && data.data && data.data.length > 0 && data.data[0].songs) {
      const albumSongs = data.data[0].songs
      return albumSongs.map((saavnSong: any) => {
        const artist = saavnSong.artists?.primary?.map((a: any) => a.name).join(", ") || "Unknown Artist"
        const moods = assignMoodToSong(saavnSong.name, artist)
        const emotion = getPrimaryEmotion(moods)
        return {
          id: `saavn_${saavnSong.id}`,
          title: saavnSong.name,
          artist: artist,
          primaryArtists: artist,
          mood: moods,
          emotion: emotion,
          coverUrl:
            saavnSong.image?.find((img: any) => img.quality === "500x500")?.url ||
            saavnSong.image?.[saavnSong.image.length - 1]?.url ||
            "/placeholder.svg?height=300&width=300",
          audioUrl:
            saavnSong.downloadUrl?.find((url: any) => url.quality === "320kbps")?.url ||
            saavnSong.downloadUrl?.[saavnSong.downloadUrl.length - 1]?.url ||
            "",
          previewUrl: "",
          externalUrl: saavnSong.url || "",
          messages: [], // Will be populated later
          plays: saavnSong.playCount || Math.floor(Math.random() * 50000) + 5000,
          duration: saavnSong.duration || 180,
          source: "saavn",
        }
      })
    }
    return []
  } catch (error) {
    console.error(`Error fetching songs for album ${albumId}:`, error)
    return []
  }
}

// Function to fetch songs from Saavn API
const fetchSaavnSongs = async (query: string): Promise<Song[]> => {
  try {
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${query}`)
    const data = await res.json()
    if (data.success && data.data && data.data.results) {
      return data.data.results.map((saavnSong: any) => {
        const artist = saavnSong.artists?.primary?.map((a: any) => a.name).join(", ") || "Unknown Artist"
        const moods = assignMoodToSong(saavnSong.name, artist)
        const emotion = getPrimaryEmotion(moods)
        return {
          id: `saavn_${saavnSong.id}`,
          title: saavnSong.name,
          artist: artist,
          primaryArtists: artist,
          mood: moods,
          emotion: emotion,
          coverUrl:
            saavnSong.image?.find((img: any) => img.quality === "500x500")?.url ||
            saavnSong.image?.[saavnSong.image.length - 1]?.url ||
            "/placeholder.svg?height=300&width=300",
          audioUrl:
            saavnSong.downloadUrl?.find((url: any) => url.quality === "320kbps")?.url ||
            saavnSong.downloadUrl?.[saavnSong.downloadUrl.length - 1]?.url ||
            "",
          previewUrl: "",
          externalUrl: saavnSong.url || "",
          messages: [], // Will be populated later
          plays: saavnSong.playCount || Math.floor(Math.random() * 50000) + 5000,
          duration: saavnSong.duration || 180,
          source: "saavn",
        }
      })
    }
    return []
  } catch (error) {
    console.error("Error fetching Saavn songs:", error)
    return []
  }
}

// Function to fetch YouTube music using the YouTube Data API
const fetchYouTubeMusic = async (query: string): Promise<Song[]> => {
  if (!query.trim()) return []
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  if (!YOUTUBE_API_KEY) {
    console.warn("NEXT_PUBLIC_YOUTUBE_API_KEY is not set. YouTube search will not function.")
    return []
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=10`,
    )
    const data = await res.json()
    if (data.items && data.items.length > 0) {
      return data.items
        .filter((item: any) => item.id.videoId) // Ensure it's a video
        .map((item: any) => {
          const title = item.snippet.title
          const artist = item.snippet.channelTitle || "Unknown Artist"
          const moods = assignMoodToSong(title, artist)
          const emotion = getPrimaryEmotion(moods)
          const videoId = item.id.videoId
          return {
            id: `youtube_${videoId}`,
            title: title,
            artist: artist,
            primaryArtists: artist,
            mood: moods,
            emotion: emotion,
            coverUrl: item.snippet.thumbnails.high?.url || "/placeholder.svg?height=300&width=300",
            audioUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`, // Direct embed URL
            previewUrl: "", // Not directly available from search API
            externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
            messages: [],
            plays: Math.floor(Math.random() * 1000000) + 10000, // Placeholder, actual plays require another API call
            duration: 240, // Placeholder, actual duration requires another API call
            source: "youtube",
          }
        })
    }
    return []
  } catch (error) {
    console.error("Error fetching YouTube music:", error)
    return []
  }
}

// Function to fetch a song by ID
const fetchSongById = async (
  id: string,
  allMessages: AnonymousMessage[] = [], // Ensure this parameter is used
  songs: Song[] = [], // This parameter is not directly used for message population, but kept for consistency
): Promise<Song | null> => {
  if (id.startsWith("saavn_")) {
    try {
      const saavnId = id.replace("saavn_", "")
      const res = await fetch(`https://saavn.dev/api/songs?id=${saavnId}`)
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        const saavnSong = data.data[0]
        const artist = saavnSong.artists?.primary?.map((a: any) => a.name).join(", ") || "Unknown Artist"
        const moods = assignMoodToSong(saavnSong.name, artist)
        const emotion = getPrimaryEmotion(moods)
        return {
          id: `saavn_${saavnSong.id}`,
          title: saavnSong.name,
          artist: artist,
          primaryArtists: artist,
          mood: moods,
          emotion: emotion,
          coverUrl:
            saavnSong.image?.find((img: any) => img.quality === "500x500")?.url ||
            saavnSong.image?.[saavnSong.image.length - 1]?.url ||
            "/placeholder.svg?height=300&width=300",
          audioUrl:
            saavnSong.downloadUrl?.find((url: any) => url.quality === "320kbps")?.url ||
            saavnSong.downloadUrl?.[saavnSong.downloadUrl.length - 1]?.url ||
            "",
          previewUrl: "",
          externalUrl: saavnSong.url || "",
          messages: allMessages.filter((msg) => msg.songId === `saavn_${saavnSong.id}`), // Populate messages here
          plays: saavnSong.playCount || Math.floor(Math.random() * 50000) + 5000,
          duration: saavnSong.duration || 180,
          source: "saavn",
        }
      }
    } catch (error) {
      console.error("Error fetching Saavn song by ID:", error)
    }
  } else if (id.startsWith("youtube_")) {
    try {
      const videoId = id.replace("youtube_", "")
      const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      if (!YOUTUBE_API_KEY) {
        console.warn("NEXT_PUBLIC_YOUTUBE_API_KEY is not set. Cannot fetch YouTube song by ID.")
        return null
      }
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`,
      )
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        const title = item.snippet.title
        const artist = item.snippet.channelTitle || "Unknown Artist"
        const moods = assignMoodToSong(title, artist)
        const emotion = getPrimaryEmotion(moods)
        return {
          id: id,
          title: title,
          artist: artist,
          primaryArtists: artist,
          mood: moods,
          emotion: emotion,
          coverUrl: item.snippet.thumbnails.high?.url || "/placeholder.svg?height=300&width=300",
          audioUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`, // Direct embed URL
          previewUrl: "",
          externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
          messages: allMessages.filter((msg) => msg.songId === id), // Populate messages here
          plays: Math.floor(Math.random() * 1000000) + 10000, // Placeholder
          duration: 240, // Placeholder
          source: "youtube",
        }
      }
    } catch (error) {
      console.error("Error fetching YouTube song by ID:", error)
    }
  }
  return null
}

// Fallback songs when APIs fail
const getFallbackSongs = (query: string): Song[] => {
  const fallbackTracks = [
    {
      id: "fallback_1",
      title: "Tum Hi Ho",
      artist: "Arijit Singh",
      primaryArtists: "Arijit Singh",
      mood: ["love", "romantic", "tender"],
      emotion: "love",
      coverUrl: "/placeholder.svg?height=300&width=300",
      audioUrl: "",
      previewUrl: "",
      externalUrl: "",
      messages: [],
      plays: 2500000,
      duration: 262,
      source: "saavn" as const,
    },
    {
      id: "fallback_2",
      title: "Raabta",
      artist: "Arijit Singh",
      primaryArtists: "Arijit Singh",
      mood: ["love", "romantic", "tender"],
      emotion: "love",
      coverUrl: "/placeholder.svg?height=300&width=300",
      audioUrl: "",
      previewUrl: "",
      externalUrl: "",
      messages: [],
      plays: 1800000,
      duration: 245,
      source: "saavn" as const,
    },
    {
      id: "fallback_3",
      title: "Channa Mereya",
      artist: "Arijit Singh",
      primaryArtists: "Arijit Singh",
      mood: ["melancholy", "contemplative", "tender"],
      emotion: "melancholy",
      coverUrl: "/placeholder.svg?height=300&width=300",
      audioUrl: "",
      previewUrl: "",
      externalUrl: "",
      messages: [],
      plays: 3200000,
      duration: 258,
      source: "saavn" as const,
    },
    {
      id: "fallback_4",
      title: "Shape of You",
      artist: "Ed Sheeran",
      primaryArtists: "Ed Sheeran",
      mood: ["upbeat", "energetic", "love"],
      emotion: "upbeat",
      coverUrl: "/placeholder.svg?height=300&width=300",
      audioUrl: "",
      previewUrl: "",
      externalUrl: "",
      messages: [],
      plays: 5000000,
      duration: 233,
      source: "youtube" as const,
    },
    {
      id: "fallback_5",
      title: "Despacito",
      artist: "Luis Fonsi ft. Daddy Yankee",
      primaryArtists: "Luis Fonsi, Daddy Yankee",
      mood: ["upbeat", "energetic", "romantic"],
      emotion: "upbeat",
      coverUrl: "/placeholder.svg?height=300&width=300",
      audioUrl: "",
      previewUrl: "",
      externalUrl: "",
      messages: [],
      plays: 4500000,
      duration: 270,
      source: "youtube" as const,
    },
  ]
  // Filter fallback songs based on query if provided
  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase()
    return fallbackTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.artist.toLowerCase().includes(lowerQuery) ||
        track.mood.some((mood) => mood.toLowerCase().includes(lowerQuery)),
    )
  }
  return fallbackTracks
}

// Load initial songs from Saavn and YouTube APIs
const loadInitialSongs = async (): Promise<Song[]> => {
  try {
    const saavnQueries = [
      "bollywood hits",
      "arijit singh",
      "hindi songs",
      "romantic songs",
      "latest bollywood",
      "punjabi songs",
      "telugu songs", // Removed "tamil songs"
      "trending songs",
      "popular music",
    ]
    const youtubeQueries = [
      "popular english songs",
      "trending music videos",
      "top global hits",
      "lofi hip hop",
      "relaxing music",
    ]

    const saavnPromises = saavnQueries.map((query) => fetchSaavnSongs(query))
    const youtubePromises = youtubeQueries.map((query) => fetchYouTubeMusic(query))

    const [saavnResults, youtubeResults] = await Promise.all([Promise.all(saavnPromises), Promise.all(youtubePromises)])

    const allSongs: Song[] = []
    saavnResults.forEach((songs) => allSongs.push(...songs))
    youtubeResults.forEach((songs) => allSongs.push(...songs))

    // If no songs were fetched, use fallback
    if (allSongs.length === 0) {
      allSongs.push(...getFallbackSongs(""))
    }

    // Remove duplicates and shuffle
    const uniqueSongs = allSongs
      .filter(
        (song, index, self) => index === self.findIndex((s) => s.title === song.title && s.artist === song.artist),
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 150) // Increased limit for more songs

    return uniqueSongs
  } catch (error) {
    console.error("Error loading initial songs:", error)
    return getFallbackSongs("")
  }
}

export default function VibraApp() {
  // Add new state variables at the top of the `VibraApp` component, alongside other `useState` declarations:
  const [youTubePlayerOpen, setYouTubePlayerOpen] = useState(false)
  const [currentYouTubeVideoId, setCurrentYouTubeVideoId] = useState<string | null>(null)
  const [currentYouTubeSongTitle, setCurrentYouTubeSongTitle] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // Debounce search query
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [songs, setSongs] = useState<Song[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedSongForMessage, setSelectedSongForMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none")
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [allMessages, setAllMessages] = useState<AnonymousMessage[]>([])
  const [messageSuccess, setMessageSuccess] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const [showScrollToTop, setShowScrollToTop] = useState(false) // New state for scroll to top button

  // New: Ref for the header to measure its height
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  // Effect to measure header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    updateHeaderHeight() // Set initial height
    window.addEventListener("resize", updateHeaderHeight) // Update on resize
    // Also observe mutations in case content changes height without resize
    const observer = new MutationObserver(updateHeaderHeight)
    if (headerRef.current) {
      observer.observe(headerRef.current, { childList: true, subtree: true, attributes: true })
    }
    return () => {
      window.removeEventListener("resize", updateHeaderHeight)
      observer.disconnect()
    }
  }, [mobileMenuOpen]) // Re-run when mobile menu opens/closes

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
        })
        loadUserPlaylists(firebaseUser.uid)
      } else {
        setUser(null)
        setPlaylists([])
      }
    })
    return () => unsubscribe()
  }, [])

  // Combined data loading function
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // 1. First load songs
      const initialSongs = await loadInitialSongs()

      // 2. Then load messages
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(q)
      const initialMessages: AnonymousMessage[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        initialMessages.push({
          id: doc.id,
          content: data.content,
          emotion: data.emotion,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          likes: data.likes || 0,
          songId: data.songId,
          likedBy: data.likedBy || [],
        })
      })

      // 3. Associate messages with songs before setting state
      const songsWithMessages = initialSongs.map((song) => ({
        ...song,
        messages: initialMessages.filter((msg) => msg.songId === song.id),
      }))
      setSongs(songsWithMessages)
      setAllMessages(initialMessages)

      // 4. Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedMessages: AnonymousMessage[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          updatedMessages.push({
            id: doc.id,
            content: data.content,
            emotion: data.emotion,
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
            likes: data.likes || 0,
            songId: data.songId,
            likedBy: data.likedBy || [],
          })
        })
        // Update both messages and songs
        setAllMessages(updatedMessages)
        setSongs((prevSongs) =>
          prevSongs.map((song) => ({
            ...song,
            messages: updatedMessages.filter((msg) => msg.songId === song.id),
          })),
        )
      })
      return unsubscribe
    } catch (error) {
      console.error("Error loading initial data:", error)
      // Fallback to empty state
      setSongs(getFallbackSongs(""))
      setAllMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial data on component mount
  useEffect(() => {
    const unsubscribePromise = loadInitialData()
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) unsubscribe()
      })
    }
  }, [])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollToTop(true)
      } else {
        setShowScrollToTop(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // New: Centralized search function
  const performSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      loadInitialData() // Revert to initial songs if query is empty
      return
    }
    setIsLoading(true)
    try {
      const [saavnResults, youtubeResults] = await Promise.all([
        fetchSaavnSongs(queryToSearch),
        fetchYouTubeMusic(queryToSearch),
      ])
      // New: Search for albums and fetch their songs
      const albumResults = await fetchSaavnAlbums(queryToSearch)
      const albumSongPromises = albumResults.map((album) => fetchSongsFromAlbum(album.id))
      const songsFromAlbums = (await Promise.all(albumSongPromises)).flat()

      const combinedResults: Song[] = [...saavnResults, ...youtubeResults, ...songsFromAlbums]

      // Also search messages (this part remains the same)
      const messagesSnapshot = await getDocs(
        query(
          collection(db, "messages"),
          where("content", ">=", queryToSearch),
          where("content", "<=", queryToSearch + "\uf8ff"),
        ),
      )
      const songIdsFromMessages = [...new Set(messagesSnapshot.docs.map((d) => d.data().songId))]
      const songPromises = songIdsFromMessages.map((id) => fetchSongById(id, allMessages, songs))
      const newSongs = (await Promise.all(songPromises)).filter(Boolean)

      // Combine all results
      combinedResults.push(...(newSongs as Song[]))

      // Populate messages for all combined songs using the current allMessages state
      const songsWithPopulatedMessages = combinedResults.map((song) => ({
        ...song,
        messages: allMessages.filter((msg) => msg.songId === song.id),
      }))

      // Deduplicate
      const uniqueSongs = songsWithPopulatedMessages.filter(
        (song, index, self) => song && index === self.findIndex((s) => s && s.id === song.id),
      )

      setSongs(uniqueSongs.length > 0 ? uniqueSongs : getFallbackSongs(queryToSearch))
    } catch (error) {
      console.error("Error searching songs:", error)
      setSongs(getFallbackSongs(queryToSearch))
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to trigger search on debounced query change
  useEffect(() => {
    performSearch(debouncedSearchQuery)
  }, [debouncedSearchQuery]) // Added allMessages to dependency array to re-run search when messages update

  // Filter by mood from Saavn and YouTube APIs
  const handleMoodFilter = async (mood: string) => {
    setSelectedMood(mood)
    if (!mood) {
      loadInitialData()
      return
    }
    setIsLoading(true)
    try {
      const queries = moodQueries[mood as keyof typeof moodQueries] || [mood]
      const allPromises: Promise<Song[]>[] = []
      for (const query of queries.slice(0, 3)) {
        allPromises.push(fetchSaavnSongs(query))
        allPromises.push(fetchYouTubeMusic(query))
      }
      const resultsArrays = await Promise.all(allPromises)
      const allSongs: Song[] = resultsArrays.flat()

      // Populate messages for mood-filtered songs
      const songsWithPopulatedMessages = allSongs.map((song) => ({
        ...song,
        messages: allMessages.filter((msg) => msg.songId === song.id),
      }))

      if (songsWithPopulatedMessages.length === 0) {
        const fallbackSongs = getFallbackSongs("").filter((song) => song.mood.includes(mood))
        songsWithPopulatedMessages.push(...fallbackSongs)
      }

      const uniqueSongs = songsWithPopulatedMessages.filter(
        (song, index, self) => index === self.findIndex((s) => s.title === song.title && s.artist === song.artist),
      )
      setSongs(uniqueSongs)
    } catch (error) {
      console.error("Error filtering by mood:", error)
      const fallbackSongs = getFallbackSongs("").filter((song) => song.mood.includes(mood))
      setSongs(fallbackSongs)
    } finally {
      setIsLoading(false)
    }
  }

  // Firebase Authentication functions
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !signUpData.name ||
      !signUpData.email ||
      !signUpData.password ||
      signUpData.password !== signUpData.confirmPassword
    ) {
      alert("Please fill all fields correctly")
      return
    }
    setAuthLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password)
      console.log("User created:", userCredential.user)
      setShowSignUp(false)
      setSignUpData({ name: "", email: "", password: "", confirmPassword: "" })
    } catch (error: any) {
      console.error("Error signing up:", error)
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInData.email || !signInData.password) {
      alert("Please fill all fields")
      return
    }
    setAuthLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, signInData.email, signInData.password)
      console.log("User signed in:", userCredential.user)
      setShowSignIn(false)
      setSignInData({ email: "", password: "" })
    } catch (error: any) {
      console.error("Error signing in:", error)
      alert(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }
      setCurrentlyPlaying(null)
      setPlaylists([])
      setCurrentPlaylist(null)
      setYouTubePlayerOpen(false) // Close YouTube player on sign out
      setCurrentYouTubeVideoId(null)
      setCurrentYouTubeSongTitle(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Firebase Firestore functions
  const loadUserPlaylists = async (userId: string) => {
    try {
      const playlistsRef = collection(db, "playlists")
      const q = query(playlistsRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)
      const userPlaylists: Playlist[] = []
      querySnapshot.forEach((doc) => {
        userPlaylists.push({
          id: doc.id,
          firebaseId: doc.id,
          ...doc.data(),
        } as Playlist)
      })
      setPlaylists(userPlaylists)
    } catch (error) {
      console.error("Error loading playlists:", error)
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return
    try {
      const playlistData = {
        name: newPlaylistName,
        description: newPlaylistDescription,
        songs: [],
        createdAt: new Date().toISOString(),
        isPublic: false,
        userId: user.id,
      }
      const docRef = await addDoc(collection(db, "playlists"), playlistData)
      const newPlaylist: Playlist = {
        id: docRef.id,
        firebaseId: docRef.id,
        ...playlistData,
      }
      setPlaylists((prev) => [...prev, newPlaylist])
      setNewPlaylistName("")
      setNewPlaylistDescription("")
      setShowCreatePlaylist(false)
      toast.success(`Playlist "${newPlaylist.name}" created successfully`)
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error("Failed to create playlist")
    }
  }

  const addToPlaylist = async (song: Song, playlistId: string) => {
    try {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return
      // Check if song already exists in playlist
      if (playlist.songs.some((s) => s.id === song.id)) {
        toast.info(`"${song.title}" is already in "${playlist.name}"`)
        return
      }
      const updatedSongs = [...playlist.songs, song]
      if (playlist.firebaseId) {
        await updateDoc(doc(db, "playlists", playlist.firebaseId), {
          songs: updatedSongs,
        })
      }
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? { ...p, songs: updatedSongs } : p)))
      toast.success(`"${song.title}" added to "${playlist.name}"`)
    } catch (error) {
      console.error("Error adding to playlist:", error)
      toast.error("Failed to add song to playlist")
    }
  }

  const removeFromPlaylist = async (songId: string, playlistId: string) => {
    try {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return
      const updatedSongs = playlist.songs.filter((s) => s.id !== songId)
      if (playlist.firebaseId) {
        await updateDoc(doc(db, "playlists", playlist.firebaseId), {
          songs: updatedSongs,
        })
      }
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? { ...p, songs: updatedSongs } : p)))
      toast.success("Song removed from playlist")
    } catch (error) {
      console.error("Error removing from playlist:", error)
      toast.error("Failed to remove song from playlist")
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    try {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist || !playlist.firebaseId) return
      await deleteDoc(doc(db, "playlists", playlist.firebaseId))
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
      toast.success(`Playlist "${playlist.name}" deleted`)
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
    }
  }

  const addAnonymousMessage = async (songId: string) => {
    // Check if user is logged in
    if (!firebaseUser) {
      setShowSignIn(true) // Show sign-in dialog
      setSelectedSongForMessage(null) // Close the message dialog
      toast.info("Please sign in to share your message")
      return
    }
    if (!newMessage.trim()) return
    try {
      const emotion = analyzeSentiment(newMessage)
      const messageData = {
        content: newMessage,
        emotion,
        timestamp: serverTimestamp(),
        likes: 0,
        songId: songId,
        likedBy: [],
      }
      await addDoc(collection(db, "messages"), messageData)

      // The onSnapshot listener in loadInitialData will automatically update allMessages and songs.
      // No need to manually fetch and add the song here.
      setMessageSuccess(true)
      setNewMessage("")
      toast.success("Your anonymous message has been shared")
      setTimeout(() => {
        setSelectedSongForMessage(null)
        setMessageSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error adding message:", error)
      toast.error("Failed to send message. Please try again.")
    }
  }

  const likeMessage = async (messageId: string) => {
    if (!firebaseUser) {
      setShowSignIn(true)
      toast.info("Please sign in to like messages")
      return
    }
    try {
      const messageRef = doc(db, "messages", messageId)
      const message = allMessages.find((m) => m.id === messageId)
      if (!message) return

      // Check if user already liked this message
      if (message.likedBy.includes(firebaseUser.uid)) {
        toast.info("You've already liked this message")
        return
      }

      await updateDoc(messageRef, {
        likes: increment(1),
        likedBy: arrayUnion(firebaseUser.uid),
      })
      toast.success("Message liked")
    } catch (error) {
      console.error("Error liking message:", error)
      toast.error("Failed to like message")
    }
  }

  // Playlist playback functions
  const playPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length === 0) return
    setCurrentPlaylist(playlist)
    setCurrentSongIndex(0)
    const firstSong = playlist.songs[0]
    // Use togglePlayback to handle both audio and YouTube songs
    togglePlayback(firstSong)
    setShowPlaylists(false) // Close the playlist dialog after playing
  }

  const playSpecificSong = (song: Song) => {
    // This helper is now primarily used by handleSongEnd for repeatMode === "one"
    // It assumes an audio song. For general playback, use togglePlayback.
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }

    if (song.audioUrl && song.source === "saavn") {
      const audio = new Audio(song.audioUrl)
      audio.crossOrigin = "anonymous"

      // Set initial progress
      setCurrentTime(0)
      setPlaybackProgress(0)

      // Update progress while playing
      const updateProgress = () => {
        if (audio.duration) {
          const progress = (audio.currentTime / audio.duration) * 100
          setPlaybackProgress(progress)
          setCurrentTime(audio.currentTime)
        }
      }
      progressInterval.current = setInterval(updateProgress, 1000)
      audio.addEventListener("timeupdate", updateProgress)

      audio
        .play()
        .then(() => {
          setCurrentAudio(audio)
          setCurrentlyPlaying(song.id)
          // If playing from playlist, find the current index
          if (currentPlaylist) {
            const index = currentPlaylist.songs.findIndex((s) => s.id === song.id)
            if (index >= 0) {
              setCurrentSongIndex(index)
            }
          }
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
          toast.error("Failed to play audio")
          setCurrentlyPlaying(null)
        })

      audio.onended = () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
          progressInterval.current = null
        }
        audio.removeEventListener("timeupdate", updateProgress)
        handleSongEnd()
      }
    } else {
      toast.error("No audio URL available for this song")
      setCurrentlyPlaying(null)
    }
  }

  const handleSongEnd = () => {
    // This function is only called by HTMLAudioElement.onended, so it only applies to Saavn songs.
    const activeSong = songs.find((s) => s.id === currentlyPlaying) || currentPlaylist?.songs[currentSongIndex]
    if (!activeSong || activeSong.source !== "saavn" || !activeSong.audioUrl) {
      // Ensure it's an audio song that actually ended
      setCurrentlyPlaying(null)
      setCurrentAudio(null)
      return
    }

    if (repeatMode === "one") {
      playSpecificSong(activeSong) // Replay the same song
    } else if (currentPlaylist && currentPlaylist.songs.length > 0) {
      // Playlist playback logic for audio songs
      let nextIndex = currentSongIndex + 1
      if (nextIndex >= currentPlaylist.songs.length) {
        if (repeatMode === "all") {
          nextIndex = 0
        } else {
          setCurrentlyPlaying(null)
          setCurrentAudio(null)
          return
        }
      }
      setCurrentSongIndex(nextIndex)
      const nextSong = currentPlaylist.songs[nextIndex]
      // If the next song in playlist is YouTube, it will open the dialog.
      // If it's audio, it will play.
      togglePlayback(nextSong)
    } else {
      // Single audio song playback ended
      setCurrentlyPlaying(null)
      setCurrentAudio(null)
    }
  }

  const playNext = () => {
    const currentQueue = currentPlaylist ? currentPlaylist.songs : filteredSongs
    const currentIndex = currentQueue.findIndex((s) => s.id === currentlyPlaying)

    if (currentIndex === -1 || currentQueue.length === 0) {
      // If no song is currently playing or queue is empty, do nothing
      return
    }

    let nextIndex = currentIndex + 1
    if (nextIndex >= currentQueue.length) {
      if (repeatMode === "all") {
        nextIndex = 0
      } else {
        // End of queue, stop playback
        setCurrentlyPlaying(null)
        if (currentAudio) {
          currentAudio.pause()
          setCurrentAudio(null)
        }
        setYouTubePlayerOpen(false) // Close YouTube player if it was open
        return
      }
    }

    const nextSong = currentQueue[nextIndex]
    if (currentPlaylist) {
      setCurrentSongIndex(nextIndex) // Update index for playlist
    }
    togglePlayback(nextSong)
  }

  const playPrevious = () => {
    const currentQueue = currentPlaylist ? currentPlaylist.songs : filteredSongs
    const currentIndex = currentQueue.findIndex((s) => s.id === currentlyPlaying)

    if (currentIndex === -1 || currentQueue.length === 0) {
      return
    }

    // If more than 3 seconds into the song, restart it (only for audio)
    const activeSong = currentQueue[currentIndex]
    if (activeSong.source === "saavn" && currentAudio && currentAudio.currentTime > 3) {
      currentAudio.currentTime = 0
      return
    }

    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (repeatMode === "all") {
        prevIndex = currentQueue.length - 1
      } else {
        // At the beginning, just restart current song (if audio) or do nothing (if YouTube)
        if (activeSong.source === "saavn" && activeSong.audioUrl) {
          togglePlayback(activeSong) // Restart current audio song
        } else {
          // For YouTube or no audio, just stay on current or do nothing
          toast.info("Already at the beginning of the queue.")
        }
        return
      }
    }

    const prevSong = currentQueue[prevIndex]
    if (currentPlaylist) {
      setCurrentSongIndex(prevIndex) // Update index for playlist
    }
    togglePlayback(prevSong)
  }

  const toggleRepeat = () => {
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"]
    const currentIndex = modes.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setRepeatMode(modes[nextIndex])
    toast.success(`Repeat mode: ${modes[nextIndex]}`)
  }

  // Unified togglePlayback function to handle both Saavn audio and YouTube embeds
  const togglePlayback = (song: Song) => {
    // Always clear existing audio playback
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }

    // Always close YouTube player if a new song is selected or the same YouTube song is clicked to stop
    if (youTubePlayerOpen) {
      setYouTubePlayerOpen(false)
      setCurrentYouTubeVideoId(null)
      setCurrentYouTubeSongTitle(null)
    }

    // If the same song is clicked, and it was playing, stop it.
    if (currentlyPlaying === song.id) {
      setCurrentlyPlaying(null)
      toast.info(`Stopped: ${song.title}`)
      return // Stop playback
    }

    // Set the new song as currently playing
    setCurrentlyPlaying(song.id)

    if (song.source === "saavn" && song.audioUrl) {
      const audio = new Audio(song.audioUrl)
      audio.crossOrigin = "anonymous"
      setCurrentTime(0)
      setPlaybackProgress(0)

      const updateProgress = () => {
        if (audio.duration) {
          const progress = (audio.currentTime / audio.duration) * 100
          setPlaybackProgress(progress)
          setCurrentTime(audio.currentTime)
        }
      }
      progressInterval.current = setInterval(updateProgress, 1000)
      audio.addEventListener("timeupdate", updateProgress)

      audio
        .play()
        .then(() => {
          setCurrentAudio(audio)
          toast.info(`Playing: ${song.title}`)
          if (currentPlaylist) {
            const index = currentPlaylist.songs.findIndex((s) => s.id === song.id)
            if (index >= 0) {
              setCurrentSongIndex(index)
            }
          }
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
          toast.error("Failed to play audio")
          setCurrentlyPlaying(null) // Clear playing state on error
        })

      audio.onended = () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
          progressInterval.current = null
        }
        audio.removeEventListener("timeupdate", updateProgress)
        handleSongEnd()
      }
    } else if (song.source === "youtube" && song.audioUrl) {
      // For YouTube videos, open the dialog using the direct embed URL
      const videoIdMatch = song.audioUrl.match(/\/embed\/([^?]+)/)
      const videoId = videoIdMatch ? videoIdMatch[1] : null
      if (videoId) {
        setCurrentYouTubeVideoId(videoId)
        setCurrentYouTubeSongTitle(song.title)
        setYouTubePlayerOpen(true)
        toast.info(`Playing YouTube: ${song.title}`)
      } else {
        toast.error("Invalid YouTube video URL.")
        setCurrentlyPlaying(null)
      }
      setCurrentTime(0)
      setPlaybackProgress(0)
      if (currentPlaylist) {
        const index = currentPlaylist.songs.findIndex((s) => s.id === song.id)
        if (index >= 0) {
          setCurrentSongIndex(index)
        }
      }
    } else {
      toast.error("No playable source available for this song.")
      setCurrentlyPlaying(null) // Clear playing state if no source
    }

    if (currentPlaylist && !currentPlaylist.songs.some((s) => s.id === song.id)) {
      setCurrentPlaylist(null)
    }
  }

  // Open external link
  const openExternalLink = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    } else {
      toast.error("No external URL available for this song")
    }
  }

  // Sentiment analysis function
  const analyzeSentiment = (text: string): string => {
    const sadWords = ["sad", "hurt", "pain", "miss", "lonely", "cry", "broken", "lost", "empty", "depressed"]
    const happyWords = ["happy", "joy", "love", "excited", "amazing", "wonderful", "great", "awesome", "fantastic"]
    const anxiousWords = ["worried", "stress", "scared", "nervous", "anxious", "fear", "panic", "overwhelmed"]
    const angryWords = ["angry", "mad", "furious", "hate", "rage", "annoyed", "frustrated", "pissed"]

    const lowerText = text.toLowerCase()

    if (sadWords.some((word) => lowerText.includes(word))) return "melancholy"
    if (happyWords.some((word) => lowerText.includes(word))) return "joy"
    if (anxiousWords.some((word) => lowerText.includes(word))) return "anxiety"
    if (angryWords.some((word) => lowerText.includes(word))) return "empowerment"

    return "contemplative"
  }

  // Filter songs based on search and mood
  const filteredSongs = songs.filter((song) => {
    const lowerQuery = searchQuery.toLowerCase()
    const matchesSearch =
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.messages.some((message) => message.content.toLowerCase().includes(lowerQuery))
    const matchesMood = !selectedMood || song.mood.includes(selectedMood)
    return matchesSearch && matchesMood
  })

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get mood filter buttons
  const moodFilters = [{ key: "love", label: "Love & Romance", icon: "💕" }]

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-800/95 dark:border-gray-800"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-8 w-8 text-purple-600" />
                <Link href="/">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Vibra
                  </h1>
                </Link>
              </div>
              <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300 italic">
                Feel the music, speak the unspoken.
              </p>
            </div>
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Dialog open={showPlaylists} onOpenChange={setShowPlaylists}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ListMusic className="h-4 w-4" />
                        <span className="ml-2 hidden md:inline">Playlists ({playlists.length})</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full h-full max-w-full sm:max-w-4xl sm:max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>Your Playlists</span>
                          <Button onClick={() => setShowCreatePlaylist(true)} size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Create Playlist
                          </Button>
                        </DialogTitle>
                        <DialogDescription>Manage your custom playlists</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4 flex-1 overflow-y-auto">
                        {playlists.length === 0 ? (
                          <div className="text-center py-8">
                            <ListMusic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-300">
                              No playlists yet. Create your first playlist!
                            </p>
                          </div>
                        ) : (
                          playlists.map((playlist) => (
                            <Card key={playlist.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">{playlist.name}</h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm truncate">
                                    {playlist.description}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {playlist.songs.length} songs •{" "}
                                    {formatDuration(playlist.songs.reduce((total, song) => total + song.duration, 0))} •
                                    Created {new Date(playlist.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => {
                                      playPlaylist(playlist)
                                    }}
                                    disabled={playlist.songs.length === 0}
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                  >
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    Play
                                  </Button>
                                  <Button
                                    onClick={() => deletePlaylist(playlist.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {playlist.songs.length > 0 && (
                                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                  {playlist.songs.map((song, index) => (
                                    <div
                                      key={song.id}
                                      className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                        currentPlaylist?.id === playlist.id && currentSongIndex === index
                                          ? "bg-purple-50 dark:bg-purple-900/30"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        if (currentPlaylist?.id !== playlist.id) {
                                          setCurrentPlaylist(playlist)
                                        }
                                        setCurrentSongIndex(index)
                                        togglePlayback(song) // Changed from playSpecificSong
                                        setShowPlaylists(false) // Close dialog when a song from playlist is played
                                      }}
                                    >
                                      <img
                                        src={song.coverUrl || "/placeholder.svg"}
                                        alt={song.title}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                      <span className="flex-1 truncate">
                                        {song.title} - {song.artist}
                                      </span>
                                      <span className="text-xs text-gray-500">{formatDuration(song.duration)}</span>
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeFromPlaylist(song.id, playlist.id)
                                        }}
                                        variant="ghost"
                                        size="sm"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showProfile} onOpenChange={setShowProfile}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User className="h-4 w-4" />
                        <span className="ml-2 hidden md:inline">Profile</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Your Profile</DialogTitle>
                        <DialogDescription>Manage your account and preferences</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4 text-center">
                            <h4 className="text-2xl font-bold text-purple-600">{playlists.length}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Playlists Created</p>
                          </Card>
                          <Card className="p-4 text-center">
                            <h4 className="text-2xl font-bold text-pink-600">
                              {playlists.reduce((total, playlist) => total + playlist.songs.length, 0)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Songs Saved</p>
                          </Card>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold">Recent Playlists</h4>
                          {playlists.slice(0, 3).map((playlist) => (
                            <div
                              key={playlist.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div>
                                <h5 className="font-medium">{playlist.name}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {playlist.songs.length} songs
                                </p>
                              </div>
                              <Button
                                onClick={() => playPlaylist(playlist)}
                                disabled={playlist.songs.length === 0}
                                size="sm"
                                variant="outline"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleSignOut} variant="outline">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                    Welcome, {user.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <LogIn className="h-4 w-4" />
                        <span className="ml-2 hidden md:inline">Sign In</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sign In to Vibra</DialogTitle>
                        <DialogDescription>Sign in to create playlists and save your favorite songs</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                          <Input
                            type="email"
                            placeholder="Email"
                            value={signInData.email}
                            onChange={(e) =>
                              setSignInData({
                                ...signInData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={signInData.password}
                            onChange={(e) =>
                              setSignInData({
                                ...signInData,
                                password: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowSignIn(false)}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                            disabled={authLoading}
                          >
                            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                        <UserPlus className="h-4 w-4" />
                        <span className="ml-2 hidden md:inline">Sign Up</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Join Vibra</DialogTitle>
                        <DialogDescription>Create an account to unlock playlist features</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            value={signUpData.name}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Email"
                            value={signUpData.email}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={signUpData.password}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                password: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Confirm Password"
                            value={signUpData.confirmPassword}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                confirmPassword: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowSignUp(false)}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                            disabled={authLoading}
                          >
                            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="hidden sm:flex"
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                <span className="ml-2 hidden md:inline">{viewMode === "grid" ? "List View" : "Grid View"}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="ml-2 hidden md:inline">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 space-y-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowPlaylists(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <ListMusic className="h-4 w-4 mr-2" />
                  Playlists ({playlists.length})
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowProfile(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsDarkMode(!isDarkMode)
                    setMobileMenuOpen(false)
                  }}
                >
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                    setMobileMenuOpen(false)
                  }}
                >
                  {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
                  {viewMode === "grid" ? "List View" : "Grid View"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600"
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowSignIn(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => {
                    setShowSignUp(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsDarkMode(!isDarkMode)
                    setMobileMenuOpen(false)
                  }}
                >
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                    setMobileMenuOpen(false)
                  }}
                >
                  {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
                  {viewMode === "grid" ? "List View" : "Grid View"}
                </Button>
              </>
            )}
          </div>
        )}
      </header>
      {/* Now Playing Bar */}
      {currentlyPlaying &&
        headerHeight > 0 && ( // Only show if something is marked as playing and header height is known
          <div
            className="sticky z-40 bg-white/95 backdrop-blur dark:bg-gray-800/95 border-b dark:border-gray-800 px-4 py-2"
            style={{ top: `${headerHeight}px` }} // Dynamically set top based on header height
          >
            <div className="container mx-auto">
              <div className="flex items-center justify-between gap-4">
                {/* Song Info */}
                {(() => {
                  const activeSong = currentPlaylist
                    ? currentPlaylist.songs[currentSongIndex]
                    : songs.find((s) => s.id === currentlyPlaying)
                  if (!activeSong) return null // Should not happen if currentlyPlaying is set correctly
                  return (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={activeSong.coverUrl || "/placeholder.svg"}
                        alt={`${activeSong.title} cover`}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{activeSong.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{activeSong.artist}</p>
                      </div>
                    </div>
                  )
                })()}
                {/* Player Controls */}
                {(() => {
                  const activeSong = currentPlaylist
                    ? currentPlaylist.songs[currentSongIndex]
                    : songs.find((s) => s.id === currentlyPlaying)
                  if (!activeSong) return null
                  const isYouTube = activeSong.source === "youtube"
                  const isAudioPlaying = currentAudio && !currentAudio.paused
                  return (
                    <div className="flex-1 max-w-md">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={playPrevious} disabled={isYouTube}>
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isYouTube) {
                              setYouTubePlayerOpen(!youTubePlayerOpen) // Toggle YouTube dialog
                            } else {
                              if (currentAudio) {
                                if (isAudioPlaying) {
                                  currentAudio.pause()
                                } else {
                                  currentAudio.play()
                                }
                              }
                            }
                          }}
                        >
                          {isYouTube ? (
                            youTubePlayerOpen ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )
                          ) : isAudioPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={playNext} disabled={isYouTube}>
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mt-1">
                        {isYouTube ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-full text-center">
                            YouTube content
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                              {formatDuration(currentTime)}
                            </span>
                            <div className="flex-1 relative group">
                              <Progress
                                value={playbackProgress}
                                className="h-2 cursor-pointer"
                                onClick={(e) => {
                                  if (currentAudio) {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const percent = (e.clientX - rect.left) / rect.width
                                    const newTime = percent * currentAudio.duration
                                    currentAudio.currentTime = newTime
                                    setCurrentTime(newTime)
                                    setPlaybackProgress(percent * 100)
                                  }
                                }}
                              />
                              <div
                                className="absolute top-0 left-0 h-2 bg-purple-600 rounded-l-full"
                                style={{ width: `${playbackProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                              {formatDuration(activeSong.duration || 0)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}
                {/* Additional Controls */}
                {(() => {
                  const activeSong = currentPlaylist
                    ? currentPlaylist.songs[currentSongIndex]
                    : songs.find((s) => s.id === currentlyPlaying)
                  if (!activeSong) return null
                  const isYouTube = activeSong.source === "youtube"
                  return (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleRepeat}
                        className={repeatMode !== "none" ? "text-purple-600" : ""}
                        disabled={isYouTube} // Disable repeat for YouTube
                      >
                        <Repeat className="h-4 w-4" />
                        {repeatMode === "one" && (
                          <span className="absolute -top-1 -right-1 text-xs bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            1
                          </span>
                        )}
                      </Button>
                      {currentPlaylist && (
                        <span className="text-xs text-gray-600 dark:text-gray-300 hidden sm:inline">
                          {currentSongIndex + 1} / {currentPlaylist.songs.length}
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      <main className="flex-1 overflow-auto">
        {" "}
        {/* Main content area, takes remaining space and scrolls */}
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                Where your emotions meet their soundtrack
              </h2>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="italic">
                "Every song tells a story, every story finds its song - especially those love and romance melodies that
                speak to the heart"
              </span>
              <Heart className="h-4 w-4 text-pink-500" />
            </div>
          </div>
          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by song name, artist, or emotion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-full border-2 focus:border-purple-500"
                />
              </div>
              <Button
                onClick={() => performSearch(searchQuery)} // Explicit search on button click
                className="h-14 px-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>
            {/* Mood Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              <Button
                variant={selectedMood === "" ? "default" : "outline"}
                size="sm"
                onClick={() => handleMoodFilter("")}
                className={selectedMood === "" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
              >
                <Filter className="h-4 w-4 mr-1" />
                All Moods
              </Button>
              {moodFilters.map((mood) => (
                <Button
                  key={mood.key}
                  variant={selectedMood === mood.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMoodFilter(mood.key)}
                  className={
                    selectedMood === mood.key
                      ? "bg-gradient-to-r from-purple-600 to-pink-600"
                      : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }
                >
                  <span className="mr-1">{mood.icon}</span>
                  {mood.label}
                </Button>
              ))}
            </div>
          </div>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Searching songs...</h3>
              <p className="text-gray-600 dark:text-gray-300">Finding tracks </p>
            </div>
          )}
          {/* Songs Grid/List */}
          {!isLoading && (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4 max-w-4xl mx-auto"
              }`}
            >
              {filteredSongs.map((song) => (
                <Card
                  key={song.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800/90 border-0 shadow-md overflow-hidden"
                >
                  <CardContent className="p-0">
                    {viewMode === "grid" ? (
                      // Grid View
                      <div className="space-y-4">
                        <div className="relative overflow-hidden">
                          <img
                            src={song.coverUrl || "/placeholder.svg"}
                            alt={`${song.title} cover`}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=300"
                            }}
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {song.externalUrl && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={() => openExternalLink(song.externalUrl)}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Button
                              size="lg"
                              className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/50"
                              onClick={() => togglePlayback(song)}
                              disabled={!song.audioUrl && song.source !== "youtube"} // Disable if no audio URL and not YouTube
                            >
                              {currentlyPlaying === song.id ? (
                                <Pause className="h-6 w-6 text-white" />
                              ) : (
                                <Play className="h-6 w-6 text-white" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-purple-600 transition-colors line-clamp-1">
                              {song.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-1">{song.artist}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {song.mood.slice(0, 3).map((mood) => (
                              <Badge
                                key={mood}
                                variant="secondary"
                                className={`text-xs ${
                                  moodColors[mood as keyof typeof moodColors] || "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {mood}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Volume2 className="h-4 w-4" />
                              <span>{song.plays.toLocaleString()} plays</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{song.messages.length} messages</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Replace the existing "Add to Playlist" button with this dropdown menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-48">
                                <DropdownMenuItem
                                  onClick={() => togglePlayback(song)}
                                  disabled={!song.audioUrl && song.source !== "youtube"}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Play Now
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Implement play next functionality
                                    toast.info("Added to queue (play next)")
                                  }}
                                >
                                  <SkipForward className="h-4 w-4 mr-2" />
                                  Play Next
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Implement add to queue functionality
                                    toast.info("Added to queue")
                                  }}
                                >
                                  <ListMusic className="h-4 w-4 mr-2" />
                                  Add to Queue
                                </DropdownMenuItem>
                                {song.audioUrl &&
                                  song.source !== "youtube" && ( // Disable download for YouTube
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // Implement download functionality
                                        const link = document.createElement("a")
                                        link.href = song.audioUrl
                                        link.download = `${song.title} - ${song.artist}.mp3`
                                        link.click()
                                        toast.success("Download started")
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    const messageToShare =
                                      song.messages.length > 0
                                        ? `Anonymous message: "${song.messages[0].content}"`
                                        : "No anonymous messages yet."
                                    const shareText = `Check out this song on Vibra: "${song.title}" by ${song.artist}. ${messageToShare} Listen here: ${window.location.origin}`
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: `Vibra: ${song.title}`,
                                          text: shareText,
                                          url: window.location.origin,
                                        })
                                        .then(() => toast.success("Shared successfully!"))
                                        .catch((error) => {
                                          console.error("Error sharing:", error)
                                          toast.error("Failed to share.")
                                        })
                                    } else {
                                      navigator.clipboard
                                        .writeText(shareText)
                                        .then(() => toast.success("Song and message copied to clipboard!"))
                                        .catch((error) => {
                                          console.error("Error copying:", error)
                                          toast.error("Failed to copy to clipboard.")
                                        })
                                    }
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                {user && (
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add to Playlist
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      {playlists.length > 0 ? (
                                        playlists.map((playlist) => (
                                          <DropdownMenuItem
                                            key={playlist.id}
                                            onClick={() => addToPlaylist(song, playlist.id)}
                                          >
                                            {playlist.name}
                                          </DropdownMenuItem>
                                        ))
                                      ) : (
                                        <DropdownMenuItem disabled>No playlists</DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => setShowCreatePlaylist(true)}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create New
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-transparent">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Read ({song.messages.length})
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Music className="h-5 w-5" />
                                    {song.title} - {song.artist}
                                  </DialogTitle>
                                  <DialogDescription>Anonymous messages from the community</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {song.messages.length > 0 ? (
                                    song.messages.map((message) => (
                                      <div key={message.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-gray-900 dark:text-gray-100 mb-2">{message.content}</p>
                                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="secondary"
                                              className={`text-xs ${
                                                moodColors[message.emotion as keyof typeof moodColors] ||
                                                "bg-gray-100 text-gray-800"
                                              }`}
                                            >
                                              {message.emotion}
                                            </Badge>
                                            <span>
                                              {message.timestamp instanceof Date
                                                ? message.timestamp.toLocaleDateString()
                                                : new Date(message.timestamp).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => likeMessage(message.id)}
                                            className={`flex items-center gap-1 ${
                                              firebaseUser && message.likedBy.includes(firebaseUser.uid)
                                                ? "text-red-500"
                                                : "hover:text-red-500"
                                            }`}
                                          >
                                            <Heart className="h-4 w-4" />
                                            <span>{message.likes}</span>
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8">
                                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                      <p className="text-gray-600 dark:text-gray-300">
                                        No messages yet. Be the first to share your thoughts!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={selectedSongForMessage === song.id}
                              onOpenChange={(open) => {
                                if (!firebaseUser && open) {
                                  setShowSignIn(true)
                                  toast.info("Please sign in to share your message")
                                  return
                                }
                                setSelectedSongForMessage(open ? song.id : null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  onClick={(e) => {
                                    if (!firebaseUser) {
                                      e.preventDefault()
                                      setShowSignIn(true)
                                      toast.info("Please sign in to share your message")
                                    }
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Send
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Share Your Anonymous Message</DialogTitle>
                                  <DialogDescription>
                                    Express what this song means to you. Your message will be completely anonymous.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {messageSuccess ? (
                                    <div className="text-center py-8">
                                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg
                                          className="w-8 h-8 text-green-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </div>
                                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Message Sent Successfully!
                                      </h3>
                                      <p className="text-gray-600 dark:text-gray-300">
                                        Your anonymous message has been shared with the community.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <Textarea
                                        placeholder="What does this song make you feel? Share your story, your unsent message, or what this moment means to you..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="min-h-[120px]"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setSelectedSongForMessage(null)}>
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => addAnonymousMessage(song.id)}
                                          disabled={!newMessage.trim()}
                                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                          Send Message
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <img
                          src={song.coverUrl || "/placeholder.svg"}
                          alt={`${song.title} cover`}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=300&width=300"
                          }}
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                              {song.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-1">{song.artist}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {song.mood.slice(0, 3).map((mood) => (
                              <Badge
                                key={mood}
                                variant="secondary"
                                className={`text-xs ${
                                  moodColors[mood as keyof typeof moodColors] || "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {mood}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Volume2 className="h-4 w-4" />
                              <span>{song.plays.toLocaleString()} plays</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{song.messages.length} messages</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => togglePlayback(song)}
                            disabled={!song.audioUrl && song.source !== "youtube"}
                          >
                            {currentlyPlaying === song.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          {song.externalUrl && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={() => openExternalLink(song.externalUrl)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* No Songs Found */}
          {!isLoading && filteredSongs.length === 0 && (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No songs found</h3>
              <p className="text-gray-600 dark:text-gray-300">Try Again </p>
            </div>
          )}
        </div>
      </main>
      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>Name and describe your new playlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Playlist Name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
            </div>
            <div>
              <Textarea
                placeholder="Playlist Description"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreatePlaylist(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createPlaylist} className="bg-gradient-to-r from-purple-600 to-pink-600">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add the YouTube Player Dialog component just before the `Toaster` component at the end of the return statement: */}
      <Dialog open={youTubePlayerOpen} onOpenChange={setYouTubePlayerOpen}>
        <DialogContent className="max-w-3xl w-full aspect-video p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-semibold line-clamp-1">{currentYouTubeSongTitle}</DialogTitle>
            <DialogDescription>Playing from YouTube</DialogDescription>
          </DialogHeader>
          {currentYouTubeVideoId && (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentYouTubeVideoId}?autoplay=1&rel=0`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentYouTubeSongTitle || "YouTube Video"}
              className="flex-1"
            ></iframe>
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors position="top-center" />
      <footer className="bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-pink-200">Vibra</h2>
            <span className="text-xs text-pink-300">Feel it. Share it. Play it.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-pink-200">with 🤍 by Anjali</span>
            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/anjalisinggh_12/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:text-white transition-colors"
              >
                <FaInstagram className="w-3 h-3" />
              </a>
              <a
                href="https://x.com/anjalisinggh12/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:text-blue-300 transition-colors"
              >
                <FaTwitter className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/Anjalisinggh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:text-white transition-colors"
              >
                <FaGithub className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      {showScrollToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-opacity duration-300 z-50"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
