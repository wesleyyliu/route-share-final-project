import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import VideoAnnotation, { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbMetadata, ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type WorkflowStep = 'select' | 'metadata' | 'annotate' | 'confirm';

export default function VideoAnnotatorScreen() {
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('select');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<LimbAnnotation[]>([]);
  const [metadata, setMetadata] = useState<ClimbMetadata>({
    location: '',
    difficulty: '',
    color: '',
  });
  const [description, setDescription] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const pickVideo = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload videos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
      setAnnotations([]); // Reset annotations when new video is loaded
      setWorkflowStep('metadata');
    }
  };

  const handleMetadataComplete = () => {
    if (!metadata.location.trim()) {
      Alert.alert('Location Required', 'Please add a location for your climb');
      return;
    }
    setWorkflowStep('annotate');
  };

  const handleDoneAnnotating = () => {
    setWorkflowStep('confirm');
  };

  const handlePost = async () => {
    if (!videoUri) return;

    const post: ClimbPost = {
      id: `post_${Date.now()}`,
      videoUri,
      annotations,
      metadata,
      description,
      createdAt: Date.now(),
    };

    try {
      // Get existing posts
      const existingPostsJson = await AsyncStorage.getItem('climb_posts');
      const existingPosts: ClimbPost[] = existingPostsJson ? JSON.parse(existingPostsJson) : [];
      
      // Add new post
      existingPosts.unshift(post);
      
      // Save back
      await AsyncStorage.setItem('climb_posts', JSON.stringify(existingPosts));
      
      Alert.alert('Success!', 'Your climb has been posted', [
        {
          text: 'OK',
          onPress: () => {
            // Reset everything
            setVideoUri(null);
            setAnnotations([]);
            setMetadata({ location: '', difficulty: '', color: '' });
            setDescription('');
            setWorkflowStep('select');
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save your post');
    }
  };

  const resetWorkflow = () => {
    setVideoUri(null);
    setAnnotations([]);
    setMetadata({ location: '', difficulty: '', color: '' });
    setDescription('');
    setWorkflowStep('select');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Step 1: Select Video */}
        {workflowStep === 'select' && (
          <>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title}>
                Upload & annotate
              </ThemedText>
            </ThemedView>

            <TouchableOpacity style={styles.uploadCard} onPress={pickVideo}>
              <Text style={styles.uploadIcon}>⬆️</Text>
              <Text style={styles.uploadText}>Select video from</Text>
              <Text style={styles.uploadText}>Camera roll</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Add Metadata (Location, Difficulty, Color) */}
        {workflowStep === 'metadata' && videoUri && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={resetWorkflow}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title}>
                Upload & annotate
              </ThemedText>
            </ThemedView>

            {/* Video Thumbnail Preview */}
            <View style={styles.videoThumbnail}>
              <Video
                source={{ uri: videoUri }}
                style={styles.thumbnailVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
              />
            </View>

            {/* Location Input */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataIcon}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <TouchableOpacity 
                style={styles.metadataInput}
                onPress={() => setShowLocationSearch(true)}
              >
                <Text style={metadata.location ? styles.metadataValue : styles.metadataPlaceholder}>
                  {metadata.location || 'Add location'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Difficulty Input */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataIcon}>
                <Text style={styles.iconText}>⛰️</Text>
              </View>
              <TextInput
                style={styles.metadataInput}
                placeholder="Add difficulty"
                placeholderTextColor="#999"
                value={metadata.difficulty}
                onChangeText={(text) => setMetadata({ ...metadata, difficulty: text })}
              />
            </View>

            {/* Color Input */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataIcon}>
                <Text style={styles.iconText}>🎨</Text>
              </View>
              <TextInput
                style={styles.metadataInput}
                placeholder="Add color"
                placeholderTextColor="#999"
                value={metadata.color}
                onChangeText={(text) => setMetadata({ ...metadata, color: text })}
              />
            </View>

            <TouchableOpacity style={styles.annotateButton} onPress={handleMetadataComplete}>
              <Text style={styles.annotateButtonText}>annotate</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Annotate Video */}
        {workflowStep === 'annotate' && videoUri && (
          <>
            <TouchableOpacity 
              style={styles.backButtonAbsolute} 
              onPress={() => setWorkflowStep('metadata')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.videoContainer}>
              <VideoAnnotation
                videoUri={videoUri}
                annotations={annotations}
                onAnnotationsChange={setAnnotations}
                onDoneEditing={handleDoneAnnotating}
              />
            </View>
          </>
        )}

        {/* Step 4: Final Confirmation */}
        {workflowStep === 'confirm' && videoUri && (
          <>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setWorkflowStep('annotate')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title}>
                Confirm post
              </ThemedText>
            </ThemedView>

            {/* Video Preview */}
            <View style={styles.confirmVideoPreview}>
              <VideoAnnotation
                videoUri={videoUri}
                annotations={annotations}
                readonly={true}
              />
            </View>

            {/* Metadata Display */}
            <View style={styles.confirmMetadata}>
              {metadata.location && (
                <Text style={styles.confirmMetadataText}>📍 {metadata.location}</Text>
              )}
              {metadata.difficulty && (
                <Text style={styles.confirmMetadataText}>⛰️ {metadata.difficulty}</Text>
              )}
              {metadata.color && (
                <Text style={styles.confirmMetadataText}>🎨 {metadata.color}</Text>
              )}
            </View>

            {/* Description Input */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add a description for your send..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postButtonText}>post</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Location Search Modal */}
      <Modal
        visible={showLocationSearch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => setShowLocationSearch(false)}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add location</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={metadata.location}
              onChangeText={(text) => setMetadata({ ...metadata, location: text })}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowLocationSearch(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    height: 60,
    backgroundColor: '#2C3D50',
    width: '100%',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 60,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 28,
    color: '#2C3D50',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  metadataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  metadataIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  metadataInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  metadataPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  metadataValue: {
    fontSize: 16,
    color: '#333',
  },
  annotateButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  annotateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    marginTop: 0,
  },
  confirmVideoPreview: {
    marginBottom: 20,
  },
  confirmMetadata: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  confirmMetadataText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  postButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    minHeight: 300,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    color: '#2C3D50',
    marginBottom: 20,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  modalDoneButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
