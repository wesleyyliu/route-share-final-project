import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    console.log('Sign in pressed');

    if (!username.trim() || !password.trim()) {
      alert('Please enter a username and password');
      return;
    }

    try {
      const enteredUsername = username.trim();

      // Load users map
      const usersJson = await AsyncStorage.getItem('users_map');
      let usersMap: Record<string, { username: string; password: string }> = usersJson ? JSON.parse(usersJson) : {};
      let savedUser = usersMap[enteredUsername];

      if (!savedUser) {
        const legacyUserJson = await AsyncStorage.getItem('user');
        if (legacyUserJson) {
          const legacyUser = JSON.parse(legacyUserJson);
          if (legacyUser.username === enteredUsername) {
            // Migrate legacy user to users_map
            savedUser = legacyUser;
            usersMap[enteredUsername] = legacyUser;
            await AsyncStorage.setItem('users_map', JSON.stringify(usersMap));
          }
        }
      }

      if (!savedUser) {
        alert('No account found with that username. Please sign up first.');
        return;
      }

      if (password !== savedUser.password) {
        alert('Incorrect password');
        return;
      }

      // Set current logged in user
      await AsyncStorage.setItem('current_user', enteredUsername);

      // Load this user's profile and set it as active
      let userProfileJson = await AsyncStorage.getItem(`user_profile_${enteredUsername}`);
      
      // If per-user profile doesn't exist, try to use/migrate the legacy profile
      if (!userProfileJson) {
        const legacyProfileJson = await AsyncStorage.getItem('user_profile');
        if (legacyProfileJson) {
          const legacyProfile = JSON.parse(legacyProfileJson);
          // Only use if the username matches
          if (legacyProfile.username === enteredUsername) {
            userProfileJson = legacyProfileJson;
            // Save to per-user key for future logins
            await AsyncStorage.setItem(`user_profile_${enteredUsername}`, legacyProfileJson);
          }
        }
      }
      
      if (userProfileJson) {
        await AsyncStorage.setItem('user_profile', userProfileJson);
      } else {
        // Create a new profile if none exists
        const newProfile = {
          username: enteredUsername,
          bio: 'Just here to send it! 🧗',
          defaultGym: undefined,
          joinedOn: new Date().toISOString(),
          currentGrade: undefined,
          profilePicture: undefined,
          height: undefined,
        };
        const newProfileJson = JSON.stringify(newProfile);
        await AsyncStorage.setItem('user_profile', newProfileJson);
        await AsyncStorage.setItem(`user_profile_${enteredUsername}`, newProfileJson);
      }

      await AsyncStorage.setItem('loggedIn', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Sign-in error:', e);
      alert('Error signing in. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/sign-up')}>
        <Text style={styles.link}>Need an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3D50',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  button: {
    backgroundColor: '#2C3D50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_700Bold',
  },
  link: {
    textAlign: 'center',
    color: '#2C3D50',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});
