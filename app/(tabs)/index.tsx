import ActivityCard from '@/components/ActivityCard';
import { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import {
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

export default function HomeScreen() {
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

  const gradeOptions = ['All Grades', ...Array.from({ length: 14 }, (_, i) => `V${i}`)];

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

        const userPosts: Post[] = climbPosts.map((cp) => ({
          id: cp.id,
          username: 'You',
          content: cp.description,
          timestamp: formatTimestamp(cp.createdAt),
          videoUri: cp.videoUri,
          location: cp.metadata.location,
          difficulty: cp.metadata.difficulty,
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
    // TODO: Navigate to post detail page
    console.log('Post pressed:', postId);
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
            style={styles.dropdown}
            onPress={() => {
              setGymDropdownOpen(!gymDropdownOpen);
              setColorDropdownOpen(false);
              setGradeDropdownOpen(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{selectedGym}</Text>
            <Text style={styles.caret}>{gymDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>
        {gymDropdownOpen && (
          <View style={styles.dropdownOptions}>
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
          </View>
        )}

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
  },
  locationText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#203247ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
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
  },
  caret: {
    fontSize: 12,
    color: '#9AA6B0',
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
  postContent: {
    fontSize: 15,
    color: '#2C3D50',
    lineHeight: 20,
    marginTop: 6,
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
});
