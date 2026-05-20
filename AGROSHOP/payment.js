import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth

// Import Constants from Expo to access environment variables
import Constants from 'expo-constants';
const PAYSTACK_PUBLIC_KEY = Constants.expoConfig.extra.paystackPublicKey;
const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;

const getPaystackCheckoutHtml = (amount, email) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <script src="https://js.paystack.co/v1/inline.js"></script>
  </head>
  <body>
    <script>
      function payWithPaystack() {
        var handler = PaystackPop.setup({
          key: '${PAYSTACK_PUBLIC_KEY}',
          email: '${email}',
          amount: ${amount},
          currency: 'NGN',
          ref: 'agroshop_' + Math.floor((Math.random() * 1000000000) + 1),
          onClose: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
          },
          callback: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', reference: response.reference }));
          }
        });
        handler.openIframe();
      }
      window.onload = payWithPaystack;
    </script>
    <div style="font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
      <h1>Opening payment...</h1>
    </div>
  </body>
</html>
`;

export default function PaymentScreen() {
  const router = useRouter();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useAuth(); // Get the current user from AuthContext
  
  const [paymentMethod, setPaymentMethod] = useState(null); // 'paystack' or 'momo'
  const [momoNumber, setMomoNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [isProcessing, setIsProcessing] = useState(false);
  const PAYMENT_EMAIL = user?.email || 'customer@agroshop.com'; // Use user's email if logged in

  const paymentHtml = useMemo(
    () => getPaystackCheckoutHtml(totalAmount * 100, PAYMENT_EMAIL),
    [totalAmount]
  );

  const pollTransactionStatus = (transactionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payment-status/${transactionId}`);
        const data = await response.json();

        if (data.status === 'success') {
          clearInterval(interval);
          finalizeSuccess('Payment confirmed via MoMo!');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsProcessing(false);
          Alert.alert('Payment Failed', 'The MoMo transaction was declined or timed out.');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000); // 2-minute timeout
  };

  const handleMoMoPayment = async () => {
    if (momoNumber.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile money number.');
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = selectedNetwork === 'MTN' 
        ? '/api/momo/initiate-payment' 
        : '/api/airtel-money/initiate-payment';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: momoNumber, amount: totalAmount, cartItems: cartItems, userId: user?.id }), // Include userId
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Request Sent', 'Please check your phone for the PIN prompt.');
        pollTransactionStatus(data.transactionId);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', error.message);
    }
  };

  const handlePaystackMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    // Dismiss the WebView immediately after receiving a message
    setPaymentMethod(null); 

    if (data.status === 'success') {
      // Call your backend to record the successful Paystack transaction and create an Order
      fetch(`${API_BASE_URL}/api/paystack/verify-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`, // Pass token for backend authentication
        },
        body: JSON.stringify({ 
          reference: data.reference, 
          amount: totalAmount, 
          cartItems: cartItems,
          email: PAYMENT_EMAIL, // Pass email for backend record
          userId: user?.id // Include userId
        }),
      })
      .then(response => response.json())
      .then(backendData => {
        if (backendData.status === 'success') {
          finalizeSuccess('Payment successful via Paystack!');
        } else { Alert.alert('Payment Error', backendData.message || 'Failed to verify Paystack payment on backend.'); }
      }).catch(error => { console.error('Backend verification error:', error); Alert.alert('Error', 'Could not verify Paystack payment with backend.'); });
      finalizeSuccess('Payment successful via Paystack!');
    } else if (data.status === 'cancelled') {
      setPaymentMethod(null);
    }
  };

  const finalizeSuccess = (message) => {
    setIsProcessing(false);
    clearCart();
    Alert.alert('Success', message);
    router.replace('/'); // Redirect to home after success
  };

  if (paymentMethod === 'paystack') {
    return (
      <WebView
        source={{ html: paymentHtml }}
        onMessage={handlePaystackMessage}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color="#186A3B" style={styles.loader} />}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.amountText}>Total to Pay: ₦{totalAmount}</Text>
        
        <Text style={styles.label}>Select Payment Method</Text>
        <TouchableOpacity style={styles.methodButton} onPress={() => setPaymentMethod('paystack')}>
          <Text style={styles.methodButtonText}>Paystack (Cards/Bank)</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.label}>Direct Mobile Money</Text>
        <View style={styles.networkRow}>
          {['MTN', 'Airtel'].map(net => (
            <TouchableOpacity 
              key={net}
              style={[styles.netButton, selectedNetwork === net && styles.netButtonActive]}
              onPress={() => setSelectedNetwork(net)}
            >
              <Text style={[styles.netText, selectedNetwork === net && styles.netTextActive]}>{net}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., 077...)"
          keyboardType="phone-pad"
          value={momoNumber}
          onChangeText={setMomoNumber}
        />

        <TouchableOpacity 
          style={[styles.payButton, isProcessing && styles.disabledButton]} 
          onPress={handleMoMoPayment}
          disabled={isProcessing}
        >
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay with {selectedNetwork}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9ED' },
  content: { padding: 20 },
  amountText: { fontSize: 22, fontWeight: 'bold', color: '#186A3B', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  methodButton: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#186A3B', alignItems: 'center' },
  methodButtonText: { color: '#186A3B', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 30 },
  networkRow: { flexDirection: 'row', marginBottom: 15 },
  netButton: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#eee', borderRadius: 8, marginHorizontal: 5 },
  netButtonActive: { backgroundColor: '#186A3B' },
  netText: { fontWeight: 'bold', color: '#666' },
  netTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 20 },
  payButton: { backgroundColor: '#186A3B', padding: 18, borderRadius: 10, alignItems: 'center' },
  disabledButton: { backgroundColor: '#9CC4A4' },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loader: { flex: 1, justifyContent: 'center' }
});