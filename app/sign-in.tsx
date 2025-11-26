import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
      const stored = await AsyncStorage.getItem('user');

      if (!stored) {
        alert('No account found. Please sign up first.');
        return;
      }

      const saved = JSON.parse(stored) as { username: string; password: string };
      const enteredUsername = username.trim();

      if (enteredUsername !== saved.username || password !== saved.password) {
        alert('Incorrect username or password');
        return;
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
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
  },
  link: {
    textAlign: 'center',
    color: '#2C3D50',
    marginTop: 4,
  },
});
