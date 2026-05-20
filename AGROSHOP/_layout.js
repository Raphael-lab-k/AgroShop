import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

export default function Layout() {
  return (
    <AuthProvider>
    <CartProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#186A3B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'AGROSHOP' }} />
        <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
        <Stack.Screen name="payment" options={{ title: 'Checkout' }} />
          <Stack.Screen name="login" options={{ title: 'Login' }} />
          <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
          <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
          <Stack.Screen name="orderHistory" options={{ title: 'My Orders' }} />
      </Stack>
    </CartProvider>
    </AuthProvider>
  );
}