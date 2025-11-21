import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ClimbMetadata } from '@/types/post';
import { ResizeMode, Video } from 'expo-av';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MetadataDropdowns from './MetadataDropdowns';

interface MetadataStepProps {
  videoUri: string;
  metadata: ClimbMetadata;
  onMetadataChange: (metadata: ClimbMetadata) => void;
  locationDropdownOpen: boolean;
  difficultyDropdownOpen: boolean;
  colorDropdownOpen: boolean;
  onLocationDropdownToggle: () => void;
  onDifficultyDropdownToggle: () => void;
  onColorDropdownToggle: () => void;
  onContinue: () => void;
}

export default function MetadataStep({
  videoUri,
  metadata,
  onMetadataChange,
  locationDropdownOpen,
  difficultyDropdownOpen,
  colorDropdownOpen,
  onLocationDropdownToggle,
  onDifficultyDropdownToggle,
  onColorDropdownToggle,
  onContinue,
}: MetadataStepProps) {
  return (
    <>
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
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      </View>

      <MetadataDropdowns
        metadata={metadata}
        onMetadataChange={onMetadataChange}
        locationDropdownOpen={locationDropdownOpen}
        difficultyDropdownOpen={difficultyDropdownOpen}
        colorDropdownOpen={colorDropdownOpen}
        onLocationDropdownToggle={onLocationDropdownToggle}
        onDifficultyDropdownToggle={onDifficultyDropdownToggle}
        onColorDropdownToggle={onColorDropdownToggle}
      />

      <TouchableOpacity style={styles.annotateButton} onPress={onContinue}>
        <Text style={styles.annotateButtonText}>annotate</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
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
  videoThumbnail: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
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
});
