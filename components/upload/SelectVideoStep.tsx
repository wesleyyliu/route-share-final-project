import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SelectVideoStepProps {
  onSelectVideo: () => void;
}

export default function SelectVideoStep({ onSelectVideo }: SelectVideoStepProps) {
  return (
    <>
      <TouchableOpacity style={styles.uploadCard} onPress={onSelectVideo}>
        <MaterialIcons name="upload" size={64} color="#2C3D50" style={styles.uploadIcon} />
        <Text style={styles.uploadText}>Select video from</Text>
        <Text style={styles.uploadText}>camera roll</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 90,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#2C3D50',
    borderStyle: 'solid',
  },
  uploadIcon: {
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 19,
    color: '#2C3D50',
    marginBottom: 2,
    textAlign: 'center',
  },
});
