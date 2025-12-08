import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import VideoAnnotation, { LimbAnnotation } from '@/components/VideoAnnotation';
import { ClimbMetadata } from '@/types/post';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ConfirmationStepProps {
  videoUri: string;
  annotations: LimbAnnotation[];
  metadata: ClimbMetadata;
  description: string;
  onDescriptionChange: (description: string) => void;
  onEditMetadata: () => void;
  onPost: () => void;
}

export default function ConfirmationStep({
  videoUri,
  annotations,
  metadata,
  description,
  onDescriptionChange,
  onEditMetadata,
  onPost,
}: ConfirmationStepProps) {
  return (
    <>
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
        <View style={styles.metadataHeader}>
          <Text style={styles.metadataHeaderText}>Climb Details</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEditMetadata}>
            <MaterialIcons name="edit" size={20} color="#FF6B35" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        {metadata.location && (
          <View style={styles.metadataRow}>
            <MaterialIcons name="place" size={20} color="#2C3D50" style={styles.metadataIcon} />
            <Text style={styles.confirmMetadataText}>{metadata.location}</Text>
          </View>
        )}
        {metadata.difficulty && (
          <View style={styles.metadataRow}>
            <MaterialIcons name="terrain" size={20} color="#2C3D50" style={styles.metadataIcon} />
            <Text style={styles.confirmMetadataText}>{metadata.difficulty}</Text>
          </View>
        )}
        {metadata.color && (
          <View style={styles.metadataRow}>
            <MaterialIcons name="palette" size={20} color="#2C3D50" style={styles.metadataIcon} />
            <Text style={styles.confirmMetadataText}>{metadata.color}</Text>
          </View>
        )}
      </View>

      {/* Description Input */}
      <TextInput
        style={styles.descriptionInput}
        placeholder="Add a description for your send..."
        placeholderTextColor="#999"
        value={description}
        onChangeText={onDescriptionChange}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.postButton} onPress={onPost}>
        <Text style={styles.postButtonText}>Post</Text>
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
    fontFamily: 'Poppins_700Bold',
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
  metadataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3D50',
    fontFamily: 'Poppins_700Bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    fontFamily: 'Poppins_700Bold',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    marginRight: 8,
  },
  confirmMetadataText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Poppins_700Bold',
  },
});
