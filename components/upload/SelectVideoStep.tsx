import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SelectVideoStepProps {
  onSelectVideo: () => void;
}

export default function SelectVideoStep({ onSelectVideo }: SelectVideoStepProps) {
  return (
    <>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          Upload & annotate
        </ThemedText>
      </ThemedView>

      <TouchableOpacity style={styles.uploadCard} onPress={onSelectVideo}>
        <MaterialIcons name="upload" size={64} color="#999" style={styles.uploadIcon} />
        <Text style={styles.uploadText}>Select video from</Text>
        <Text style={styles.uploadText}>Camera roll</Text>
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
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
});
