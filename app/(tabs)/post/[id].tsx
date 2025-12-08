import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

interface Comment {
  id: string;
  postId: string;
  username: string;
  text: string;
  createdAt: number;
  avatar?: string;
}

interface UserProfile {
  username: string;
  bio: string;
  defaultGym: string;
  profilePicture?: string | number;
  joinedOn?: string;
  currentGrade: string;
  height?: string;
}

// Mock profile data for sample users (matches post usernames)
const sampleProfiles: Record<string, UserProfile> = {
  'Sarah Martinez': {
    username: 'Sarah Martinez',
    bio: 'Boulder enthusiast 🧗‍♀️ V7 crusher on the weekends. Love crimpy routes!',
    defaultGym: 'Penn Campus Recreation',
    profilePicture: require('@/assets/images/snoopy4.png'),
    joinedOn: '2023-03-15T00:00:00.000Z',
    currentGrade: 'V7',
    height: "5'6\"",
  },
  'Sarah_climbs': {
    username: 'Sarah_climbs',
    bio: 'Boulder enthusiast 🧗‍♀️ V7 crusher on the weekends. Love crimpy routes!',
    defaultGym: 'Penn Campus Recreation',
    profilePicture: require('@/assets/images/snoopy4.png'),
    joinedOn: '2023-03-15T00:00:00.000Z',
    currentGrade: 'V7',
    height: "5'6\"",
  },
  'Alex Chen': {
    username: 'Alex Chen',
    bio: 'Working on my technique every day. Sloper specialist 💪',
    defaultGym: 'Tufas Boulder Lounge',
    profilePicture: require('@/assets/images/snoopy2.webp'),
    joinedOn: '2023-06-20T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'10\"",
  },
  'Alex123': {
    username: 'Alex123',
    bio: 'Working on my technique every day. Sloper specialist 💪',
    defaultGym: 'Tufas Boulder Lounge',
    profilePicture: require('@/assets/images/snoopy2.webp'),
    joinedOn: '2023-06-20T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'10\"",
  },
  'Jordan Lee': {
    username: 'Jordan Lee',
    bio: 'Route setter appreciation account. Always looking for creative beta!',
    defaultGym: 'Penn Campus Recreation',
    profilePicture: require('@/assets/images/snoopy3.jpeg'),
    joinedOn: '2022-11-01T00:00:00.000Z',
    currentGrade: 'V9',
    height: "6'0\"",
  },
  'Maya Patel': {
    username: 'Maya Patel',
    bio: 'Just vibing on the wall ✨ Movement regular. Love meeting new climbing buddies!',
    defaultGym: 'Movement Callowhill',
    profilePicture: require('@/assets/images/snoopy1.jpg'),
    joinedOn: '2024-01-10T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'4\"",
  },
  'MayaLovesClimbing': {
    username: 'MayaLovesClimbing',
    bio: 'Just vibing on the wall ✨ Movement regular. Love meeting new climbing buddies!',
    defaultGym: 'Movement Callowhill',
    profilePicture: require('@/assets/images/snoopy1.jpg'),
    joinedOn: '2024-01-10T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'4\"",
  },
};

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

