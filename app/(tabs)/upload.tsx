import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Checkpoint {
  time: number;
  note: string;
}

export default function VideoAnnotatorScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [showCheckpointForm, setShowCheckpointForm] = useState(false);
  const videoRef = useRef<any>(null);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handlePause = () => setPaused(true);
  const handlePlay = () => setPaused(false);

  const addCheckpoint = () => {
    if (currentNote.trim()) {
      setCheckpoints([...checkpoints, { time: currentTime, note: currentNote }]);
      setCurrentNote('');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status && typeof status.positionMillis === 'number') {
      setCurrentTime(status.positionMillis / 1000);
    }

    if (status.isPlaying) {
        setShowCheckpointForm(false);
    } 
  };

  const seekTo = async (time: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(time * 1000);
      setPaused(true);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          Upload & Annotate
        </ThemedText>
      </ThemedView>

      <TouchableOpacity style={styles.button} onPress={pickVideo}>
        <Text style={styles.buttonText}>Select Video from Camera Roll</Text>
      </TouchableOpacity>

      {videoUri && (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            shouldPlay={paused}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            useNativeControls
          />
          <View style={styles.controlsColumn}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                if (videoRef.current) {
                    videoRef.current.pauseAsync(); // pause the video
                }
                setPaused(true);
                setShowCheckpointForm(!showCheckpointForm);
                }}
            >
                <Text style={styles.buttonText}>
                {showCheckpointForm ? 'Cancel' : 'Add Hold'}
                </Text>
            </TouchableOpacity>

            {showCheckpointForm && (
                <View style={styles.checkpointContainer}>
                <ThemedText type="defaultSemiBold" style={styles.checkpointLabel}>
                    Leave a Comment? {currentTime.toFixed(2)}s
                </ThemedText>
                <TextInput
                    style={styles.input}
                    placeholder="Add notes (hand holds, tips, etc.)"
                    value={currentNote}
                    onChangeText={setCurrentNote}
                    multiline
                />
                <TouchableOpacity style={styles.button} onPress={addCheckpoint}>
                    <Text style={styles.buttonText}>Save Checkpoint</Text>
                </TouchableOpacity>
                </View>
            )}
            </View>

        </View>
      )}

      <View style={styles.checkpointList}>
        <ThemedText type="title" style={styles.listHeader}>
          Checkpoints
        </ThemedText>
        {checkpoints.map((item, i) => (
          <View key={i} style={styles.checkpointItem}>
            <ThemedText
              type="defaultSemiBold"
              onPress={() => seekTo(item.time)}
              style={styles.checkpointTime}
            >
              {item.time.toFixed(2)}s
            </ThemedText>
            <ThemedText style={styles.checkpointNote}>{item.note}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  videoContainer: {
    marginVertical: 20,
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  controlsColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 12,
  },
  checkpointContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  checkpointLabel: { fontWeight: 'bold', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
    minHeight: 40,
    backgroundColor: '#fff',
  },
  checkpointList: { marginTop: 20 },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  checkpointTime: {
    fontWeight: 'bold',
    marginRight: 12,
    color: '#007AFF',
    minWidth: 60,
  },
  checkpointNote: { flex: 1 },
  listHeader: { fontWeight: 'bold', marginBottom: 10, fontSize: 18 },
});
