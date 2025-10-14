import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { RobotLogo } from './robot-logo';

interface CustomLoadingScreenProps {
    message?: string;
}

export function CustomLoadingScreen({ message = "Loading EA Migrate..." }: CustomLoadingScreenProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <RobotLogo size={120} />
                <Text style={styles.title}>EA MIGRATE</Text>
                <Text style={styles.message}>{message}</Text>

                {/* Loading dots animation */}
                <View style={styles.loadingContainer}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                </View>

                <Text style={styles.subtitle}>
                    {Platform.OS === 'web' ? 'Preparing your trading environment...' : 'Initializing...'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20,
        letterSpacing: 2,
    },
    message: {
        fontSize: 16,
        color: '#CCCCCC',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 4,
    },
    dot1: {
        opacity: 0.4,
        // Animation would be handled by CSS on web or Animated API on native
    },
    dot2: {
        opacity: 0.7,
    },
    dot3: {
        opacity: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
