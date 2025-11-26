import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'loggedIn' | 'loggedOut'>('loading');

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await AsyncStorage.getItem('loggedIn');
      if (loggedIn === 'true') {
        setStatus('loggedIn');
      } else {
        setStatus('loggedOut');
      }
    };

    checkAuth();
  }, []);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'loggedIn') {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/sign-in" />;
}
