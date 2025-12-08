import ActivityCard from '@/components/ActivityCard';
import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  videoUri?: number | string;
  location: string;
  difficulty: string;
  color?: string;
  avatar?: number | string;
  annotations?: LimbAnnotation[];
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

// Mock profile data for sample users
const sampleProfiles: Record<string, UserProfile> = {
  'Sarah_climbs': {
    username: 'Sarah_climbs',
    bio: 'Boulder enthusiast 🧗‍♀️ V7 crusher on the weekends. Love crimpy routes!',
    defaultGym: 'Penn Campus Recreation',
    profilePicture: require('../../assets/images/snoopy4.png'),
    joinedOn: '2023-03-15T00:00:00.000Z',
    currentGrade: 'V7',
    height: "5'6\"",
  },
  'Alex123': {
    username: 'Alex123',
    bio: 'Working on my technique every day. Sloper specialist 💪',
    defaultGym: 'Tufas Boulder Lounge',
    profilePicture: require('../../assets/images/snoopy2.webp'),
    joinedOn: '2023-06-20T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'10\"",
  },
  'Jordan Lee': {
    username: 'Jordan Lee',
    bio: 'Route setter appreciation account. Always looking for creative beta!',
    defaultGym: 'Penn Campus Recreation',
    profilePicture: require('../../assets/images/snoopy3.jpeg'),
    joinedOn: '2022-11-01T00:00:00.000Z',
    currentGrade: 'V9',
    height: "6'0\"",
  },
  'MayaLovesClimbing': {
    username: 'MayaLovesClimbing',
    bio: 'Just vibing on the wall ✨ Movement regular. Love meeting new climbing buddies!',
    defaultGym: 'Movement Callowhill',
    profilePicture: require('../../assets/images/snoopy1.jpg'),
    joinedOn: '2024-01-10T00:00:00.000Z',
    currentGrade: 'V4',
    height: "5'4\"",
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const gyms = [
    'All Gyms',
    'Penn Campus Recreation',
    'Tufas Boulder Lounge',
    'Movement Callowhill',
    'Main Line Boulders',
  ];
  const [selectedGym, setSelectedGym] = useState<string>(gyms[0]);
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);

  const defaultPosts: Post[] = [
    {
      id: '1',
      username: 'Sarah_climbs',
      content: 'Finally sent this project! The crimp at the start was brutal but so rewarding 💪',
      timestamp: '2 hours ago',
      videoUri: require('@/assets/videos/post1.mp4'),
      avatar: require('../../assets/images/snoopy4.png'),
      location: 'Penn Campus Recreation',
      difficulty: 'V5 Blue',
    },
    {
      id: '2',
      username: 'Alex123',
      content: 'Working on technique today. These slopers are teaching me patience!',
      timestamp: '5 hours ago',
      videoUri: require('@/assets/videos/post2.mov'),
      avatar: require('../..//assets/images/snoopy2.webp'),
      location: 'Tufas Boulder Lounge',
      difficulty: 'V3 Yellow',

    },
    {
      id: '3',
      username: 'Jordan Lee',
      content: 'New route setter at Pottruck is crushing it! This purple problem is so fun',
      timestamp: '1 day ago',
      videoUri: require('@/assets/videos/upload_post.mp4'),
      avatar: require('../..//assets/images/snoopy3.jpeg'),
      location: 'Penn Campus Recreation',
      difficulty: 'V9 Purple'
    },
    {
      id: '4',
      username: 'MayaLovesClimbing',
      content: 'Love the new set here! Great variety of holds and creative beta',
      timestamp: '3 days ago',
      videoUri: require('@/assets/videos/post2.mov'),
      avatar: require('../..//assets/images/snoopy1.jpg'),
      location: 'Movement Callowhill',
      difficulty: 'V4 White'
    },
  ];

  const [posts, setPosts] = useState<Post[]>(defaultPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<{ username: string; profilePicture?: string } | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const colorOptions = [
    'All Colors',
    'Red',
    'Orange',
    'Yellow',
    'Green',
    'Blue',
    'Purple',
    'White',
    'Black',
  ];

  const gradeOptions = ['All Grades', ...Array.from({ length: 14 }, (_, i) => `V${i}`)];

  const [selectedColor, setSelectedColor] = useState<string>('All Colors');
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

  const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const colorBtnRef = useRef<any>(null);
  const gradeBtnRef = useRef<any>(null);
  const gymBtnRef = useRef<any>(null);
  const [colorBtnLayout, setColorBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [gradeBtnLayout, setGradeBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [gymBtnLayout, setGymBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Load posts from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    try {
      // Load current user profile
      const profileJson = await AsyncStorage.getItem('user_profile');
      let profile = null;
      if (profileJson) {
        profile = JSON.parse(profileJson);
        setUserProfile(profile);
      }

      // Get the current logged in user
      const currentUser = await AsyncStorage.getItem('current_user');

      const climbPostsJson = await AsyncStorage.getItem('climb_posts');
      if (climbPostsJson) {
        const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);

        // Build a cache of user profiles for displaying avatars
        const profileCache: Record<string, { username: string; profilePicture?: string }> = {};
        
        if (profile && profile.username) {
          profileCache[profile.username] = profile;
        }
        if (currentUser && profile) {
          profileCache[currentUser] = profile;
        }
        
        // Load profile for each unique post owner
        const uniqueOwners = [...new Set(climbPosts.map((cp) => cp.ownerUsername).filter(Boolean))];
        
        for (const owner of uniqueOwners) {
          // Skip if we already have this profile in cache
          if (profileCache[owner]) continue;
          
          try {
            const ownerProfileJson = await AsyncStorage.getItem(`user_profile_${owner}`);
            if (ownerProfileJson) {
              profileCache[owner] = JSON.parse(ownerProfileJson);
            }
          } catch (e) {
            console.error(`Error loading profile for ${owner}:`, e);
          }
        }

        const userPosts: Post[] = climbPosts.map((cp) => {
          // Use the post's ownerUsername - don't fall back to current user to avoid mis-attribution
          const postOwner = cp.ownerUsername || 'Unknown';
          const ownerProfile = profileCache[postOwner];
          
          return {
            id: cp.id,
            username: postOwner,
            content: cp.description,
            timestamp: formatTimestamp(cp.createdAt),
            videoUri: cp.videoUri,
            location: cp.metadata.location,
            difficulty: cp.metadata.difficulty,
            color: cp.metadata.color,
            annotations: cp.annotations,
            avatar: ownerProfile?.profilePicture,
          };
        });

        // Merge user posts with default posts
        setPosts([...userPosts, ...defaultPosts]);
      } else {
        setPosts(defaultPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts(defaultPosts);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
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

  const filteredPosts = useMemo(() => {
    let base = posts;

    // gym filter
    if (selectedGym && selectedGym !== 'All Gyms') {
      const s = selectedGym.trim().toLowerCase();
      base = base.filter((p) => p.location && p.location.trim().toLowerCase().includes(s));
    }

    // search filter
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((p) => {
        const username = (p.username || '').toLowerCase();
        const content = (p.content || '').toLowerCase();
        const location = (p.location || '').toLowerCase();
        const difficulty = (p.difficulty || '').toLowerCase();

        return (
          username.includes(q) ||
          difficulty.includes(q) ||
          content.includes(q) ||
          location.includes(q)
        );
      });
    }

    // grade filter (match feed.tsx behavior: grade is first token of difficulty)
    if (selectedGrade && selectedGrade !== 'All Grades') {
      const g = selectedGrade.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.difficulty) return false;
        const grade = p.difficulty.split(' ')[0].toLowerCase(); // e.g. 'v5'
        return grade === g;
      });
    }

    // color filter (match feed.tsx behavior: color is everything after the grade token in difficulty)
    if (selectedColor && selectedColor !== 'All Colors') {
      const c = selectedColor.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.difficulty) return false;
        const parts = p.difficulty.split(' ');
        const color = parts.length > 1 ? parts.slice(1).join(' ').toLowerCase() : (p.color ? p.color.toLowerCase() : '');
        return color === c;
      });
    }

    return base;
  }, [posts, selectedGym, searchQuery, selectedGrade, selectedColor]);

  const handlePostPress = (postId: string) => {
    // Navigate to post detail page
    router.push({ pathname: '/(tabs)/post/[id]', params: { id: postId } });
  };

  const handleAvatarPress = (username: string) => {
    // Don't show modal if it's the current user's profile
    if (userProfile && userProfile.username === username) {
      // Navigate to their own profile tab instead
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.locationLabel}>Your location</Text>
        <Text style={styles.locationText}>Philadelphia, PA, 19104</Text>

        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search climbs, users, etc."
          placeholderTextColor="#9198a7ff"
          returnKeyType="search"
        />

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            ref={gymBtnRef}
            style={styles.dropdown}
            onPress={() => {
              if (gymDropdownOpen) {
                setGymDropdownOpen(false);
                return;
              }
              if (gymBtnRef.current && gymBtnRef.current.measureInWindow) {
                gymBtnRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                  setGymBtnLayout({ x, y, width: w, height: h });
                  setGymDropdownOpen(true);
                });
              } else {
                setGymDropdownOpen(true);
              }
              setColorDropdownOpen(false);
              setGradeDropdownOpen(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{selectedGym}</Text>
            <Text style={styles.caret}>{gymDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Color</Text>
            <TouchableOpacity
              ref={colorBtnRef}
              style={styles.dropdown}
              onPress={() => {
                if (colorDropdownOpen) {
                  setColorDropdownOpen(false);
                  return;
                }
                if (colorBtnRef.current && colorBtnRef.current.measureInWindow) {
                  colorBtnRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                    setColorBtnLayout({ x, y, width: w, height: h });
                    setColorDropdownOpen(true);
                  });
                } else {
                  setColorDropdownOpen(true);
                }
                setGymDropdownOpen(false);
                setGradeDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{selectedColor}</Text>
              <Text style={styles.caret}>{colorDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Grade</Text>
            <TouchableOpacity
              ref={gradeBtnRef}
              style={styles.dropdown}
              onPress={() => {
                if (gradeDropdownOpen) {
                  setGradeDropdownOpen(false);
                  return;
                }
                if (gradeBtnRef.current && gradeBtnRef.current.measureInWindow) {
                  gradeBtnRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                    setGradeBtnLayout({ x, y, width: w, height: h });
                    setGradeDropdownOpen(true);
                  });
                } else {
                  setGradeDropdownOpen(true);
                }
                setGymDropdownOpen(false);
                setColorDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{selectedGrade}</Text>
              <Text style={styles.caret}>{gradeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Activity Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Recent activity</Text>
      </View>

      {/* Activity Feed */}
      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
        {filteredPosts.map((post) => (
          <ActivityCard
            key={post.id}
            username={post.username}
            location={post.location}
            difficulty={post.difficulty}
            color={post.color}
            timestamp={post.timestamp}
            videoUri={post.videoUri || ''}
            avatar={post.avatar || ''}
            onPress={() => handlePostPress(post.id)}
            onAvatarPress={() => handleAvatarPress(post.username)}
          />
        ))}
      </ScrollView>
      {colorDropdownOpen && (
        <Modal transparent visible={colorDropdownOpen} onRequestClose={() => setColorDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setColorDropdownOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>

            <View style={{ position: 'absolute', top: (colorBtnLayout ? colorBtnLayout.y + colorBtnLayout.height + 4 : 120), left: (colorBtnLayout ? colorBtnLayout.x : 20), width: Math.max(colorBtnLayout ? colorBtnLayout.width : 180, 180) }}>
              <ScrollView style={[styles.dropdownOptions, { maxHeight: 220 }]} contentContainerStyle={{ paddingVertical: 4 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedColor(c);
                      setColorDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {gradeDropdownOpen && (
        <Modal transparent visible={gradeDropdownOpen} onRequestClose={() => setGradeDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setGradeDropdownOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>

            <View style={{ position: 'absolute', top: (gradeBtnLayout ? gradeBtnLayout.y + gradeBtnLayout.height + 4 : 160), left: (gradeBtnLayout ? gradeBtnLayout.x : 20), width: Math.max(gradeBtnLayout ? gradeBtnLayout.width : 180, 180) }}>
              <ScrollView style={[styles.dropdownOptions, { maxHeight: 300 }]} contentContainerStyle={{ paddingVertical: 4 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {gradeOptions.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedGrade(g);
                      setGradeDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {gymDropdownOpen && (
        <Modal transparent visible={gymDropdownOpen} onRequestClose={() => setGymDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setGymDropdownOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>

            <View style={{ position: 'absolute', top: (gymBtnLayout ? gymBtnLayout.y + gymBtnLayout.height + 4 : 100), left: (gymBtnLayout ? gymBtnLayout.x : 20), width: Math.max(gymBtnLayout ? gymBtnLayout.width : 180, 180) }}>
              <ScrollView style={[styles.dropdownOptions, { maxHeight: 220 }]} contentContainerStyle={{ paddingVertical: 4 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {gyms.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedGym(g);
                      setGymDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

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

    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // overflow: 'hidden',
    backgroundColor: '#E6E6E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2C3D50',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationLabel: {
    fontSize: 12,
    color: '#A0B0BD',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  locationText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    backgroundColor: '#203247ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#2C3D50',
    fontFamily: 'Inter_400Regular',
  },
  caret: {
    fontSize: 12,
    color: '#9AA6B0',
    fontFamily: 'Inter_400Regular',
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#2C3D50',
    fontFamily: 'Inter_400Regular',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#A0B0BD',
    marginBottom: 6,
    fontFamily: 'Inter_400Regular',
  },
  titleContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  feed: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  metadataContainer: {
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metadataText: {
    fontSize: 14,
    color: '#6B7885',
    fontFamily: 'Inter_400Regular',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  postContent: {
    fontSize: 15,
    color: '#2C3D50',
    lineHeight: 20,
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postVideo: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#000',
    marginBottom: 12,
  },
  postCardHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  postVideoWrapper: {
    width: 120,
    height: 100,
    borderRadius: 8,
    // overflow: 'hidden',
    backgroundColor: '#000',
    flexShrink: 0,
    marginRight: 12,
  },
  postVideoInner: {
    width: '100%',
    height: '100%',
  },
  postVideoPlaceholderSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#E6E6E6',
  },
  postBody: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  postVideoPlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    backgroundColor: '#E6E6E6',
    marginBottom: 12,
  },
  // Profile Modal Styles
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
