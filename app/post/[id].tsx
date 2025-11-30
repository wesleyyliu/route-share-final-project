import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

const LIMB_LABELS: Record<string, string> = {
  left_hand: 'Left hand',
  right_hand: 'Right hand',
  left_foot: 'Left foot',
  right_foot: 'Right foot',
};

export default function PostDetail() {
  const params = useLocalSearchParams();
  const id = params?.id ? String(params.id) : undefined;
  const router = useRouter();
  const [post, setPost] = useState<PostLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [showAnnotatedVideo, setShowAnnotatedVideo] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const interactiveVideoRef = useRef<any>(null);
  const [showEntryOverlays, setShowEntryOverlays] = useState(true);
  const [visibleHoldTimestamp, setVisibleHoldTimestamp] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selectedLimb, setSelectedLimb] = useState<string | null>(null);

  const LIMB_COLORS: Record<string, string> = {
    left_hand: '#FF6B6B',
    right_hand: '#4ECDC4',
    left_foot: '#FFE66D',
    right_foot: '#95E1D3',
  };

  // colors by hold index (hold 1 -> blue, hold 2 -> yellow, hold 3 -> green, etc.)
  const HOLD_COLORS = ['#3B82F6', '#FBBF24', '#10B981', '#EF4444', '#8B5CF6'];
  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const getHoldColor = (timestamp?: number) => {
    if (!timestamp) return HOLD_COLORS[0];
    const idx = uniqueTimestamps.indexOf(timestamp);
    if (idx < 0) return HOLD_COLORS[0];
    return HOLD_COLORS[idx % HOLD_COLORS.length];
  };

  // Load the post from AsyncStorage (or clear loading if id missing)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) {
          if (mounted) setLoading(false);
          return;
        }

        const climbPostsJson = await AsyncStorage.getItem('climb_posts');
        if (climbPostsJson) {
          const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);
          const found = climbPosts.find((p) => String(p.id) === String(id));
          if (found) {
            if (mounted) {
              setPost({
                id: found.id,
                username: 'You',
                createdAt: found.createdAt,
                videoUri: found.videoUri,
                location: found.metadata?.location,
                difficulty: found.metadata?.difficulty,
                color: found.metadata?.color,
                avatar: undefined,
                annotations: found.annotations || [],
              });
            }
          }
        }
      } catch (e) {
        console.error('Error loading post from AsyncStorage', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Generate a first-frame preview (0.5s) for the video's thumbnail when post is available
  useEffect(() => {
    let mounted = true;
    const genPreview = async () => {
      try {
        if (!post || !post.videoUri) return;

        let uri: string | undefined;
        if (typeof post.videoUri === 'number') {
          const asset = Asset.fromModule(post.videoUri as any);
          try {
            await asset.downloadAsync();
          } catch (e) {
            // ignore download errors, asset may already be available
          }
          uri = asset.localUri || asset.uri;
        } else if (typeof post.videoUri === 'string') {
          uri = post.videoUri as string;
        }

        if (!uri) return;

        const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, { time: 500 });
        if (mounted) setPreviewUri(thumb);
      } catch (e) {
        // don't crash the UI for thumbnail failures
        console.log('Failed to generate preview:', e);
      }
    };

    genPreview();
    return () => {
      mounted = false;
    };
  }, [post]);

  // entry overlays will now remain visible until the user opens the interactive modal
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Post not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
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

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Text style={{ color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      {/* Top media card matching Figma: two thumbnails side-by-side in dark rounded panel */}
      <View style={styles.mediaCard}>
        <TouchableOpacity style={styles.thumbWrapper} onPress={() => setShowFullVideo(true)} activeOpacity={0.9}>
          <View style={styles.thumbPreview}>
            {/* small video preview (first-frame) */}
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <View style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#000' }} />
            )}
            <View style={styles.playOverlay} pointerEvents="none">
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
          <Text style={styles.thumbCaption}>Click to view full video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.thumbWrapper}
          onPress={() => {
            setVisibleHoldTimestamp(uniqueTimestamps.length > 0 ? uniqueTimestamps[0] : null);
            setShowAnnotatedVideo(true);
            // keep entry overlays visible on this screen per user's request
          }}
          activeOpacity={0.9}
        >
          <View style={styles.thumbPreview}>
            {/* small video preview (first-frame); no bottom 4 dots */}
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            ) : (
              <View style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#000' }} />
            )}
            {showEntryOverlays && annotations.length > 0 && (
              <View style={styles.entryOverlay} pointerEvents="none">
                {annotations.map((a) => (
                  <View
                    key={`entry-${a.id}`}
                    style={[
                      styles.entryDot,
                      {
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        backgroundColor: getHoldColor(a.timestamp),
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
          <Text style={styles.thumbCaption}>Click to view interactive path</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + user row */}
      <View style={styles.userRow}>
        <View style={styles.avatar} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.username}>{post.username || 'User'}</Text>
          <Text style={styles.smallTimestamp}>{post.createdAt ? formatTimestamp(post.createdAt) : post.timestamp || ''}</Text>
        </View>
      </View>

      {/* Meta card */}
      <View style={styles.metaCard}>
        {post.location && (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{post.location}</Text>
          </View>
        )}
        {post.difficulty && (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🪨</Text>
            <Text style={styles.metaText}>{post.difficulty}</Text>
          </View>
        )}
      </View>

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comments(0)</Text>
        {/* Placeholder: actual comments implementation lives elsewhere */}
      </View>

      {/* Full video modal */}
      <Modal visible={showFullVideo} transparent animationType="slide" onRequestClose={() => setShowFullVideo(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: screenWidth - 40 }] }>
            <Video
              source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
              style={{ width: '100%', height: 320, backgroundColor: '#000' }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          </View>
        </View>
      </Modal>

      {/* Interactive path modal (overlay all dots + hold list + limb filters) */}
      <Modal visible={showAnnotatedVideo} transparent animationType="slide" onRequestClose={() => setShowAnnotatedVideo(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: screenWidth - 20, height: '90%', flexDirection: 'column' }] }>
            {/* Video on top - fixed */}
            <View style={{ width: '100%', marginBottom: 12 }}>
              <Video
                ref={interactiveVideoRef}
                source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
                style={{ width: '100%', height: 320, backgroundColor: '#000', borderRadius: 12 }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />

              {/* Overlay annotations (filtered by selected hold when applicable) */}
              <View style={styles.interactiveOverlay} pointerEvents="none">
                {(
                  (visibleHoldTimestamp != null
                    ? annotations.filter((a) => a.timestamp === visibleHoldTimestamp)
                    : annotations
                  )
                ).map((a) => (
                  <View
                    key={a.id}
                    style={[
                      styles.interactiveDot,
                      {
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        backgroundColor: getHoldColor(a.timestamp),
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Scrollable content below video */}
            <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
              {/* Hold Picker Section */}
              <View style={{ marginTop: 12, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#999', marginBottom: 8, fontWeight: '500' }}>Select Hold</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  snapToInterval={80}
                  decelerationRate="fast"
                >
                  {uniqueTimestamps.map((ts, idx) => (
                    <TouchableOpacity
                      key={`hold-picker-${ts}-${idx}`}
                      onPress={async () => {
                        setVisibleHoldTimestamp(ts);
                        const annotationsForHold = annotations.filter(a => a.timestamp === ts);
                        const limbWithComment = annotationsForHold.find(a => a.comment && a.comment.trim() !== '');
                        setSelectedLimb(limbWithComment ? limbWithComment.limbType : null);
                        try {
                          await interactiveVideoRef.current?.setPositionAsync(Math.floor(ts * 1000));
                          await interactiveVideoRef.current?.pauseAsync();
                        } catch (e) {
                          // ignore
                        }
                      }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 12,
                        marginHorizontal: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: visibleHoldTimestamp === ts ? getHoldColor(ts) : '#F0F0F0',
                        borderWidth: visibleHoldTimestamp === ts ? 3 : 0,
                        borderColor: '#fff',
                      }}
                    >
                      <Text style={{ fontSize: 24, fontWeight: '700', color: visibleHoldTimestamp === ts ? '#fff' : '#666' }}>
                        {idx + 1}
                      </Text>
                      <Text style={{ fontSize: 11, color: visibleHoldTimestamp === ts ? '#fff' : '#999', marginTop: 2 }}>
                        {formatTime(ts)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Limbs grid (2x2) */}
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#111', marginBottom: 12 }}>Select Limb</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {['left_hand', 'right_hand'].map((key) => {
                    const annotationsForSelectedHold = visibleHoldTimestamp != null
                      ? annotations.filter(a => a.timestamp === visibleHoldTimestamp && a.limbType === key)
                      : annotations.filter(a => a.limbType === key);
                    const hasComment = annotationsForSelectedHold.some(a => a.comment && a.comment.trim() !== '');
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.limbChip,
                          {
                            backgroundColor: selectedLimb === key ? (hasComment ? getHoldColor(visibleHoldTimestamp || uniqueTimestamps[0]) : '#E5E7EB') : (hasComment ? '#E8F5E9' : '#F5F5F5'),
                            borderWidth: selectedLimb === key ? 2 : 0,
                            borderColor: '#4CAF50',
                          },
                        ]}
                        onPress={() => hasComment && setSelectedLimb(key)}
                        disabled={!hasComment}
                      >
                        <Text style={{ color: selectedLimb === key ? (hasComment ? '#fff' : '#999') : (hasComment ? '#2E7D32' : '#BDBDBD'), fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
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
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.limbChip,
                          {
                            backgroundColor: selectedLimb === key ? (hasComment ? getHoldColor(visibleHoldTimestamp || uniqueTimestamps[0]) : '#E5E7EB') : (hasComment ? '#E8F5E9' : '#F5F5F5'),
                            borderWidth: selectedLimb === key ? 2 : 0,
                            borderColor: '#4CAF50',
                          },
                        ]}
                        onPress={() => hasComment && setSelectedLimb(key)}
                        disabled={!hasComment}
                      >
                        <Text style={{ color: selectedLimb === key ? (hasComment ? '#fff' : '#999') : (hasComment ? '#2E7D32' : '#BDBDBD'), fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                          {LIMB_LABELS[key]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Comments section - Full width card */}
              <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
                {selectedLimb ? (
                  (() => {
                    const commentsForSelected = visibleHoldTimestamp != null
                      ? annotations.filter(a => a.timestamp === visibleHoldTimestamp && a.limbType === selectedLimb)
                      : annotations.filter(a => a.limbType === selectedLimb);
                    return commentsForSelected.length > 0 ? (
                      <View style={{ padding: 16, backgroundColor: '#E8F5E9', borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Text style={{ fontSize: 20 }}>🧗</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '700', color: '#2E7D32', fontSize: 14, marginBottom: 4 }}>
                              {LIMB_LABELS[selectedLimb]}
                            </Text>
                            <Text style={{ color: '#388E3C', fontSize: 14, lineHeight: 20 }}>
                              {commentsForSelected[0].comment}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={{ padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12 }}>
                        <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>No comment for this limb</Text>
                      </View>
                    );
                  })()
                ) : (
                  <View style={{ padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12 }}>
                    <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>Select a limb to view comment</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { height: 60, backgroundColor: '#2C3D50', paddingTop: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  backIcon: { padding: 8 },
  backButton: { marginTop: 12 },
  backButtonText: { color: '#2C3D50' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 8 },
  contentRow: { flex: 1 },
  mediaCard: { backgroundColor: '#2F4050', margin: 20, borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  thumbWrapper: { width: '48%', alignItems: 'center' },
  thumbPreview: { width: '100%', aspectRatio: 3/4, backgroundColor: '#0f1720', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  playIcon: { color: '#fff', fontSize: 36, opacity: 0.95 },
  annotationDotsRow: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  thumbCaption: { color: '#DDEAF2', marginTop: 8, fontSize: 12 },
  leftColumn: { paddingHorizontal: 12 },
  rightColumn: { padding: 12 },
  video: { width: '100%', height: 300, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' },
  metaTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  noAnnotations: { color: '#666' },
  annotationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  limbDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10, marginTop: 6 },
  annotationLabel: { fontSize: 16, fontWeight: '600' },
  annotationMeta: { fontSize: 14, color: '#666' },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6E6E6' },
  username: { fontSize: 18, fontWeight: '700', color: '#111' },
  smallTimestamp: { color: '#888', marginTop: 4 },
  metaCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaIcon: { marginRight: 8 },
  metaText: { color: '#344154' },
  commentsSection: { marginTop: 18, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  modalClose: { alignSelf: 'flex-end', padding: 8 },
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
  entryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },
  entryDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  holdButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    height: 44,
    justifyContent: 'center',
  },
  holdButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  holdRow: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  holdRowActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  modalScroll: {
    maxHeight: 700,
  },
  holdsColumn: {
    width: 160,
  },
  limbsColumn: {
    flex: 1,
  },
  commentBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginBottom: 8,
  },
  commentsContainer: {
    marginTop: 12,
  },
  limbChipActive: {
    backgroundColor: '#2563EB',
    width: 140,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
  limbChipSelected: {
    backgroundColor: '#0F172A',
    width: 140,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
    borderWidth: 3,
    borderColor: '#111827',
  },
  limbChipDisabled: {
    backgroundColor: '#E5E7EB',
    width: 140,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
});
