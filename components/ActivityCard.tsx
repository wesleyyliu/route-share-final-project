import { ResizeMode, Video } from 'expo-av';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActivityCardProps {
  username: string;
  location: string;
  difficulty: string;
  color?: string;
  timestamp: string;
  videoUri: string | number;
  onPress?: () => void;
}

export default function ActivityCard({
  username,
  location,
  difficulty,
  color,
  timestamp,
  videoUri,
  onPress,
}: ActivityCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.videoThumbnail}>
        {typeof videoUri === 'string' ? (
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
        ) : (
          <Video
            source={videoUri}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataIcon}>📍</Text>
          <Text style={styles.metadataText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataIcon}>🪨</Text>
          <Text style={styles.metadataText}>
            {difficulty} {color}
          </Text>
        </View>

        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    marginRight: 12,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3D50',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metadataIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7885',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
