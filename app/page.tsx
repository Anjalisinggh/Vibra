"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Sparkles,
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
} from "lucide-react"

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
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
// Make sure your "@/lib/firebase" exports 'auth' created with getAuth(app) and 'db'

// Add the router import at the top:
import { useRouter } from "next/navigation"

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
  source: "saavn"
  primaryArtists?: string
}

interface AnonymousMessage {
  id: string
  content: string
  emotion: string
  timestamp: any
  likes: number
  songId: string
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

// Mood-based search queries for different emotions
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

export default function VibraApp() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [songs, setSongs] = useState<Song[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedSongForMessage, setSelectedSongForMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  // Playlist states
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none")
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")

  // Authentication states
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [authLoading, setAuthLoading] = useState(false)

  // Messages state
  const [allMessages, setAllMessages] = useState<AnonymousMessage[]>([])

  // Add success state and auto-close functionality by adding these state variables at the top:
  const [messageSuccess, setMessageSuccess] = useState(false)

  // Add router initialization in the component:
  const router = useRouter()

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

  // Load messages from Firebase
  useEffect(() => {
    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: AnonymousMessage[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        } as AnonymousMessage)
      })
      setAllMessages(messages)

      // Update songs with messages
      setSongs((prevSongs) =>
        prevSongs.map((song) => ({
          ...song,
          messages: messages.filter((msg) => msg.songId === song.id),
        })),
      )
    })

    return () => unsubscribe()
  }, [])

  // Load initial songs on component mount
  useEffect(() => {
    loadInitialSongs()
  }, [])

  // Function to assign mood based on song title and artist
  const assignMoodToSong = (title: string, artist: string): string[] => {
    const lowerTitle = title.toLowerCase()
    const lowerArtist = artist.toLowerCase()
    const text = `${lowerTitle} ${lowerArtist}`

    const moods: string[] = []

    // Enhanced mood detection based on keywords
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

  // Function to fetch songs from Saavn API
  const fetchSaavnSongs = async (query: string): Promise<Song[]> => {
    try {
      const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (data.success && data.data && data.data.results) {
        return data.data.results.slice(0, 30).map((saavnSong: any) => {
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
            messages: [],
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

  // Load initial songs from Saavn API
  const loadInitialSongs = async () => {
    setIsLoading(true)
    try {
      const queries = [
        "bollywood hits",
        "arijit singh",
        "hindi songs",
        "romantic songs",
        "latest bollywood",
        "punjabi songs",
        "tamil songs",
        "telugu songs",
        "trending songs",
        "popular music",
      ]

      const allSongs: Song[] = []

      // Fetch from Saavn API
      const fetchPromises = queries.map(async (query) => {
        try {
          const songs = await fetchSaavnSongs(query)
          return songs
        } catch (error) {
          console.error(`Failed to fetch songs for query "${query}":`, error)
          return []
        }
      })

      const results = await Promise.all(fetchPromises)
      results.forEach((songs) => allSongs.push(...songs))

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
        .slice(0, 100)

      setSongs(uniqueSongs)
    } catch (error) {
      console.error("Error loading initial songs:", error)
      setSongs(getFallbackSongs(""))
    } finally {
      setIsLoading(false)
    }
  }

  // Search songs from Saavn API
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInitialSongs()
      return
    }

    setIsLoading(true)
    try {
      const results = await fetchSaavnSongs(searchQuery)

      // If no results, use fallback
      if (results.length === 0) {
        setSongs(getFallbackSongs(searchQuery))
      } else {
        setSongs(results)
      }
    } catch (error) {
      console.error("Error searching songs:", error)
      setSongs(getFallbackSongs(searchQuery))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter by mood
  const handleMoodFilter = async (mood: string) => {
    setSelectedMood(mood)

    if (!mood) {
      loadInitialSongs()
      return
    }

    setIsLoading(true)
    try {
      const queries = moodQueries[mood as keyof typeof moodQueries] || [mood]
      const allSongs: Song[] = []

      for (const query of queries.slice(0, 3)) {
        const songs = await fetchSaavnSongs(query)
        allSongs.push(...songs)
      }

      if (allSongs.length === 0) {
        const fallbackSongs = getFallbackSongs("").filter((song) => song.mood.includes(mood))
        allSongs.push(...fallbackSongs)
      }

      const uniqueSongs = allSongs.filter(
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
    } catch (error) {
      console.error("Error creating playlist:", error)
    }
  }

  const addToPlaylist = async (song: Song, playlistId: string) => {
    try {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return

      const updatedSongs = [...playlist.songs.filter((s) => s.id !== song.id), song]

      if (playlist.firebaseId) {
        await updateDoc(doc(db, "playlists", playlist.firebaseId), {
          songs: updatedSongs,
        })
      }

      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? { ...p, songs: updatedSongs } : p)))
    } catch (error) {
      console.error("Error adding to playlist:", error)
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
    } catch (error) {
      console.error("Error removing from playlist:", error)
    }
  }

  // Add the following updated addAnonymousMessage function:
  const addAnonymousMessage = async (songId: string) => {
    if (!newMessage.trim()) return

    try {
      const emotion = analyzeSentiment(newMessage)
      const messageData = {
        content: newMessage,
        emotion,
        timestamp: serverTimestamp(),
        likes: 0,
        songId: songId,
      }

      await addDoc(collection(db, "messages"), messageData)

      setMessageSuccess(true)
      setNewMessage("")

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSelectedSongForMessage(null)
        setMessageSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error adding message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const likeMessage = async (songId: string, messageId: string) => {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        likes: increment(1),
      })
    } catch (error) {
      console.error("Error liking message:", error)
    }
  }

  // Playlist playback functions
  const playPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length === 0) return

    setCurrentPlaylist(playlist)
    setCurrentSongIndex(0)
    const firstSong = playlist.songs[0]
    playSpecificSong(firstSong)
  }

  const playSpecificSong = (song: Song) => {
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }

    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl)
      audio.crossOrigin = "anonymous"
      audio
        .play()
        .then(() => {
          setCurrentAudio(audio)
          setCurrentlyPlaying(song.id)
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
        })

      audio.onended = () => {
        handleSongEnd()
      }
    }
  }

  const handleSongEnd = () => {
    if (repeatMode === "one" && currentPlaylist) {
      const currentSong = currentPlaylist.songs[currentSongIndex]
      playSpecificSong(currentSong)
    } else if (currentPlaylist && currentPlaylist.songs.length > 0) {
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
      playSpecificSong(nextSong)
    } else {
      setCurrentlyPlaying(null)
      setCurrentAudio(null)
    }
  }

  const playNext = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return

    let nextIndex = currentSongIndex + 1
    if (nextIndex >= currentPlaylist.songs.length) {
      nextIndex = 0
    }

    setCurrentSongIndex(nextIndex)
    const nextSong = currentPlaylist.songs[nextIndex]
    playSpecificSong(nextSong)
  }

  const playPrevious = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return

    let prevIndex = currentSongIndex - 1
    if (prevIndex < 0) {
      prevIndex = currentPlaylist.songs.length - 1
    }

    setCurrentSongIndex(prevIndex)
    const prevSong = currentPlaylist.songs[prevIndex]
    playSpecificSong(prevSong)
  }

  const toggleRepeat = () => {
    const modes: ("none" | "one" | "all")[] = ["none", "one", "all"]
    const currentIndex = modes.indexOf(repeatMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setRepeatMode(modes[nextIndex])
  }

  // Play/Pause audio
  const togglePlayback = (song: Song) => {
    if (currentlyPlaying === song.id) {
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
      }
      setCurrentlyPlaying(null)
    } else {
      playSpecificSong(song)
    }
  }

  // Open external link
  const openExternalLink = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
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
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMood = !selectedMood || song.mood.includes(selectedMood)
    return matchesSearch && matchesMood
  })

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get mood filter buttons
  const moodFilters = [
    { key: "love", label: "Love & Romance", icon: "💕" },
    { key: "joy", label: "Joy & Happiness", icon: "😊" },
   
    { key: "energetic", label: "Energetic", icon: "⚡" },
    { key: "peaceful", label: "Peaceful", icon: "🕊️" },
    { key: "nostalgia", label: "Nostalgia", icon: "🌅" },
    { key: "empowerment", label: "Empowerment", icon: "💪" },
    { key: "contemplative", label: "Contemplative", icon: "🤔" },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-800/95 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Headphones className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Vibra
                </h1>
              </div>
              <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300 italic">
                Feel the music, speak the unspoken.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Dialog open={showPlaylists} onOpenChange={setShowPlaylists}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ListMusic className="h-4 w-4" />
                        <span className="ml-2 hidden md:inline">Playlists ({playlists.length})</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                      <div className="space-y-4 mt-4">
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
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{playlist.name}</h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm">{playlist.description}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {playlist.songs.length} songs • Created{" "}
                                    {new Date(playlist.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => playPlaylist(playlist)}
                                    disabled={playlist.songs.length === 0}
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                  >
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    Play
                                  </Button>
                                </div>
                              </div>
                              {playlist.songs.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {playlist.songs.slice(0, 3).map((song) => (
                                    <div key={song.id} className="flex items-center gap-2 text-sm">
                                      <img
                                        src={song.coverUrl || "/placeholder.svg"}
                                        alt={song.title}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                      <span className="flex-1 truncate">
                                        {song.title} - {song.artist}
                                      </span>
                                      <Button
                                        onClick={() => removeFromPlaylist(song.id, playlist.id)}
                                        variant="ghost"
                                        size="sm"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  {playlist.songs.length > 3 && (
                                    <p className="text-xs text-gray-500">+{playlist.songs.length - 3} more songs</p>
                                  )}
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
                            onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={signInData.password}
                            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
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
                            onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Email"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="password"
                            placeholder="Confirm Password"
                            value={signUpData.confirmPassword}
                            onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
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
      </header>

      {/* Now Playing Bar */}
      {currentlyPlaying && currentPlaylist && (
        <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur dark:bg-gray-800/95 border-b dark:border-gray-800 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentPlaylist.songs[currentSongIndex]?.coverUrl || "/placeholder.svg"}
                alt="Now playing"
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm">{currentPlaylist.songs[currentSongIndex]?.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {currentPlaylist.songs[currentSongIndex]?.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={playPrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => togglePlayback(currentPlaylist.songs[currentSongIndex])}>
                {currentlyPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={playNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleRepeat}>
                <Repeat
                  className={`h-4 w-4 ${
                    repeatMode !== "none" ? "text-purple-600" : ""
                  } ${repeatMode === "one" ? "relative" : ""}`}
                />
                {repeatMode === "one" && (
                  <span className="absolute -top-1 -right-1 text-xs bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    1
                  </span>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              {currentSongIndex + 1} / {currentPlaylist.songs.length} • {currentPlaylist.name}
            </div>
          </div>
        </div>
      )}

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
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 h-14 text-lg rounded-full border-2 focus:border-purple-500"
              />
            </div>
            <Button
              onClick={handleSearch}
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
            <p className="text-gray-600 dark:text-gray-300">Finding tracks from Saavn</p>
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
                            disabled={!song.audioUrl}
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
                              className={`text-xs ${moodColors[mood as keyof typeof moodColors] || "bg-gray-100 text-gray-800"}`}
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

                        {/* In the songs grid/list section, replace the current message buttons with separate Read and Send buttons: */}
                        <div className="flex gap-2">
                          {user && playlists.length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-transparent">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add to Playlist</DialogTitle>
                                  <DialogDescription>Choose a playlist to add this song to</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 mt-4">
                                  {playlists.map((playlist) => (
                                    <Button
                                      key={playlist.id}
                                      variant="outline"
                                      onClick={() => addToPlaylist(song, playlist.id)}
                                      className="w-full justify-start"
                                    >
                                      {playlist.name}
                                    </Button>
                                  ))}
                                  {playlists.length === 0 && (
                                    <p className="text-center text-gray-500">No playlists created yet.</p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

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
                                {song.messages.length === 0 ? (
                                  <div className="text-center py-8">
                                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-300">
                                      No messages yet. Be the first to share your thoughts!
                                    </p>
                                  </div>
                                ) : (
                                  song.messages.map((message) => (
                                    <div key={message.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <p className="text-gray-900 dark:text-gray-100 mb-2">{message.content}</p>
                                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="secondary"
                                            className={`text-xs ${moodColors[message.emotion as keyof typeof moodColors] || "bg-gray-100 text-gray-800"}`}
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
                                          onClick={() => likeMessage(song.id, message.id)}
                                          className="flex items-center gap-1 hover:text-red-500"
                                        >
                                          <Heart className="h-4 w-4" />
                                          <span>{message.likes}</span>
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={selectedSongForMessage === song.id}
                            onOpenChange={(open) => setSelectedSongForMessage(open ? song.id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                        className="w-20 h-20 object-cover rounded-lg"
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
                              className={`text-xs ${moodColors[mood as keyof typeof moodColors] || "bg-gray-100 text-gray-800"}`}
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
                          disabled={!song.audioUrl}
                        >
                          {currentlyPlaying === song.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
            <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or mood filter.</p>
          </div>
        )}
      </div>

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
    </div>
  )
}
