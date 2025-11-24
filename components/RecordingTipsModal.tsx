import { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecordingTipsModalProps {
  visible: boolean;
  onClose: () => void;
  onFinished: () => void;
}

export function RecordingTipsModal({ visible, onClose, onFinished }: RecordingTipsModalProps) {
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: 'Recording tips:',
      text: 'Record vertically, not horizontally.',
      leftImage: require('../assets/images/slide2-wrong.png'),
      rightImage: require('../assets/images/slide2-right.png'),
    },
  ];

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      setIndex(0);
      onFinished();
    }
  };

  const slide = slides[index];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.text}</Text>

          <View style={styles.imageRow}>
            <Image source={slide.leftImage} style={styles.image} />
            <Image source={slide.rightImage} style={styles.image} />
          </View>

          {index < slides.length - 1 && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
    color: '#555',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  nextButton: {
    backgroundColor: '#2C3D50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
