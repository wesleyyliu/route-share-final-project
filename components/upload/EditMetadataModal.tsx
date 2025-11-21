import { ClimbMetadata } from '@/types/post';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MetadataDropdowns from './MetadataDropdowns';

interface EditMetadataModalProps {
  visible: boolean;
  metadata: ClimbMetadata;
  onMetadataChange: (metadata: ClimbMetadata) => void;
  locationDropdownOpen: boolean;
  difficultyDropdownOpen: boolean;
  colorDropdownOpen: boolean;
  onLocationDropdownToggle: () => void;
  onDifficultyDropdownToggle: () => void;
  onColorDropdownToggle: () => void;
  onClose: () => void;
}

export default function EditMetadataModal({
  visible,
  metadata,
  onMetadataChange,
  locationDropdownOpen,
  difficultyDropdownOpen,
  colorDropdownOpen,
  onLocationDropdownToggle,
  onDifficultyDropdownToggle,
  onColorDropdownToggle,
  onClose,
}: EditMetadataModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackButton} onPress={onClose}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Climb Details</Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <MetadataDropdowns
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              locationDropdownOpen={locationDropdownOpen}
              difficultyDropdownOpen={difficultyDropdownOpen}
              colorDropdownOpen={colorDropdownOpen}
              onLocationDropdownToggle={onLocationDropdownToggle}
              onDifficultyDropdownToggle={onDifficultyDropdownToggle}
              onColorDropdownToggle={onColorDropdownToggle}
              inModal={true}
            />

            <TouchableOpacity style={styles.modalDoneButton} onPress={onClose}>
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#2C3D50',
  },
  modalTitle: {
    fontSize: 20,
    color: '#2C3D50',
    fontWeight: '600',
  },
  modalDoneButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalDoneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 500,
  },
});
