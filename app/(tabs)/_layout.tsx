import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',      
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 72,
        },
        tabBarActiveTintColor: '#2C3D50',  
        tabBarInactiveTintColor: '#B3B3B3' 
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post/[id]"
        options={{
          title: 'Post',
          href: null, // Hide from tab bar but keep accessible via navigation
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post/interactive/[id]"
        options={{
          title: 'Interactive',
          href: null, // Hide from tab bar but keep accessible via navigation
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="touch-app" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
