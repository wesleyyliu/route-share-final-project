import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      username: 'Joe Bob',
      content: 'Just sent my first V5! 🎉',
      timestamp: '2 hours ago',
      videoUri: require('@/assets/videos/post1.mp4'),
      location: 'Penn Campus Recreation',
      difficulty: 'V5 Blue',
    },
    {
      id: '2',
      username: 'Carter Anderson',
      content: 'Working on crimps at the gym today!',
      timestamp: '5 hours ago',
      videoUri: require('@/assets/videos/post2.mov'),
      location: 'Tufas Boulder Lounge',
      difficulty: 'V3 Yellow',

    },
    {
      id: '3',
      username: 'Hillary Clinton',
      content: 'Great session today!',
      timestamp: '1 day ago',
      videoUri: require('@/assets/videos/post2.mov'),
      location: 'Penn Campus Recreation',
      difficulty: 'V9 Purple'
    },
  ]);
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
  
  // grades V0..V13
  const gradeOptions = ['All Grades', ...Array.from({ length: 14 }, (_, i) => `V${i}`)];
  
  // selection state for these dropdowns
  const [selectedColor, setSelectedColor] = useState<string>('All Colors');
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  
  const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);


  const pickVideo = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload videos');
      return;
    }

    // Pick video
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

        <View style={{ marginTop: 8, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6B7885', marginBottom: 6 }}>Color</Text>
            <TouchableOpacity
              style={styles.gymDropdown}
              onPress={() => setColorDropdownOpen((s) => !s)}
              activeOpacity={0.8}
            >
              <Text style={styles.gymSelectedText}>{selectedColor}</Text>
              <Text style={styles.gymCaret}>{colorDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
        
            {colorDropdownOpen && (
              <View style={styles.gymOptions}>
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
              </View>
            )}
          </View>
        
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#6B7885', marginBottom: 6 }}>Grade</Text>
            <TouchableOpacity
              style={styles.gymDropdown}
              onPress={() => setGradeDropdownOpen((s) => !s)}
              activeOpacity={0.8}
            >
              <Text style={styles.gymSelectedText}>{selectedGrade}</Text>
              <Text style={styles.gymCaret}>{gradeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
        
            {gradeDropdownOpen && (
              <View style={styles.gymOptions}>
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
              </View>
            )}
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
            {post.videoUri ? (
              <Video
                source={typeof post.videoUri === 'string' ? { uri: post.videoUri } : post.videoUri}
                style={styles.postVideoThumbnail}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            ) : (
              <View style={styles.postVideoPlaceholder} />
            )}
      
            <View style={styles.postBody}>
              <View style={styles.postHeaderRow}>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.timestamp}>{post.timestamp}</Text>
              </View>
      
              <View style={styles.metadataRow}>
                {post.location ? (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>📍</Text>
                    <Text style={styles.metadataText} numberOfLines={1} ellipsizeMode="tail">
                      {post.location}
                    </Text>
                  </View>
                ) : null}
              </View>
              
              <View style={styles.metadataRow}>
                {post.difficulty ? (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>🪨</Text>
                    <Text style={styles.metadataText} numberOfLines={1}>{post.difficulty}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
    minHeight: 30,
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
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3D50',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  postCardHorizontal: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#F9F9F9',
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  },
  postVideoThumbnail: {
    width: 120,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  postVideoPlaceholder: {
    width: 120,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E6E6E6',
  },
  postBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
    marginTop: 6,
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
});
