import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PostLike {
  id: string;
  username?: string;
  timestamp?: string;
  videoUri?: number | string;
  location?: string;
  difficulty?: string;
  color?: string;
  avatar?: number | string;
  createdAt?: number;
  description?: string;
  annotations?: LimbAnnotation[];
}

// Hardcoded default posts that don't require AsyncStorage
const DEFAULT_POSTS: PostLike[] = [
  {
    id: '1',
    username: 'Sarah Martinez',
    timestamp: '2 hours ago',
    videoUri: require('@/assets/videos/post1.mp4'),
    avatar: require('@/assets/images/snoopy4.png'),
    location: 'Penn Campus Recreation',
    difficulty: 'V5',
    color: 'Blue',
    annotations: [],
  },
  {
    id: '2',
    username: 'Alex Chen',
    timestamp: '5 hours ago',
    videoUri: require('@/assets/videos/post2.mov'),
    avatar: require('@/assets/images/snoopy2.webp'),
    location: 'Tufas Boulder Lounge',
    difficulty: 'V3',
    color: 'Yellow',
    annotations: [],
  },
  {
    id: '3',
    username: 'Jordan Lee',
    timestamp: '1 day ago',
    videoUri: require('@/assets/videos/post1.mp4'),
    avatar: require('@/assets/images/snoopy3.jpeg'),
    location: 'Penn Campus Recreation',
    difficulty: 'V9',
    color: 'Purple',
    annotations: [],
  },
  {
    id: '4',
    username: 'Maya Patel',
    timestamp: '3 days ago',
    videoUri: require('@/assets/videos/post2.mov'),
    avatar: require('@/assets/images/snoopy1.jpg'),
    location: 'Movement Callowhill',
    difficulty: 'V4',
    color: 'White',
    annotations: [],
  },
];

const LIMB_LABELS: Record<string, string> = {
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
};

const LIMB_COLORS: Record<string, string> = {
  left_hand: '#FF6B6B',
  right_hand: '#4ECDC4',
  left_foot: '#FFE66D',
  right_foot: '#95E1D3',
};

