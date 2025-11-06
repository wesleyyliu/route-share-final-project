import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [editBio, setEditBio] = useState('');

  const handleLogin = () => {
    if (username) {
      setBio('Climbing enthusiast!');
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsEditing(false);
    setUsername('');
    setBio('');
  };

  const handleEdit = () => {
    setEditBio(bio);
    setIsEditing(true);
  };

  const handleSave = () => {
    setBio(editBio);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#888"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Profile Display (Edit Mode)
  if (isEditing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.label}>Bio:</Text>
          <TextInput
            style={styles.input}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Enter bio"
            placeholderTextColor="#888"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Profile
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{username}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Bio:</Text>
        <Text style={styles.value}>{bio}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleEdit}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleLogout}>
        <Text style={styles.cancelButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3D50',
    marginBottom: 32,
    textAlign: 'center',
  },
  infoBox: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3D50',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: '#2C3D50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3D50',
    backgroundColor: '#F9F9F9',
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
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C3D50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#2C3D50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
