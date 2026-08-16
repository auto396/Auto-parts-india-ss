import React from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';

import HomeScreen from '../screens/HomeScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SellPartScreen from '../screens/SellPartScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ user }: { user: any }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565FF',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="home" iconColor={color} size={size} style={styles.iconBtn} />
          )
        }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="SellTab" 
        options={{ 
          title: 'Sell Part',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="plus-circle" iconColor={color} size={size} style={styles.iconBtn} />
          )
        }}
      >
        {(props) => <SellPartScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="ChatsTab" 
        options={{ 
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="message-text" iconColor={color} size={size} style={styles.iconBtn} />
          )
        }}
      >
        {(props) => <ChatsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="ProfileTab" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <IconButton icon="account" iconColor={color} size={size} style={styles.iconBtn} />
          )
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }: { user: any }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1220' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        options={{ headerShown: false }}
      >
        {(props) => <TabNavigator {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="ProductDetail" 
        options={{ title: 'Part Details' }}
      >
        {(props) => <ProductDetailScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="ChatRoom" 
        options={{ title: 'Conversation' }}
      >
        {(props) => <ChatRoomScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
        options={{ title: 'Account Sign In' }}
      />

      <Stack.Screen 
        name="SellerProfile" 
        component={SellerProfileScreen}
        options={{ title: 'Seller Profile' }}
      />

      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{ title: 'Admin Moderation' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    margin: 0,
    padding: 0,
  },
});