export default function FullVideoView() {
  const params = useLocalSearchParams();
  const id = params?.id ? String(params.id) : undefined;
  const router = useRouter();
  const [post, setPost] = useState<PostLike | null>(null);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  const videoRef = useRef<any>(null);
  const scrubberRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(0); // UI scrubber position in seconds
  const [actualVideoTime, setActualVideoTime] = useState(0); // Actual video playback position in seconds
  const [paused, setPaused] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [thumbnails, setThumbnails] = useState<{ time: number; uri: string }[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const scrubberLayoutRef = useRef({ x: 0, width: 0 });
  const seekTimeoutRef = useRef<number | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Load the post
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) {
          if (mounted) setLoading(false);
          return;
        }

        // First check hardcoded default posts
        const defaultPost = DEFAULT_POSTS.find((p) => String(p.id) === String(id));
        if (defaultPost) {
          if (mounted) {
            setPost(defaultPost);
            setLoading(false);
          }
          return;
        }

        // If not found in defaults, check AsyncStorage for user posts
        const climbPostsJson = await AsyncStorage.getItem('climb_posts');
        if (climbPostsJson) {
          const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);
          const found = climbPosts.find((p) => String(p.id) === String(id));
          if (found) {
            const postOwner = found.ownerUsername || 'Unknown';
            
            let postOwnerAvatar: string | undefined = undefined;
            try {
              const ownerProfileJson = await AsyncStorage.getItem(`user_profile_${postOwner}`);
              if (ownerProfileJson) {
                const ownerProfile = JSON.parse(ownerProfileJson);
                postOwnerAvatar = ownerProfile.profilePicture;
              }
            } catch (e) {
              console.error('Error loading post owner profile:', e);
            }
            
            if (mounted) {
              setProfilePicture(postOwnerAvatar);
              setPost({
                id: found.id,
                username: postOwner,
                createdAt: found.createdAt,
                videoUri: found.videoUri,
                location: found.metadata?.location,
                difficulty: found.metadata?.difficulty,
                color: found.metadata?.color,
                description: found.description,
                avatar: postOwnerAvatar,
                annotations: found.annotations || [],
              });
            }
          }
        }
      } catch (e) {
        console.error('Error loading post', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Generate thumbnails when video duration is known
  useEffect(() => {
    if (videoDuration > 0 && thumbnails.length === 0 && !isGeneratingThumbnails && post?.videoUri) {
      generateThumbnails();
    }
  }, [videoDuration, post]);

  // Cleanup seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);

  // Pause video when screen loses focus (user navigates away)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when the screen is unfocused (navigating away)
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
        setPaused(true);
      };
    }, [])
  );

  const generateThumbnails = async () => {
    if (!post?.videoUri) return;

    setIsGeneratingThumbnails(true);
    const newThumbnails: { time: number; uri: string }[] = [];

    let uri: string | undefined;
    if (typeof post.videoUri === 'number') {
      const asset = Asset.fromModule(post.videoUri as any);
      try {
        await asset.downloadAsync();
      } catch (e) {
        // ignore download errors
      }
      uri = asset.localUri || asset.uri;
    } else if (typeof post.videoUri === 'string') {
      uri = post.videoUri as string;
    }

    if (!uri) {
      setIsGeneratingThumbnails(false);
      return;
    }

    // Generate thumbnails every 2 seconds
    const interval = 2;
    const count = Math.ceil(videoDuration / interval);

    try {
      for (let i = 0; i <= count; i++) {
        const time = i * interval;
        if (time > videoDuration) break;

        try {
          const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, {
            time: time * 1000,
            quality: 0.5,
          });
          newThumbnails.push({ time, uri: thumbUri });
        } catch (e) {
          console.log(`Failed to generate thumbnail at ${time}s`);
        }
      }
      setThumbnails(newThumbnails);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    // Always update actualVideoTime to track true video position
    if (status && typeof status.positionMillis === 'number') {
      const videoTime = status.positionMillis / 1000;
      setActualVideoTime(videoTime);

      // Only sync currentTime when not dragging
      if (!isDraggingScrubber) {
        setCurrentTime(videoTime);
      }
    }
    if (status && typeof status.durationMillis === 'number') {
      const duration = status.durationMillis / 1000;
      if (duration !== videoDuration) {
        setVideoDuration(duration);
      }
    }
  };

  const handleScrubberTouch = (locationX: number) => {
    if (scrubberLayoutRef.current.width > 0 && videoDuration > 0) {
      const clampedX = Math.max(0, Math.min(locationX, scrubberLayoutRef.current.width));
      const percentage = clampedX / scrubberLayoutRef.current.width;
      const newTime = percentage * videoDuration;

      setCurrentTime(newTime);

      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      seekTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.setPositionAsync(newTime * 1000);
          setPaused(true);
        }
      }, 20);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_400Regular' }}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins_400Regular' }}>Post not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Video Player */}
        <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
              style={styles.video}
              shouldPlay={!paused}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
              isLooping
            />

            {/* Annotation Overlay */}
            {showAnnotations && post.annotations && post.annotations.length > 0 && (
              <View style={styles.annotationOverlay} pointerEvents="none">
                {post.annotations
                  .filter((a) => Math.abs((a.timestamp || 0) - actualVideoTime) < 0.3)
                  .map((annotation) => (
                    <View
                      key={annotation.id}
                      style={[
                        styles.annotationMarker,
                        {
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          backgroundColor: LIMB_COLORS[annotation.limbType],
                        },
                      ]}
                    />
                  ))}
              </View>
            )}
          </View>
        </View>

        {/* Play/Pause Button */}
        <View style={styles.videoControls}>
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={() => {
              if (paused) {
                videoRef.current?.playAsync();
                setPaused(false);
              } else {
                videoRef.current?.pauseAsync();
                setPaused(true);
              }
            }}
          >
            <MaterialIcons
              name={paused ? 'play-arrow' : 'pause'}
              size={28}
              color="#2C3D50"
            />
          </TouchableOpacity>
        </View>

        {/* Scrubber with Thumbnails */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={styles.scrubberContainer}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              scrubberLayoutRef.current = { x, width };
            }}
          >
            <ScrollView
              ref={scrubberRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              style={styles.scrubberScroll}
            >
              <View style={styles.thumbnailStrip}>
                {thumbnails.length > 0 ? (
                  thumbnails.map((thumbnail, index) => (
                    <Image
                      key={index}
                      source={{ uri: thumbnail.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ))
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Text style={styles.thumbnailPlaceholderText}>
                      {isGeneratingThumbnails ? 'Loading frames...' : 'Drag to scrub'}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Draggable overlay */}
            <View
              style={styles.scrubberOverlay}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={(evt) => {
                setIsDraggingScrubber(true);
                if (videoRef.current && !paused) {
                  videoRef.current.pauseAsync();
                  setPaused(true);
                }
                handleScrubberTouch(evt.nativeEvent.locationX);
              }}
              onResponderMove={(evt) => {
                if (isDraggingScrubber) {
                  handleScrubberTouch(evt.nativeEvent.locationX);
                }
              }}
              onResponderRelease={() => {
                setIsDraggingScrubber(false);
              }}
              onResponderTerminate={() => {
                setIsDraggingScrubber(false);
              }}
            >
              {/* Annotation markers on scrubber */}
              {showAnnotations && post.annotations && post.annotations.length > 0 && videoDuration > 0 && (
                <>
                  {Array.from(new Set(post.annotations.map(a => a.timestamp))).map((timestamp) => {
                    if (!timestamp) return null;
                    const position = (timestamp / videoDuration) * 100;
                    return (
                      <View
                        key={`scrubber-marker-${timestamp}`}
                        style={[
                          styles.scrubberAnnotationMarker,
                          { left: `${position}%` }
                        ]}
                        pointerEvents="none"
                      />
                    );
                  })}
                </>
              )}

              {/* Progress indicator */}
              <View
                style={[
                  styles.scrubberProgress,
                  { width: videoDuration > 0 ? `${(currentTime / videoDuration) * 100}%` : '0%' }
                ]}
                pointerEvents="none"
              />

              {/* Playhead */}
              <View
                style={[
                  styles.playhead,
                  { left: videoDuration > 0 ? `${(currentTime / videoDuration) * 100}%` : '0%' }
                ]}
                pointerEvents="none"
              />
            </View>

            {/* Time display */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)}
              </Text>
              <Text style={styles.durationText}>
                {' / '}{formatTime(videoDuration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle Annotations Button */}
        {post.annotations && post.annotations.length > 0 && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAnnotations(!showAnnotations)}
            >
              <MaterialIcons
                name={showAnnotations ? 'visibility' : 'visibility-off'}
                size={20}
                color="#2C3D50"
              />
              <Text style={styles.toggleButtonText}>
                {showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Annotations Display */}
        {showAnnotations && post.annotations && post.annotations.length > 0 && (
          <View style={styles.annotationsDisplay}>
            {post.annotations
              .filter((a) => Math.abs((a.timestamp || 0) - actualVideoTime) < 0.3)
              .map((annotation) => (
                <View key={annotation.id} style={styles.annotationCard}>
                  <View style={styles.annotationCardHeader}>
                    <View
                      style={[
                        styles.limbIndicator,
                        { backgroundColor: LIMB_COLORS[annotation.limbType] }
                      ]}
                    />
                    <Text style={styles.limbTypeText}>
                      {LIMB_LABELS[annotation.limbType]}
                    </Text>
                  </View>
                  {annotation.comment && (
                    <Text style={styles.annotationCommentText}>
                      {annotation.comment}
                    </Text>
                  )}
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    height: 80,
    backgroundColor: '#2C3D50',
    paddingTop: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: { padding: 12, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  videoWrapper: {
    width: '100%',
    height: 350,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  annotationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  annotationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    marginTop: -12,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playPauseButton: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scrubberContainer: {
    marginTop: 8,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  scrubberScroll: {
    flex: 1,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    height: 80,
  },
  thumbnailImage: {
    width: 100,
    height: 80,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 300,
  },
  thumbnailPlaceholderText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  scrubberOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrubberProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 61, 80, 0.2)',
  },
  playhead: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 3,
    backgroundColor: '#000000',
    marginLeft: -1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 10,
    zIndex: 10,
  },
  scrubberAnnotationMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FF6B35',
    marginLeft: -1,
    zIndex: 5,
  },
  timeDisplay: {
    position: 'absolute',
    top: 4,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  durationText: {
    color: '#CCC',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  toggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  annotationsDisplay: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  annotationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  annotationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  limbIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  limbTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  annotationCommentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
});
