"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Music,
  Heart,
  MessageCircle,
  PlayCircle,
  Calendar,
  Mail,
  Edit,
  Save,
  X,
  ListMusic,
  Headphones,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth"
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface AppUser {
  id: string
  name: string
  email: string
  bio?: string
  favoriteGenres?: string[]
  joinedAt?: string
}

interface Playlist {
  id: string
  name: string
  description: string
  songs: any[]
  createdAt: string
  isPublic: boolean
  userId: string
}

interface UserStats {
  playlistsCount: number
  songsCount: number
  messagesCount: number
  joinedDays: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    playlistsCount: 0,
    songsCount: 0,
    messagesCount: 0,
    joinedDays: 0,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    favoriteGenres: [] as string[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: AppUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          joinedAt: firebaseUser.metadata.creationTime,
        }
        setUser(userData)
        setEditForm({
          name: userData.name,
          bio: userData.bio || "",
          favoriteGenres: userData.favoriteGenres || [],
        })
        await loadUserData(firebaseUser.uid)
      } else {
        router.push("/")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadUserData = async (userId: string) => {
    try {
      // Load playlists
      const playlistsRef = collection(db, "playlists")
      const playlistsQuery = query(playlistsRef, where("userId", "==", userId))
      const playlistsSnapshot = await getDocs(playlistsQuery)

      const userPlaylists: Playlist[] = []
      let totalSongs = 0

      playlistsSnapshot.forEach((doc) => {
        const playlist = { id: doc.id, ...doc.data() } as Playlist
        userPlaylists.push(playlist)
        totalSongs += playlist.songs?.length || 0
      })

      setPlaylists(userPlaylists)

      // Load messages count
      const messagesRef = collection(db, "messages")
      const messagesSnapshot = await getDocs(messagesRef)
      const messagesCount = messagesSnapshot.size

      // Calculate joined days
      const joinedDate = auth.currentUser?.metadata.creationTime
      const joinedDays = joinedDate
        ? Math.floor((Date.now() - new Date(joinedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setUserStats({
        playlistsCount: userPlaylists.length,
        songsCount: totalSongs,
        messagesCount,
        joinedDays,
      })
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !auth.currentUser) return

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: editForm.name,
      })

      // Update user document in Firestore
      const userDocRef = doc(db, "users", user.id)
      await updateDoc(userDocRef, {
        name: editForm.name,
        bio: editForm.bio,
        favoriteGenres: editForm.favoriteGenres,
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        // If document doesn't exist, create it
        await addDoc(collection(db, "users"), {
          userId: user.id,
          name: editForm.name,
          bio: editForm.bio,
          favoriteGenres: editForm.favoriteGenres,
          createdAt: serverTimestamp(),
        })
      })

      setUser({
        ...user,
        name: editForm.name,
        bio: editForm.bio,
        favoriteGenres: editForm.favoriteGenres,
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const addGenre = (genre: string) => {
    if (genre && !editForm.favoriteGenres.includes(genre)) {
      setEditForm({
        ...editForm,
        favoriteGenres: [...editForm.favoriteGenres, genre],
      })
    }
  }

  const removeGenre = (genre: string) => {
    setEditForm({
      ...editForm,
      favoriteGenres: editForm.favoriteGenres.filter((g) => g !== genre),
    })
  }

  const popularGenres = [
    "Bollywood",
    "Pop",
    "Rock",
    "Hip Hop",
    "Classical",
    "Jazz",
    "Electronic",
    "Country",
    "R&B",
    "Indie",
    "Punjabi",
    "Tamil",
    "Telugu",
    "Bengali",
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Headphones className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Please sign in to view your profile.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Music
              </Button>
              <div className="flex items-center gap-2">
                <Headphones className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Your Profile
                </h1>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Your name"
                    />
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Favorite Genres</label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editForm.favoriteGenres.map((genre) => (
                          <Badge
                            key={genre}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => removeGenre(genre)}
                          >
                            {genre} <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {popularGenres
                          .filter((genre) => !editForm.favoriteGenres.includes(genre))
                          .map((genre) => (
                            <Badge
                              key={genre}
                              variant="outline"
                              className="cursor-pointer hover:bg-purple-50"
                              onClick={() => addGenre(genre)}
                            >
                              + {genre}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm" className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h2>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                    </div>
                    {user.bio && <p className="text-gray-700 dark:text-gray-300 text-sm">{user.bio}</p>}
                    {user.favoriteGenres && user.favoriteGenres.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Favorite Genres</h4>
                        <div className="flex flex-wrap gap-1">
                          {user.favoriteGenres.map((genre) => (
                            <Badge key={genre} variant="secondary">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {userStats.joinedDays} days ago</span>
                    </div>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListMusic className="h-5 w-5 text-purple-600" />
                    <span>Playlists</span>
                  </div>
                  <span className="font-bold text-purple-600">{userStats.playlistsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-pink-600" />
                    <span>Songs Saved</span>
                  </div>
                  <span className="font-bold text-pink-600">{userStats.songsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <span>Messages Shared</span>
                  </div>
                  <span className="font-bold text-blue-600">{userStats.messagesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span>Days Active</span>
                  </div>
                  <span className="font-bold text-red-600">{userStats.joinedDays}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Playlists */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListMusic className="h-5 w-5" />
                  Your Playlists ({playlists.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <ListMusic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No playlists yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Start creating playlists to organize your favorite songs
                    </p>
                    <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-purple-600 to-pink-600">
                      Discover Music
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {playlists.map((playlist) => (
                      <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">
                                {playlist.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                {playlist.description || "No description"}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" disabled={playlist.songs.length === 0}>
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>{playlist.songs.length} songs</span>
                            <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                          </div>
                          {playlist.songs.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {playlist.songs.slice(0, 2).map((song, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                                >
                                  <Music className="h-3 w-3" />
                                  <span className="truncate">
                                    {song.title} - {song.artist}
                                  </span>
                                </div>
                              ))}
                              {playlist.songs.length > 2 && (
                                <p className="text-xs text-gray-500">+{playlist.songs.length - 2} more songs</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
