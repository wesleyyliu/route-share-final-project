import ActivityCard from '@/components/ActivityCard';
import { ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
}

export default function HomeScreen() {
  const gyms = [
    'All Gyms',
    'Movement',
    'Tufas',
    'Pottruck',
  ];
  const [selectedGym, setSelectedGym] = useState<string>(gyms[0]);
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);

  const defaultPosts: Post[] = [
    {
      id: '1',
      username: 'Joe Bob',
      content: 'Just sent my first V5! 🎉',
      timestamp: '2 days ago',
      videoUri: require('@/assets/videos/post1.mp4'),
      location: 'Penn Campus Recreation',
      difficulty: 'V5',
      color: 'Blue',
    },
    {
      id: '2',
      username: 'Carter Anderson',
      content: 'Working on crimps at the gym today!',
      timestamp: '5 days ago',
      videoUri: require('@/assets/videos/post2.mov'),
      location: 'Tufas Boulder Lounge',
      difficulty: 'V3',
      color: 'Yellow',
    },
    {
      id: '3',
      username: 'Hillary Clinton',
      content: 'Great session today!',
      timestamp: '6 days ago',
      videoUri: require('@/assets/videos/post2.mov'),
      location: 'Movement Callowhill',
      difficulty: 'V9',
      color: 'Purple',
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
          difficulty: cp.metadata.difficulty,
          color: cp.metadata.color,
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

    // grade filter
    if (selectedGrade && selectedGrade !== 'All Grades') {
      const g = selectedGrade.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.difficulty) return false;
        const grade = p.difficulty.toLowerCase();
        return grade === g;
      });
    }

    // color filter
    if (selectedColor && selectedColor !== 'All Colors') {
      const c = selectedColor.trim().toLowerCase();
      base = base.filter((p) => {
        if (!p.color) return false;
        return p.color.toLowerCase() === c;
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.locationLabel}>Your location</Text>
        <Text style={styles.locationText}>Philadelphia, PA, 19104</Text>

        {/* Search Input */}
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search climbs"
          placeholderTextColor="#888"
          returnKeyType="search"
        />

        {/* Gym Dropdown */}
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

        {/* Color and Grade Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Color</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setColorDropdownOpen(!colorDropdownOpen);
                setGymDropdownOpen(false);
                setGradeDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{selectedColor}</Text>
              <Text style={styles.caret}>{colorDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {colorDropdownOpen && (
              <View style={styles.dropdownOptions}>
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
              </View>
            )}
          </View>

          <View style={styles.filterColumn}>
            <Text style={styles.filterLabel}>Grade</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setGradeDropdownOpen(!gradeDropdownOpen);
                setGymDropdownOpen(false);
                setColorDropdownOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{selectedGrade}</Text>
              <Text style={styles.caret}>{gradeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {gradeDropdownOpen && (
              <View style={styles.dropdownOptions}>
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
              </View>
            )}
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
            onPress={() => handlePostPress(post.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#3D5366',
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
    backgroundColor: '#2C3D50',
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
});
