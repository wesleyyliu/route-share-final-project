import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface PostLike {
  id: string;
  username?: string;
  timestamp?: string;
  videoUri?: number | string;
  location?: string;
  difficulty?: string;
  color?: string;
  avatar?: number | string;
  annotations?: LimbAnnotation[];
  createdAt?: number;
  description?: string;
}

const LIMB_LABELS: Record<string, string> = {
  left_hand: 'Left hand',
  right_hand: 'Right hand',
  left_foot: 'Left foot',
  right_foot: 'Right foot',
};

// Hardcoded default posts
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

// Climbing icon SVG component
const ClimbingIcon = ({ size = 40, color = '#4CAF50' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 543.702 543.759">
    <G transform="translate(-35.14898,-25.367676)">
      <Path
        d="m 307.88531,378.24075 c -4.81658,1.77753 -10.2066,2.80966 -15.71127,2.80966 -5.90607,0 -11.75479,-0.68808 -17.1448,-2.23626 L 214.1337,518.78217 c -5.56201,12.90161 -20.87192,17.25946 -34.23224,9.74786 -13.30298,-7.5116 -19.61043,-23.96832 -13.87639,-36.8699 l 74.65726,-171.21854 95.18513,0 0,-15.99799 48.16596,-22.42013 c 12.6149,-6.13541 29.01425,4.35788 32.34002,17.7182 l 23.62424,94.72641 c 3.38309,13.41766 -4.81659,27.00735 -18.23425,30.3331 -13.47501,3.38309 -27.12204,-4.81659 -30.44776,-18.23425 l -15.02322,-60.37949 -68.40714,32.05331 z"
        fill={color}
        fillRule="nonzero"
      />
      <Path
        d="M 351.75076,280.13126 C 456.05301,228.41017 496.47803,51.228218 496.47803,36.434379 l -14.33512,0 C 476.7529,73.361633 431.97003,221.24261 351.75076,264.13327 l 0,15.99799 z"
        fill={color}
        fillRule="nonzero"
      />
      <Path
        d="m 159.31624,241.36911 c 5.44734,8.54373 16.45671,12.32819 26.20457,8.31436 l 55.16152,-21.61734 0,76.49216 95.18513,0 0,-88.59099 85.32257,-136.527587 c 6.25009,-9.977234 3.38309,-23.165535 -6.70883,-29.587662 -9.97723,-6.250111 -23.16553,-3.325737 -28.78491,6.422127 l -72.4783,115.999702 -43.63608,0.11469 c -2.80969,0 -5.61936,0.45872 -8.42905,1.5482 l -75.40268,29.58764 -38.87681,-58.88862 c -6.3648,-9.86255 -19.61043,-12.78691 -29.58767,-6.42214 -9.97723,6.42214 -12.84426,19.72512 -6.47947,29.70237 l 48.51001,73.45309 z"
        fill={color}
        fillRule="nonzero"
      />
      <Path
        d="m 281.73807,164.53293 c 20.9866,0 38.01672,-16.91544 38.01672,-37.8447 0,-20.92925 -17.03012,-37.959364 -38.01672,-37.959364 -20.92926,0 -37.95935,17.030114 -37.95935,37.959364 0,20.92926 17.03009,37.8447 37.95935,37.8447"
        fill={color}
        fillRule="nonzero"
      />
      <Path
        d="m 335.86746,551.81024 0,-170.75982 -15.99798,7.45425 0,163.30557 15.99798,0 z"
        fill={color}
        fillRule="nonzero"
      />
    </G>
  </Svg>
);

export default function InteractiveView() {
  const params = useLocalSearchParams();
  const id = params?.id ? String(params.id) : undefined;
  const router = useRouter();
  const [post, setPost] = useState<PostLike | null>(null);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  const interactiveVideoRef = useRef<any>(null);
  const [visibleHoldTimestamp, setVisibleHoldTimestamp] = useState<number | null>(null);
  const [selectedLimb, setSelectedLimb] = useState<string | null>(null);
  const [holdScrollPosition, setHoldScrollPosition] = useState(0);
  const holdListScrollRef = useRef<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

  const HOLD_COLORS = ['#3B82F6', '#FBBF24', '#10B981', '#EF4444', '#8B5CF6'];

  const getHoldColor = (timestamp?: number) => {
    if (!timestamp) return HOLD_COLORS[0];
    const annotations = post?.annotations || [];
    const uniqueTimestamps = Array.from(new Set(annotations.map(a => a.timestamp))).sort((x: number, y: number) => x - y) as number[];
    const idx = uniqueTimestamps.indexOf(timestamp);
    if (idx < 0) return HOLD_COLORS[0];
    return HOLD_COLORS[idx % HOLD_COLORS.length];
  };

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
        let userProfilePicture: string | undefined = undefined;
        let userProfileUsername: string = 'You';
        try {
          const profileJson = await AsyncStorage.getItem('user_profile');
          if (profileJson) {
            const profile = JSON.parse(profileJson);
            userProfilePicture = profile.profilePicture;
            userProfileUsername = profile.username || 'You';
            if (mounted) {
              setProfilePicture(profile.profilePicture);
            }
          }
        } catch (e) {
          console.error('Error loading profile:', e);
        }

        const climbPostsJson = await AsyncStorage.getItem('climb_posts');
        if (climbPostsJson) {
          const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);
          const found = climbPosts.find((p) => String(p.id) === String(id));
          if (found) {
            if (mounted) {
              setPost({
                id: found.id,
                username: userProfileUsername,
                createdAt: found.createdAt,
                videoUri: found.videoUri,
                location: found.metadata?.location,
                difficulty: found.metadata?.difficulty,
                color: found.metadata?.color,
                description: found.description,
                avatar: userProfilePicture,
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

  // Auto-seek video to selected hold timestamp
  useEffect(() => {
    if (!interactiveVideoRef.current || !post) return;

    const seekToTimestamp = async () => {
      try {
        const annotations = post.annotations || [];
        const timestamps = Array.from(new Set(annotations.map(a => a.timestamp))).sort((x: number, y: number) => x - y) as number[];

        const timestampToSeek = visibleHoldTimestamp !== null
          ? visibleHoldTimestamp
          : (timestamps.length > 0 ? timestamps[0] : 0);

        await interactiveVideoRef.current?.setPositionAsync(Math.floor(timestampToSeek * 1000));
        await interactiveVideoRef.current?.pauseAsync();
      } catch (e) {
        console.log('Error seeking video:', e);
      }
    };

    const timer = setTimeout(() => {
      seekToTimestamp();
    }, 100);

    return () => clearTimeout(timer);
  }, [visibleHoldTimestamp, post]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Post not found.</Text>
        </View>
      </View>
    );
  }

  const annotations = post.annotations || [];
  const uniqueTimestamps = Array.from(new Set(annotations.map(a => a.timestamp))).sort((x: number, y: number) => x - y) as number[];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/post/[id]', params: { id: id! } })} style={styles.backIcon} activeOpacity={0.7}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Video with annotations */}
        <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ width: '100%', height: 350, borderRadius: 12, overflow: 'hidden' }}>
            <Video
              ref={interactiveVideoRef}
              source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
              style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
            />

            <View style={styles.interactiveOverlay} pointerEvents="none">
              {(
                (visibleHoldTimestamp != null
                  ? annotations.filter((a) => a.timestamp === visibleHoldTimestamp)
                  : annotations
                )
              ).map((a) => {
                const isSelected = selectedLimb === a.limbType;
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.interactiveDot,
                      {
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        backgroundColor: getHoldColor(a.timestamp),
                        borderWidth: isSelected ? 4 : 2,
                        width: isSelected ? 22 : 18,
                        height: isSelected ? 22 : 18,
                        borderRadius: isSelected ? 11 : 9,
                        marginLeft: isSelected ? -11 : -9,
                        marginTop: isSelected ? -11 : -9,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Hold selector and Limb buttons */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 16 }}>
          {/* Hold selector with overflow control */}
          <View style={{ width: 100, height: 200, alignItems: 'center', overflow: 'hidden' }}>
            {uniqueTimestamps.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const newPosition = Math.max(0, holdScrollPosition - 54);
                  holdListScrollRef.current?.scrollTo({ y: newPosition, animated: true });
                  setHoldScrollPosition(newPosition);
                }}
                style={{ padding: 6, marginBottom: 4 }}
                disabled={holdScrollPosition <= 0}
              >
                <Text style={{ fontSize: 18, color: holdScrollPosition > 0 ? '#2C3D50' : '#E0E0E0', fontWeight: 'bold' }}>▲</Text>
              </TouchableOpacity>
            )}

            {/* Scrollable hold list */}
            <ScrollView
              ref={holdListScrollRef}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 140, width: '100%' }}
              contentContainerStyle={{ alignItems: 'center' }}
              scrollEventThrottle={16}
              onScroll={(event) => {
                setHoldScrollPosition(event.nativeEvent.contentOffset.y);
              }}
            >
              {uniqueTimestamps.map((ts, idx) => (
                <TouchableOpacity
                  key={`hold-picker-${ts}-${idx}`}
                  onPress={() => {
                    if (visibleHoldTimestamp === ts) {
                      // Deselect - show all annotations
                      setVisibleHoldTimestamp(null);
                      setSelectedLimb(null);
                    } else {
                      // Select this hold
                      setVisibleHoldTimestamp(ts);
                      const annotationsForHold = annotations.filter(a => a.timestamp === ts);
                      const limbWithComment = annotationsForHold.find(a => a.comment && a.comment.trim() !== '');
                      setSelectedLimb(limbWithComment ? limbWithComment.limbType : null);
                    }
                  }}
                  style={{
                    width: 90,
                    paddingVertical: 8,
                    paddingHorizontal: 6,
                    marginBottom: 6,
                    borderRadius: 8,
                    backgroundColor: visibleHoldTimestamp === ts ? '#2C3D50' : '#F5F5F5',
                    borderWidth: visibleHoldTimestamp === ts ? 2 : 1,
                    borderColor: visibleHoldTimestamp === ts ? '#2C3D50' : '#E5E5E5',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: visibleHoldTimestamp === ts ? '#FFF' : '#666', textAlign: 'center' }}>
                    hold {idx + 1}
                  </Text>
                  <Text style={{ fontSize: 10, color: visibleHoldTimestamp === ts ? '#E0E0E0' : '#999', textAlign: 'center', marginTop: 2 }}>
                    {formatTime(ts)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {uniqueTimestamps.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const itemHeight = 54;
                  const maxScroll = Math.max(0, (uniqueTimestamps.length - 3) * itemHeight);
                  const newPosition = Math.min(maxScroll, holdScrollPosition + 54);
                  holdListScrollRef.current?.scrollTo({ y: newPosition, animated: true });
                  setHoldScrollPosition(newPosition);
                }}
                style={{ padding: 6, marginTop: 4 }}
                disabled={holdScrollPosition >= Math.max(0, (uniqueTimestamps.length - 3) * 54)}
              >
                <Text style={{ fontSize: 18, color: holdScrollPosition < Math.max(0, (uniqueTimestamps.length - 3) * 54) ? '#2C3D50' : '#E0E0E0', fontWeight: 'bold' }}>▼</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right side: Limb buttons in 2x2 grid */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['left_hand', 'right_hand'].map((key) => {
                  const annotationsForSelectedHold = visibleHoldTimestamp != null
                    ? annotations.filter(a => a.timestamp === visibleHoldTimestamp && a.limbType === key)
                    : annotations.filter(a => a.limbType === key);
                  const hasComment = annotationsForSelectedHold.some(a => a.comment && a.comment.trim() !== '');
                  const isViewingAllHolds = visibleHoldTimestamp === null;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.limbChip,
                        {
                          backgroundColor: isViewingAllHolds ? '#9CA3AF' : (selectedLimb === key ? (hasComment ? getHoldColor(visibleHoldTimestamp || uniqueTimestamps[0]) : '#E5E7EB') : (hasComment ? '#2C3D50' : '#9CA3AF')),
                          opacity: isViewingAllHolds ? 0.5 : (hasComment ? 1 : 0.5),
                        },
                      ]}
                      onPress={() => !isViewingAllHolds && hasComment && setSelectedLimb(key)}
                      disabled={isViewingAllHolds || !hasComment}
                    >
                      <Text style={{ color: isViewingAllHolds ? '#BDBDBD' : (selectedLimb === key ? (hasComment ? '#fff' : '#999') : (hasComment ? '#fff' : '#BDBDBD')), fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                        {LIMB_LABELS[key]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['left_foot', 'right_foot'].map((key) => {
                  const annotationsForSelectedHold = visibleHoldTimestamp != null
                    ? annotations.filter(a => a.timestamp === visibleHoldTimestamp && a.limbType === key)
                    : annotations.filter(a => a.limbType === key);
                  const hasComment = annotationsForSelectedHold.some(a => a.comment && a.comment.trim() !== '');
                  const isViewingAllHolds = visibleHoldTimestamp === null;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.limbChip,
                        {
                          backgroundColor: isViewingAllHolds ? '#9CA3AF' : (selectedLimb === key ? (hasComment ? getHoldColor(visibleHoldTimestamp || uniqueTimestamps[0]) : '#E5E7EB') : (hasComment ? '#2C3D50' : '#9CA3AF')),
                          opacity: isViewingAllHolds ? 0.5 : (hasComment ? 1 : 0.5),
                        },
                      ]}
                      onPress={() => !isViewingAllHolds && hasComment && setSelectedLimb(key)}
                      disabled={isViewingAllHolds || !hasComment}
                    >
                      <Text style={{ color: isViewingAllHolds ? '#BDBDBD' : (selectedLimb === key ? (hasComment ? '#fff' : '#999') : (hasComment ? '#fff' : '#BDBDBD')), fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                        {LIMB_LABELS[key]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Annotation comment section */}
        {selectedLimb && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 16 }}>
            {(() => {
              const commentsForSelected = visibleHoldTimestamp != null
                ? annotations.filter(a => a.timestamp === visibleHoldTimestamp && a.limbType === selectedLimb)
                : annotations.filter(a => a.limbType === selectedLimb);
              const holdColor = getHoldColor(visibleHoldTimestamp || uniqueTimestamps[0]);
              return commentsForSelected.length > 0 ? (
                <View style={{ padding: 16, backgroundColor: `${holdColor}20`, borderRadius: 12, borderWidth: 1, borderColor: `${holdColor}80` }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: holdColor, fontSize: 14, marginBottom: 4 }}>
                        {LIMB_LABELS[selectedLimb]}
                      </Text>
                      <Text style={{ color: '#2C3D50', fontSize: 14, lineHeight: 20 }}>
                        {commentsForSelected[0].comment}
                      </Text>
                    </View>
                    <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginLeft: 12, position: 'relative' }}>
                      <ClimbingIcon size={50} color="#2C3D50" />
                      <View
                        style={[
                          styles.limbHighlight,
                          selectedLimb === 'left_hand' && styles.limbHighlightLeftHand,
                          selectedLimb === 'right_hand' && styles.limbHighlightRightHand,
                          selectedLimb === 'left_foot' && styles.limbHighlightLeftFoot,
                          selectedLimb === 'right_foot' && styles.limbHighlightRightFoot,
                          { backgroundColor: holdColor }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ) : null;
            })()}
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
  backIconText: { color: '#fff', fontSize: 28, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 8 },
  interactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  interactiveDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 2,
    borderColor: '#fff',
  },
  limbChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 56,
  },
  limbHighlight: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.8,
  },
  limbHighlightLeftHand: {
    top: 6,
    left: 2,
  },
  limbHighlightRightHand: {
    top: -2,
    right: 10,
  },
  limbHighlightLeftFoot: {
    bottom: -2,
    left: 7,
  },
  limbHighlightRightFoot: {
    bottom: 6,
    right: 7,
  },
});
