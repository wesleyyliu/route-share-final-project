import { RecordingTipsModal } from '@/components/RecordingTipsModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ConfirmationStep from '@/components/upload/ConfirmationStep';
import EditMetadataModal from '@/components/upload/EditMetadataModal';
import MetadataStep from '@/components/upload/MetadataStep';
import SelectVideoStep from '@/components/upload/SelectVideoStep';
import VideoAnnotation, { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbMetadata, ClimbPost } from '@/types/post';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type WorkflowStep = 'select' | 'metadata' | 'annotate' | 'confirm';

export default function VideoAnnotatorScreen() {
  const router = useRouter();
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('select');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<LimbAnnotation[]>([]);
  const [metadata, setMetadata] = useState<ClimbMetadata>({
    location: '',
    difficulty: '',
    color: '',
  });
  const [description, setDescription] = useState('');

  const [showTips, setShowTips] = useState<boolean>(true);

  // Dropdown states
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [difficultyDropdownOpen, setDifficultyDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

  // Edit metadata modal state
  const [showEditMetadataModal, setShowEditMetadataModal] = useState(false);

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
            // Navigate to home tab to see the new post
            router.push('/(tabs)');
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

  const handleLocationDropdownToggle = () => {
    setLocationDropdownOpen(!locationDropdownOpen);
    setDifficultyDropdownOpen(false);
    setColorDropdownOpen(false);
  };

  const handleDifficultyDropdownToggle = () => {
    setDifficultyDropdownOpen(!difficultyDropdownOpen);
    setLocationDropdownOpen(false);
    setColorDropdownOpen(false);
  };

  const handleColorDropdownToggle = () => {
    setColorDropdownOpen(!colorDropdownOpen);
    setLocationDropdownOpen(false);
    setDifficultyDropdownOpen(false);
  };

  const handleMetadataChange = (newMetadata: ClimbMetadata) => {
    setMetadata(newMetadata);
    // Close all dropdowns when a selection is made
    setLocationDropdownOpen(false);
    setDifficultyDropdownOpen(false);
    setColorDropdownOpen(false);
  };

  const handleCloseEditModal = () => {
    setLocationDropdownOpen(false);
    setDifficultyDropdownOpen(false);
    setColorDropdownOpen(false);
    setShowEditMetadataModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps='handled'
      >
        {/* Step 1: Select Video */}
        {workflowStep === 'select' && (
          <>
            {/* Small header/title similar to downloads upload.tsx */}
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title}>
                Upload & Annotate
              </ThemedText>
            </ThemedView>

            <Text style={styles.instructions}>
              Upload a climbing video and tap on limbs (hands and feet) to annotate them!
            </Text>

            <SelectVideoStep onSelectVideo={pickVideo} />
          </>
        )}

        {/* Step 2: Add Metadata */}
        {workflowStep === 'metadata' && videoUri && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={resetWorkflow}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <MetadataStep
              videoUri={videoUri}
              metadata={metadata}
              onMetadataChange={handleMetadataChange}
              locationDropdownOpen={locationDropdownOpen}
              difficultyDropdownOpen={difficultyDropdownOpen}
              colorDropdownOpen={colorDropdownOpen}
              onLocationDropdownToggle={handleLocationDropdownToggle}
              onDifficultyDropdownToggle={handleDifficultyDropdownToggle}
              onColorDropdownToggle={handleColorDropdownToggle}
              onContinue={handleMetadataComplete}
            />
          </>
        )}

        {/* Step 3: Annotate Video */}
        {workflowStep === 'annotate' && videoUri && (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setWorkflowStep('metadata')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.videoContainerWithMargin}>
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

            <ConfirmationStep
              videoUri={videoUri}
              annotations={annotations}
              metadata={metadata}
              description={description}
              onDescriptionChange={setDescription}
              onEditMetadata={() => setShowEditMetadataModal(true)}
              onPost={handlePost}
            />
          </>
        )}
      </ScrollView>

      {/* Edit Metadata Modal */}
      <EditMetadataModal
        visible={showEditMetadataModal}
        metadata={metadata}
        onMetadataChange={handleMetadataChange}
        locationDropdownOpen={locationDropdownOpen}
        difficultyDropdownOpen={difficultyDropdownOpen}
        colorDropdownOpen={colorDropdownOpen}
        onLocationDropdownToggle={handleLocationDropdownToggle}
        onDifficultyDropdownToggle={handleDifficultyDropdownToggle}
        onColorDropdownToggle={handleColorDropdownToggle}
        onClose={handleCloseEditModal}
      />

      {/* Recording tips modal (brought over from downloads/upload.tsx) */}
      <RecordingTipsModal
        visible={showTips}
        onClose={() => setShowTips(false)}
        onFinished={async () => {
          setShowTips(false);
        }}
      />
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
    backgroundColor: '#ffffffff',
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 28,
    color: '#2C3D50',
  },
  videoContainerWithMargin: {
    flex: 1,
    marginTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2C3D50',
    backgroundColor: 'transparent',
  },
  instructions: {
    fontSize: 15,
    color: '#2C3D50',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
});
