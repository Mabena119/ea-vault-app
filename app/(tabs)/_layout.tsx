import { Tabs } from "expo-router";
import { Home, Settings, TrendingUp } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import { useApp } from "@/providers/app-provider";

export default function TabLayout() {
  const { isFirstTime } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isFirstTime ? {
          display: 'none',
        } : {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          height: 70,
          backgroundColor: 'transparent',
          borderRadius: 25,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 25,
          paddingBottom: 10,
          paddingTop: 10,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 25,
              backgroundColor: 'rgba(134, 188, 209, 0.3)',
              overflow: 'hidden',
            }}
          />
        ),
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: "QUOTES",
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="metatrader"
        options={{
          title: "METATRADER",
          tabBarIcon: ({ color }) => <Settings color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}