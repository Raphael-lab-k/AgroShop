import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

/**
 * CartScreen Component
 * 
 * This screen displays the list of products currently added to the user's cart.
 * It allows for real-time quantity updates and calculates the final price
 * before redirecting to the payment screen.
 */
export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Access user from AuthContext
  const { cartItems, totalAmount, addToCart, removeFromCart } = useCart();

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to your account to complete your purchase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]);
    } else {
      router.push('/payment');
    }
  };

  // Function to render each product row in the cart
  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      {/* Display product thumbnail if available */}
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />}
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₦{item.price}</Text>
      </View>

      {/* Controls to increase, decrease, or remove quantity */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyButton}>
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyButton}>
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {cartItems.length === 0 ? (
        /* UI state when the cart has no items */
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Standard view showing cart items and the summary footer */
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
          
          {/* Summary section at the bottom of the screen */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₦{totalAmount}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton} 
              onPress={handleCheckout} // Use the new handleCheckout function
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'skyblue' }, // Changed background to sky-blue
  listContent: { padding: 20 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#163a19' },
  itemPrice: { fontSize: 14, color: '#186A3B', marginTop: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: { backgroundColor: '#eee', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { fontSize: 18, fontWeight: 'bold' },
  quantityText: { marginHorizontal: 15, fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 20, marginBottom: 30 },
  goBackButton: { backgroundColor: '#186A3B', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  goBackText: { color: '#fff', fontWeight: 'bold' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#186A3B' },
  checkoutButton: { backgroundColor: '#186A3B', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});