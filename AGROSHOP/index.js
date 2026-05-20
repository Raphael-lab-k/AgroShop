import React, { useState, useMemo } from 'react';
import { FlatList, View, Text, Image, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import products from '../constants/products'; // Import products from the new file
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const { user, logout } = useAuth(); // Get user and logout function

  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search query (name or category)
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.category && item.category.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleProfilePress = () => {
    if (user) {
      router.push('/profile');
    } else {
      Alert.alert('Login Required', 'Please log in to view your profile.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen 
        options={{
          headerRight: () => ( // Defines the right-hand side of the header
            <TouchableOpacity onPress={() => router.push('/cart')} style={styles.headerCartButton}>
              <Ionicons name="cart-outline" size={26} color="#fff" />
              {cartItems.length > 0 && ( // Only show badge if there are items in the cart
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }} 
      />

      <TextInput
        style={styles.searchBar}
        placeholder="Search by name or category..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />

      <TouchableOpacity 
        style={[styles.fab, styles.cartFab]} 
        onPress={() => router.push('/cart')}
      >
        <Text style={styles.cartText}>My Cart ({cartItems.length})</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {item.imageUrl && <Image style={styles.productImage} source={{ uri: item.imageUrl }} />}
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₦{item.price}</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity 
        style={[styles.fab, styles.profileFab]} 
        onPress={handleProfilePress}
      >
        <Text style={styles.profileText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'skyblue' }, // Changed background to sky-blue
  searchBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fab: { // Base style for Floating Action Buttons
    position: 'absolute',
    backgroundColor: '#186A3B',
    padding: 15,
    borderRadius: 30,
    zIndex: 1,
    elevation: 5,
  },
  cartFab: {
    bottom: 20,
    right: 20,
  },
  profileFab: {
    bottom: 90, // Position above the cart button
    right: 20,
    backgroundColor: '#3498db', // Different color for distinction
  },
  cartText: { color: '#fff', fontWeight: 'bold' },
  profileText: { color: '#fff', fontWeight: 'bold' },
  headerCartButton: { // Style for the cart icon in the header
    marginRight: 15,
    position: 'relative', // Needed for absolute positioning of the badge
  },
  cartBadge: { // Style for the badge itself
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  productCard: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 10 },
  productImage: { width: '100%', height: 150, borderRadius: 10 },
  productName: { fontSize: 16, fontWeight: 'bold', marginVertical: 5 },
  productPrice: { color: '#186A3B', fontWeight: 'bold' },
  addButton: { backgroundColor: '#186A3B', padding: 10, borderRadius: 5, marginTop: 10 },
  addButtonText: { color: '#fff', textAlign: 'center' },
});