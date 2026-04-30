import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';

import type { RootStackParamList, MainTabParamList } from '../types';

// ─── Screens ──────────────────────────────────────────────────────────────────
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { AyahScreen } from '../screens/AyahScreen';
import { ReflectionScreen } from '../screens/ReflectionScreen';
import { CollectionsScreen } from '../screens/CollectionsScreen';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { CreateCollectionScreen } from '../screens/CreateCollectionScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            ForYou: ['home', 'home-outline'],
            Collections: ['albums', 'albums-outline'],
            Progress: ['bar-chart', 'bar-chart-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={(focused ? active : inactive) as any}
                size={size}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="ForYou" component={AyahScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ title: 'Collections' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: '#F5F7F2' },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Reflection"
          component={ReflectionScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="CollectionDetail"
          component={CollectionDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="CreateCollection"
          component={CreateCollectionScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: '#E8F5E9',
  },
});
