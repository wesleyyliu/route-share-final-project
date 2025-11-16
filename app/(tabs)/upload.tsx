import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import VideoAnnotation, { LimbAnnotation } from '@/components/VideoAnnotation';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VideoAnnotatorScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<LimbAnnotation[]>([]);

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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {!videoUri && (
        <>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              Upload & Annotate
            </ThemedText>
          </ThemedView>

          <Text style={styles.instructions}>
            Upload a climbing video and tap on limbs (hands and feet) to annotate them!
          </Text>

          <TouchableOpacity style={styles.button} onPress={pickVideo}>
            <Text style={styles.buttonText}>Select Video from Camera Roll</Text>
          </TouchableOpacity>
        </>
      )}

        {videoUri && (
          <View style={styles.videoContainer}>
            <VideoAnnotation
              videoUri={videoUri}
              annotations={annotations}
              onAnnotationsChange={setAnnotations}
            />
          </View>
        )}
      </ScrollView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    marginTop: 0,
  },
});
