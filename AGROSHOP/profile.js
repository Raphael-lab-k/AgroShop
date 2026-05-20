import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
    } else {
      // If no user, redirect to login
      router.replace('/login');
    }
  }, [user, token]);

  const fetchOrders = async () => {
  };

  const handleUpdateProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message);
        // Optionally update user in AuthContext if needed
        // For now, we'll just reflect the changes locally
        setIsEditing(false);
      } else {
        Alert.alert('Update Failed', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Could not connect to server to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#186A3B" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>My Profile</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={profileEmail}
              onChangeText={setProfileEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsEditing(false)} disabled={isLoading}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.profileText}>Name: {user.name}</Text>
            <Text style={styles.profileText}>Email: {user.email}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.ordersButton} onPress={() => router.push('/orderHistory')}>
        <Text style={styles.buttonText}>My Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'skyblue', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3 },
  profileTitle: { fontSize: 22, fontWeight: 'bold', color: '#186A3B', marginBottom: 15, textAlign: 'center' },
  profileText: { fontSize: 16, marginBottom: 10, color: '#333' },
  input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#186A3B', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { backgroundColor: '#6c757d' },
  logoutButton: { backgroundColor: '#dc3545', marginTop: 30 },
  ordersButton: { backgroundColor: '#007bff', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
});