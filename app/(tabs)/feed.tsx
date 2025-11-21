import VideoAnnotation, { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
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

export default function FeedScreen() {
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
      username: 'Joe Bob',
      content: 'Just sent my first V5! 🎉',
      timestamp: '2 hours ago',
      videoUri: require('@/assets/videos/post1.mp4'),
      avatar: require('../../assets/images/snoopy4.png'),
      location: 'Penn Campus Recreation',
      difficulty: 'V5 Blue',
    },
    {
      id: '2',
      username: 'Carter Anderson',
      content: 'Working on crimps at the gym today!',
      timestamp: '5 hours ago',
      videoUri: require('@/assets/videos/post2.mov'),
      avatar: require('../..//assets/images/snoopy2.webp'),
      location: 'Tufas Boulder Lounge',
      difficulty: 'V3 Yellow',

    },
    {
      id: '3',
      username: 'Hillary Clinton',
      content: 'Great session, made lots of progress!',
      timestamp: '1 day ago',
      videoUri: require('@/assets/videos/post1.mp4'),
      avatar: require('../..//assets/images/snoopy3.jpeg'),
      location: 'Penn Campus Recreation',
      difficulty: 'V9 Purple'
    },
    {
      id: '4',
      username: 'Bob Job',
      content: 'I love this gym!',
      timestamp: '3 day ago',
      videoUri: require('@/assets/videos/post2.mov'),
      avatar: require('../..//assets/images/snoopy1.jpg'),
      location: 'Movement Callowhill',
      difficulty: 'V4 White'
    },
  ];
  
  const [posts, setPosts] = useState<Post[]>(defaultPosts);
  const [newPost, setNewPost] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | number | null>(null);
  const [currentUsername, setCurrentUsername] = useState('you');
  const [searchQuery, setSearchQuery] = useState('');
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
  
  // grades V0 to V13
  const gradeOptions = ['All Grades', ...Array.from({ length: 14 }, (_, i) => `V${i}`)];
  
  // selection state for these dropdowns
  const [selectedColor, setSelectedColor] = useState<string>('All Colors');
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  
  const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const colorBtnRef = useRef<any>(null);
  const gradeBtnRef = useRef<any>(null);
  const [colorBtnLayout, setColorBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [gradeBtnLayout, setGradeBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);


  // Load posts from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    try {
      const climbPostsJson = await AsyncStorage.getItem('climb_posts');
      if (climbPostsJson) {
        const climbPosts: ClimbPost[] = JSON.parse(climbPostsJson);
        
        // Convert ClimbPost to Post format
        const userPosts: Post[] = climbPosts.map((cp) => ({
          id: cp.id,
          username: 'You',
          content: cp.description,
          timestamp: formatTimestamp(cp.createdAt),
          videoUri: cp.videoUri,
          location: cp.metadata.location,
          difficulty: cp.metadata.difficulty + (cp.metadata.color ? ` ${cp.metadata.color}` : ''),
          color: cp.metadata.color,
          annotations: cp.annotations,
        }));
        
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

  const pickVideo = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload videos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
    }
  };

    const filteredPosts = useMemo(() => {
    let base = posts;
  
    // gym filter
    if (selectedGym && selectedGym !== 'All Gyms') {
      const s = selectedGym.trim().toLowerCase();
      base = base.filter((p) => p.location && p.location.trim().toLowerCase() === s);
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
  
    // grade filter
    if (selectedGrade && selectedGrade !== 'All Grades') {
      const g = selectedGrade.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.difficulty) return false;
        const grade = p.difficulty.split(' ')[0].toLowerCase(); // e.g. 'v5'
        return grade === g;
      });
    }
  
    // color filter
    if (selectedColor && selectedColor !== 'All Colors') {
      const c = selectedColor.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.difficulty) return false;
        const parts = p.difficulty.split(' ');
        const color = parts.length > 1 ? parts.slice(1).join(' ').toLowerCase() : '';
        return color === c;
      });
    }
  
    return base;
  }, [posts, selectedGym, searchQuery, selectedGrade, selectedColor]);


  return (
    <View style={styles.container}>

      {/* Header / Add Post Section */}
      <View style={styles.addPostContainer}>
        <Text style={styles.locationLabel}>Your location</Text>
        <Text style={styles.locationText}>Philadelphia, PA, 19104</Text>

        {/* Gyms dropdown */}
        <View style={styles.gymRow}>
          <TouchableOpacity
            style={styles.gymDropdown}
            onPress={() => setGymDropdownOpen((s) => !s)}
            activeOpacity={0.8}
          >
            <Text style={styles.gymSelectedText}>{selectedGym}</Text>
            <Text style={styles.gymCaret}>{gymDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>
        {gymDropdownOpen && (
          <View style={styles.gymOptions}>
            {gyms.map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.gymOption}
                onPress={() => {
                  setSelectedGym(g);
                  setGymDropdownOpen(false);
                }}
              >
                <Text style={styles.gymOptionText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search climbs, users, etc."
          placeholderTextColor="#888"
          returnKeyType="search"
          multiline={false}
        />

        {/* color dropdown */}
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 12 }}>
          <View style={{ width: '48%', position: 'relative', overflow: 'visible' }}>
            <Text style={{ fontSize: 12, color: '#6B7885', marginBottom: 6 }}>Color</Text>
              <TouchableOpacity
                ref={colorBtnRef}
                style={styles.gymDropdown}
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
                }}
                activeOpacity={0.8}
              >
              <Text style={styles.gymSelectedText}>{selectedColor}</Text>
              <Text style={styles.gymCaret}>{colorDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
        
          {/* grade dropdown */}
          </View>
        
          <View style={{ width: '48%', position: 'relative', overflow: 'visible' }}>
            <Text style={{ fontSize: 12, color: '#6B7885', marginBottom: 6 }}>Grade</Text>
              <TouchableOpacity
                ref={gradeBtnRef}
                style={styles.gymDropdown}
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
                }}
                activeOpacity={0.8}
            >
              <Text style={styles.gymSelectedText}>{selectedGrade}</Text>
              <Text style={styles.gymCaret}>{gradeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
        
          </View>
        </View>

        <Text style={styles.title}>Recent Activity</Text>

        {selectedVideo && (
          <View style={styles.videoPreviewContainer}>
            <Text style={styles.videoPreviewText}>Video ready to post</Text>
            <TouchableOpacity onPress={() => setSelectedVideo(null)}>
              <Text style={styles.removeVideoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feed */}
      <ScrollView style={styles.feed}>
        {filteredPosts.map((post) => (
          <View key={post.id} style={styles.postCardHorizontal}>
            {/* Left: fixed-size video box */}
            <View style={styles.postVideoWrapper}>
              {post.videoUri && post.annotations && post.annotations.length > 0 ? (
                <VideoAnnotation
                  videoUri={typeof post.videoUri === 'string' ? post.videoUri : ''}
                  annotations={post.annotations}
                  readonly={true}
                />
              ) : post.videoUri ? (
                <Video
                  source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
                  style={styles.postVideoInner}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                />
              ) : (
                <View style={styles.postVideoPlaceholderSmall} />
              )}
            </View>

            {/* Right: content */}
            <View style={styles.postBody}>
              <View style={styles.postHeaderRow}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={post.avatar ? (typeof post.avatar === 'string' ? { uri: post.avatar } : post.avatar) : require('@/assets/images/default.jpg')}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.username}>{post.username}</Text>
                  <Text style={styles.timestamp}>{post.timestamp}</Text>
                </View>
              </View>

              <View style={styles.metadataContainer}>
                {post.location && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>📍</Text>
                    <Text style={styles.metadataText}>{post.location}</Text>
                  </View>
                )}
                {post.difficulty && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>🪨</Text>
                    <Text style={styles.metadataText}>{post.difficulty}</Text>
                  </View>
                )}
              </View>

              {/* {post.content && (
                <Text style={styles.postContent}>{post.content}</Text>
              )} */}
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Color dropdown modal overlay */}
      {colorDropdownOpen && (
        <Modal transparent visible={colorDropdownOpen} onRequestClose={() => setColorDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setColorDropdownOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>

            <View style={{ position: 'absolute', top: (colorBtnLayout ? colorBtnLayout.y + colorBtnLayout.height + 4 : 120), left: (colorBtnLayout ? colorBtnLayout.x : 20), width: Math.max(colorBtnLayout ? colorBtnLayout.width : 180, 180) }}>
              <ScrollView style={[styles.gymOptions, { maxHeight: 220 }]} contentContainerStyle={{ paddingVertical: 4 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.gymOption}
                    onPress={() => {
                      setSelectedColor(c);
                      setColorDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.gymOptionText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Grade dropdown modal overlay */}
      {gradeDropdownOpen && (
        <Modal transparent visible={gradeDropdownOpen} onRequestClose={() => setGradeDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setGradeDropdownOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>

            <View style={{ position: 'absolute', top: (gradeBtnLayout ? gradeBtnLayout.y + gradeBtnLayout.height + 4 : 160), left: (gradeBtnLayout ? gradeBtnLayout.x : 20), width: Math.max(gradeBtnLayout ? gradeBtnLayout.width : 180, 180) }}>
              <ScrollView style={[styles.gymOptions, { maxHeight: 300 }]} contentContainerStyle={{ paddingVertical: 4 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {gradeOptions.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.gymOption}
                    onPress={() => {
                      setSelectedGrade(g);
                      setGradeDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.gymOptionText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3D50',
  },
  addPostContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3D50',
    backgroundColor: '#F9F9F9',
    marginBottom: 5,
    minHeight: 25,
    textAlignVertical: 'top',
  },
  videoButton: {
    flex: 1,
    backgroundColor: '#2C3D50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  videoPreviewText: {
    fontSize: 14,
    color: '#2C3D50',
  },
  removeVideoText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  locationLabel: {
    fontSize: 12,
    color: '#A0B0BD',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1F3140',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  gymRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  gymDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  gymSelectedText: {
    fontSize: 15,
    color: '#2C3D50',
  },
  gymCaret: {
    fontSize: 12,
    color: '#9AA6B0',
    marginLeft: 8,
  },
  gymOptions: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    zIndex: 50,
    elevation: 6,
  },
  gymOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gymOptionText: {
    fontSize: 15,
    color: '#2C3D50',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 24,
  },
  postCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3D50',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
  },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  annotatedVideoContainer: {
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
  },
  difficultyChip: {
    backgroundColor: '#EDEFF2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 13,
    color: '#2C3D50',
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    color: '#2C3D50',
    lineHeight: 20,
    marginTop: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#2C3D50',
    borderColor: '#2C3D50',
  },
  filterChipText: {
    fontSize: 13,
    color: '#2C3D50',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