export default function PostDetail() {
  const params = useLocalSearchParams();
  const id = params?.id ? String(params.id) : undefined;
  const from = params?.from ? String(params.from) : undefined;
  const router = useRouter();
  const [post, setPost] = useState<PostLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEntryOverlays, setShowEntryOverlays] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string>('You');
  const [showMenu, setShowMenu] = useState(false);
  const [isUserPost, setIsUserPost] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const handleBack = () => {
    if (from === 'profile') {
      router.push('/(tabs)/profile');
    } else {
      router.back();
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

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

  // Load the post from hardcoded defaults first, then AsyncStorage
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) {
          if (mounted) {
            setLoading(false);
            setComments([]); // Clear comments if no id
          }
          return;
        }

        // Reset comments when post id changes
        if (mounted) {
          setComments([]);
          setCommentText('');
        }

        // Load user profile to get username and profile picture (needed for comments)
        let username: string = 'You';
        let currentUserProfilePicture: string | undefined = undefined;
        try {
          const profileJson = await AsyncStorage.getItem('user_profile');
          if (profileJson) {
            const profile = JSON.parse(profileJson);
            username = profile.username || 'You';
            currentUserProfilePicture = profile.profilePicture;
            if (mounted) {
              setCurrentUsername(username);
              setProfilePicture(profile.profilePicture);
            }
          }
        } catch (e) {
          console.error('Error loading profile:', e);
        }

        // Load comments for this specific post (works for both hardcoded and user posts)
        try {
          const commentsJson = await AsyncStorage.getItem(`post_comments_${id}`);
          if (commentsJson) {
            const postComments: Comment[] = JSON.parse(commentsJson);
            // Filter to ensure comments belong to this post
            const filteredComments = postComments.filter(c => String(c.postId) === String(id));
            const updatedComments = filteredComments.map(c => {
              if (c.username === username) {
                return { ...c, avatar: currentUserProfilePicture };
              }
              return c;
            });
            if (mounted) {
              setComments(updatedComments);
            }
          } else {
            // No comments found for this post, ensure empty array
            if (mounted) {
              setComments([]);
            }
          }
        } catch (e) {
          console.error('Error loading comments:', e);
          if (mounted) {
            setComments([]);
          }
        }

        // First check hardcoded default posts
        const defaultPost = DEFAULT_POSTS.find((p) => String(p.id) === String(id));
        if (defaultPost) {
          if (mounted) {
            setPost(defaultPost);
            setIsUserPost(false); // This is a hardcoded post
            // For hardcoded posts, use the avatar directly (it's a require() number)
            if (defaultPost.avatar) {
              setProfilePicture(undefined); // Will use the avatar from post.avatar directly
            }
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
            const postOwner = found.ownerUsername || username;
            
            let postOwnerAvatar: string | undefined = undefined;
            if (postOwner === username) {
              postOwnerAvatar = currentUserProfilePicture;
            } else {
              try {
                const ownerProfileJson = await AsyncStorage.getItem(`user_profile_${postOwner}`);
                if (ownerProfileJson) {
                  const ownerProfile = JSON.parse(ownerProfileJson);
                  postOwnerAvatar = ownerProfile.profilePicture;
                }
              } catch (e) {
                console.error('Error loading post owner profile:', e);
              }
            }
            
            if (mounted) {
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
              // Check if this is the current user's post
              const currentUser = await AsyncStorage.getItem('current_user');
              setIsUserPost(found.ownerUsername === currentUser);
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
        <Text style={{ fontFamily: 'Poppins_400Regular' }}>Loading…</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={{ fontFamily: 'Poppins_400Regular' }}>Post not found.</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const annotations = post.annotations || [];
  const uniqueTimestamps = Array.from(new Set(annotations.map(a => a.timestamp))).sort((x: number, y: number) => x - y) as number[];

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

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      postId: id,
      username: currentUsername,
      text: commentText.trim(),
      createdAt: Date.now(),
      avatar: profilePicture,
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setCommentText('');
    Keyboard.dismiss(); // Dismiss keyboard after posting

    try {
      await AsyncStorage.setItem(`post_comments_${id}`, JSON.stringify(updatedComments));
    } catch (e) {
      console.error('Error saving comment:', e);
    }
  };

  const handleDeletePost = async () => {
    setShowMenu(false);

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the post from AsyncStorage
              const climbPostsJson = await AsyncStorage.getItem('climb_posts');
              if (climbPostsJson) {
                const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);
                const updatedPosts = climbPosts.filter((p) => String(p.id) !== String(id));
                await AsyncStorage.setItem('climb_posts', JSON.stringify(updatedPosts));
              }

              // Delete associated comments
              await AsyncStorage.removeItem(`post_comments_${id}`);

              Alert.alert('Success', 'Post deleted successfully');
              handleBack();
            } catch (e) {
              console.error('Error deleting post:', e);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleAvatarPress = (username: string) => {
    // Don't show modal if it's the current user's profile
    if (currentUsername === username) {
      router.push('/(tabs)/profile');
      return;
    }

    // Check if we have a sample profile for this user
    const profile = sampleProfiles[username];
    if (profile) {
      setSelectedUserProfile(profile);
      setIsProfileModalVisible(true);
    }
  };

  const formatJoinedDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backIcon} activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
        {isUserPost && (
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={styles.menuIcon}
            activeOpacity={0.7}
          >
            <MaterialIcons name="more-vert" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Menu dropdown */}
      {showMenu && isUserPost && (
        <Modal
          transparent
          visible={showMenu}
          onRequestClose={() => setShowMenu(false)}
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleDeletePost}
              >
                <MaterialIcons name="delete" size={20} color="#FF3B30" />
                <Text style={styles.menuOptionTextDelete}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        keyboardDismissMode="on-drag"
      >
        <View style={[styles.mediaCard, annotations.length === 0 && styles.mediaCardCentered]}>
        <View style={[styles.thumbWrapper, annotations.length === 0 && styles.thumbWrapperCentered]}>
          <Link href={`/(tabs)/post/video/${id}`} asChild>
            <TouchableOpacity activeOpacity={0.9}>
              <View style={styles.thumbPreview}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                ) : (
                  <View style={{ width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#000' }} />
                )}
                <View style={styles.playOverlay} pointerEvents="none">
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
          <Text style={styles.thumbCaption}>Click to view full video</Text>
        </View>

        {annotations.length > 0 && (
          <View style={styles.thumbWrapper}>
            <Link href={`/(tabs)/post/interactive/${id}`} asChild>
              <TouchableOpacity activeOpacity={0.9}>
                <View style={styles.thumbPreview}>
                  {previewUri ? (
                    <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="contain" />
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
              </TouchableOpacity>
            </Link>
            <Text style={styles.thumbCaption}>Click to view interactive path</Text>
          </View>
        )}
      </View>

      <View style={styles.userRow}>
        <Pressable
          onPress={() => handleAvatarPress(post.username || 'User')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          {(post.avatar || profilePicture) ? (
            <Image
              source={
                post.avatar
                  ? typeof post.avatar === 'string'
                    ? { uri: post.avatar }
                    : post.avatar
                  : { uri: profilePicture }
              }
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(post.username || 'User').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.username}>{post.username || 'User'}</Text>
          <Text style={styles.smallTimestamp}>{post.createdAt ? formatTimestamp(post.createdAt) : post.timestamp || ''}</Text>
        </View>
      </View>

      {/* Meta card */}
      <View style={styles.metaCard}>
        {post.location && (
          <View style={styles.metaRow}>
            <MaterialIcons name="location-on" size={20} color="#344154" style={{ marginRight: 8 }} />
            <Text style={styles.metaText}>{post.location}</Text>
          </View>
        )}
        {post.difficulty && (
          <View style={styles.metaRow}>
            <MaterialIcons name="terrain" size={20} color="#344154" style={{ marginRight: 8 }} />
            <Text style={styles.metaText}>{post.difficulty}</Text>
          </View>
        )}
        {post.color && (
          <View style={styles.metaRow}>
            <MaterialIcons name="palette" size={20} color="#344154" style={{ marginRight: 8 }} />
            <Text style={styles.metaText}>{post.color}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {post.description && (
        <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#555', lineHeight: 20, fontFamily: 'Inter_400Regular' }}>{post.description}</Text>
        </View>
      )}

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comments({comments.length})</Text>
        
        <View style={styles.commentInputContainer}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.commentAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarText}>
                {currentUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            placeholderTextColor="#999"
            blurOnSubmit={true}
            returnKeyType="done"
            onSubmitEditing={handleAddComment}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!commentText.trim()}
            style={[styles.commentButton, !commentText.trim() && styles.commentButtonDisabled]}
          >
            <Text style={[styles.commentButtonText, !commentText.trim() && styles.commentButtonTextDisabled]}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Comments list */}
        <View style={styles.commentsList}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Pressable
                onPress={() => handleAvatarPress(comment.username)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                {comment.avatar ? (
                  <Image
                    source={{ uri: comment.avatar }}
                    style={styles.commentAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.commentAvatarPlaceholder}>
                    <Text style={styles.commentAvatarText}>
                      {comment.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{comment.username}</Text>
                  <Text style={styles.commentTime}>{formatTimestamp(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>

      {/* User Profile Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            {/* Modal Header */}
            <View style={styles.profileModalHeader}>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#2C3D50" />
              </TouchableOpacity>
              <Text style={styles.profileModalTitle}>Profile</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedUserProfile && (
              <ScrollView style={styles.profileModalScroll} contentContainerStyle={styles.profileModalScrollContent}>
                {/* Profile Picture */}
                <View style={styles.profilePictureContainer}>
                  {selectedUserProfile.profilePicture ? (
                    <Image
                      source={typeof selectedUserProfile.profilePicture === 'string'
                        ? { uri: selectedUserProfile.profilePicture }
                        : selectedUserProfile.profilePicture}
                      style={styles.modalProfilePicture}
                    />
                  ) : (
                    <View style={styles.modalProfilePicturePlaceholder}>
                      <Text style={styles.modalProfilePictureText}>
                        {selectedUserProfile.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Username */}
                <Text style={styles.modalUsername}>{selectedUserProfile.username}</Text>

                {/* Profile Information Cards */}
                <View style={styles.profileInfoSection}>
                  <View style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <MaterialIcons name="info" size={20} color="#2C3D50" />
                      <Text style={styles.profileInfoLabel}>Bio</Text>
                    </View>
                    <Text style={styles.profileInfoValue}>{selectedUserProfile.bio || 'No bio yet'}</Text>
                  </View>

                  <View style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <MaterialIcons name="location-on" size={20} color="#2C3D50" />
                      <Text style={styles.profileInfoLabel}>Home Gym</Text>
                    </View>
                    <Text style={styles.profileInfoValue}>{selectedUserProfile.defaultGym}</Text>
                  </View>

                  <View style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <MaterialIcons name="calendar-today" size={20} color="#2C3D50" />
                      <Text style={styles.profileInfoLabel}>Joined On</Text>
                    </View>
                    <Text style={styles.profileInfoValue}>{formatJoinedDate(selectedUserProfile.joinedOn)}</Text>
                  </View>

                  <View style={styles.profileInfoCard}>
                    <View style={styles.profileInfoRow}>
                      <MaterialIcons name="grade" size={20} color="#2C3D50" />
                      <Text style={styles.profileInfoLabel}>Current Grade</Text>
                    </View>
                    <Text style={styles.profileInfoValue}>{selectedUserProfile.currentGrade}</Text>
                  </View>

                  {selectedUserProfile.height && (
                    <View style={styles.profileInfoCard}>
                      <View style={styles.profileInfoRow}>
                        <MaterialIcons name="height" size={20} color="#2C3D50" />
                        <Text style={styles.profileInfoLabel}>Height</Text>
                      </View>
                      <Text style={styles.profileInfoValue}>{selectedUserProfile.height}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentRow: {
    flex: 1,
  },
  leftColumn: {
    paddingHorizontal: 12,
  },
  rightColumn: {
    padding: 12,
  },
  header: {
    height: 80,
    backgroundColor: '#2C3D50',
    paddingTop: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins_700Bold',
  },
  backIcon: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'Poppins_700Bold',
  },
  backButton: {
    marginTop: 12,
  },
  backButtonText: {
    color: '#2C3D50',
    fontFamily: 'Poppins_400Regular',
  },
  menuIcon: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 12,
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuOptionTextDelete: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    fontFamily: 'Poppins_700Bold',
  },
  mediaCard: {
    backgroundColor: '#2F4050',
    margin: 20,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaCardCentered: {
    justifyContent: 'center',
  },
  thumbWrapper: {
    width: '48%',
    alignItems: 'center',
  },
  thumbWrapperCentered: {
    width: '70%',
  },
  thumbPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#0f1720',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbCaption: {
    color: '#DDEAF2',
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playIcon: {
    color: '#fff',
    fontSize: 36,
    opacity: 0.95,
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'Poppins_700Bold',
  },
  smallTimestamp: {
    color: '#888',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  metaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: '#344154',
    fontFamily: 'Poppins_400Regular',
  },
  metaTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Poppins_700Bold',
  },
  annotationDotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  annotationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  annotationLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_700Bold',
  },
  annotationMeta: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  noAnnotations: {
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  limbDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 6,
  },
  commentsSection: {
    marginTop: 18,
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Poppins_700Bold',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins_400Regular',
  },
  commentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  commentButtonTextDisabled: {
    color: '#999',
    fontFamily: 'Poppins_700Bold',
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'Poppins_700Bold',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalScroll: {
    maxHeight: 700,
  },
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
  holdRowActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  holdsColumn: {
    width: 160,
  },
  limbsColumn: {
    flex: 1,
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
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  profileModalScroll: {
    flex: 1,
  },
  profileModalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalProfilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalProfilePictureText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  modalUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3D50',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  profileInfoSection: {
    gap: 12,
  },
  profileInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  profileInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#2C3D50',
    marginLeft: 28,
    fontFamily: 'Inter_400Regular',
  },
});
