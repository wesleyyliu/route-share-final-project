import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserProfile {
  username: string;
  bio: string;
  defaultGym: string;
  profilePicture?: string;
  climbingSince: string;
  favoriteGrade: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('loggedIn');
    // (Optional) also clear saved user:
    // await AsyncStorage.removeItem('user');
    Alert.alert('Logged out');
    router.replace('/sign-in');
  };


  const [profile, setProfile] = useState<UserProfile>({
    username: 'ClimbingUser',
    bio: 'Just here to send it! 🧗',
    defaultGym: 'Pottruck',
    climbingSince: '2023',
    favoriteGrade: 'V5',
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const gymOptions = ['Pottruck', 'Movement', 'Tufas'];
  const gradeOptions = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13'];
  const yearOptions = Array.from({ length: 30 }, (_, i) => String(2025 - i));

  // Load profile when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const profileJson = await AsyncStorage.getItem('user_profile');
      if (profileJson) {
        const savedProfile = JSON.parse(profileJson);
        setProfile(savedProfile);
        setEditedProfile(savedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(editedProfile));
      setProfile(editedProfile);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const pickProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditedProfile({ ...editedProfile, profilePicture: result.assets[0].uri });
    }
  };

  const openEditModal = () => {
    setEditedProfile(profile);
    setIsEditModalVisible(true);
  };

  const cancelEdit = () => {
    setEditedProfile(profile);
    setIsEditModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {profile.profilePicture ? (
            <Image source={{ uri: profile.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.profilePictureText}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Username */}
        <Text style={styles.username}>{profile.username}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="info" size={20} color="#2C3D50" />
              <Text style={styles.infoLabel}>Bio</Text>
            </View>
            <Text style={styles.infoValue}>{profile.bio || 'No bio yet'}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#2C3D50" />
              <Text style={styles.infoLabel}>Default Gym</Text>
            </View>
            <Text style={styles.infoValue}>{profile.defaultGym}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color="#2C3D50" />
              <Text style={styles.infoLabel}>Climbing Since</Text>
            </View>
            <Text style={styles.infoValue}>{profile.climbingSince}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="grade" size={20} color="#2C3D50" />
              <Text style={styles.infoLabel}>Favorite Grade</Text>
            </View>
            <Text style={styles.infoValue}>{profile.favoriteGrade}</Text>
          </View>
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={cancelEdit}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={saveProfile}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Profile Picture Edit */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Profile Picture</Text>
                <TouchableOpacity style={styles.pictureEditContainer} onPress={pickProfilePicture}>
                  {editedProfile.profilePicture ? (
                    <Image
                      source={{ uri: editedProfile.profilePicture }}
                      style={styles.editProfilePicture}
                    />
                  ) : (
                    <View style={styles.editProfilePicturePlaceholder}>
                      <Text style={styles.editProfilePictureText}>
                        {editedProfile.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.cameraIconContainer}>
                    <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Username (Read-only) */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Username</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{editedProfile.username}</Text>
                </View>
              </View>

              {/* Bio */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Bio</Text>
                <TextInput
                  style={[styles.editInput, styles.bioInput]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Default Gym */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Default Gym</Text>
                <View style={styles.optionsContainer}>
                  {gymOptions.map((gym) => (
                    <TouchableOpacity
                      key={gym}
                      style={[
                        styles.optionButton,
                        editedProfile.defaultGym === gym && styles.optionButtonActive,
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, defaultGym: gym })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          editedProfile.defaultGym === gym && styles.optionTextActive,
                        ]}
                      >
                        {gym}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Climbing Since */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Climbing Since</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.optionButton,
                        styles.yearButton,
                        editedProfile.climbingSince === year && styles.optionButtonActive,
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, climbingSince: year })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          editedProfile.climbingSince === year && styles.optionTextActive,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Favorite Grade */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Favorite Grade</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {gradeOptions.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.optionButton,
                        styles.gradeButton,
                        editedProfile.favoriteGrade === grade && styles.optionButtonActive,
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, favoriteGrade: grade })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          editedProfile.favoriteGrade === grade && styles.optionTextActive,
                        ]}
                      >
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2C3D50',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profilePictureText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3D50',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3D50',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
    logoutButton: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  logoutButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3D50',
  },
  infoValue: {
    fontSize: 16,
    color: '#2C3D50',
    marginLeft: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#999',
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3D50',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editSection: {
    marginBottom: 24,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3D50',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3D50',
    backgroundColor: '#F9F9F9',
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#999',
  },
  pictureEditContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  editProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C3D50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfilePictureText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionText: {
    fontSize: 14,
    color: '#2C3D50',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  yearButton: {
    marginRight: 8,
  },
  gradeButton: {
    marginRight: 8,
  },
});
