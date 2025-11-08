import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
  videoUri?: string;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      username: 'alex_climber',
      content: 'Just sent my first V5! 🎉',
      timestamp: '2 hours ago',
      videoUri: 'replace',
    },
    {
      id: '2',
      username: 'sarah_boulder',
      content: 'Working on crimps at the gym today!',
      timestamp: '5 hours ago',
      videoUri: 'replace',
    },
    {
      id: '3',
      username: 'mike_sends',
      content: 'Great session today!',
      timestamp: '1 day ago',
    },
  ]);
  const [newPost, setNewPost] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState('you');

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

  const handleAddPost = () => {
    if (newPost.trim() || selectedVideo) {
      const post: Post = {
        id: Date.now().toString(),
        username: currentUsername,
        content: newPost || 'Shared a climbing video!',
        timestamp: 'Just now',
        videoUri: selectedVideo || undefined,
      };
      setPosts([post, ...posts]);
      setNewPost('');
      setSelectedVideo(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social Feed</Text>

      {/* Add Post Section */}
      <View style={styles.addPostContainer}>
        <TextInput
          style={styles.input}
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Share your climb..."
          placeholderTextColor="#888"
          multiline
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.videoButton} onPress={pickVideo}>
            <Text style={styles.videoButtonText}>
              {selectedVideo ? '✓ Video Selected' : '📹 Pick Video'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postButton} onPress={handleAddPost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

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
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text style={styles.username}>{post.username}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            
            {post.videoUri && (
              <Video
                source={{ uri: post.videoUri }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            )}
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
    paddingHorizontal: 24,
    marginBottom: 20,
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
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
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
  postButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 16,
    color: '#2C3D50',
    lineHeight: 22,
    marginBottom: 12,
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
  },
});
