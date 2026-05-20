import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

const products = [
  {
    id: 'p1',
    name: 'NPK 20-20-20 Fertilizer',
    category: 'Fertilizer',
    price: 5400,
    description: 'Balanced nutrient fertilizer for cereal and vegetable crops.',
    imageUrl: 'https://images.unsplash.com/photo-1516707570260-5f6f0a0f4f10?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p2',
    name: 'Glyphosate Herbicide',
    category: 'Herbicide',
    price: 9400,
    description: 'Effective weed control for broadleaf weeds and grasses.',
    imageUrl: 'https://images.unsplash.com/photo-1525347111598-0547a39aa5b7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p3',
    name: 'Insecticide for Crop Protection',
    category: 'Insecticide',
    price: 7400,
    description: 'Controls common pests on maize, beans, and vegetables.',
    imageUrl: 'https://images.unsplash.com/photo-1486536243991-9f6a86f1ff5b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p4',
    name: 'Seed Treatment Solution',
    category: 'Seeds',
    price: 3500,
    description: 'Protects newly sown seeds from pathogens and insects.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p5',
    name: 'Urea 46% Nitrogen',
    category: 'Fertilizer',
    price: 6300,
    description: 'High-nitrogen fertilizer for fast leafy growth in cereals and vegetables.',
    imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p6',
    name: 'Potash Muriate 60',
    category: 'Fertilizer',
    price: 6900,
    description: 'Potassium-rich fertilizer for strong roots and fruit development.',
    imageUrl: 'https://images.unsplash.com/photo-1524594154901-c8ab383d52aa?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p17',
    name: 'Diammonium Phosphate (DAP) 18-46-0',
    category: 'Fertilizer',
    price: 7300,
    description: 'Phosphorus-rich fertilizer ideal for early root development and flowering.',
    imageUrl: 'https://images.unsplash.com/photo-1545462966-69cae58f5882?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p18',
    name: 'Calcium Nitrate 15.5-0-0',
    category: 'Fertilizer',
    price: 7100,
    description: 'Calcium and nitrogen fertilizer for stronger stems and improved fruit quality.',
    imageUrl: 'https://images.unsplash.com/photo-1548841452-9cf5bdc9e4c6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p19',
    name: 'Sulphate of Potash (SOP)',
    category: 'Fertilizer',
    price: 8200,
    description: 'Potassium and sulfur fertilizer for premium crop quality and stress resistance.',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p7',
    name: 'Pre-emergent Weed Killer',
    category: 'Herbicide',
    price: 10100,
    description: 'Prevents weed germination in crop beds and field margins.',
  },
  {
    id: 'p8',
    name: 'Fungicide Spray',
    category: 'Fungicide',
    price: 7800,
    description: 'Protects against leaf spot, blight, and powdery mildew.',
  },
  {
    id: 'p9',
    name: 'Organic Soil Conditioner',
    category: 'Soil Health',
    price: 4100,
    description: 'Improves soil structure, moisture retention, and microbial activity.',
  },
  {
    id: 'p10',
    name: 'Foliar Nutrient Spray',
    category: 'Plant Nutrition',
    price: 4300,
    description: 'Fast-acting micronutrient spray for healthy leaves and crops.',
  },
  {
    id: 'p11',
    name: 'Certified Maize Seed',
    category: 'Seeds',
    price: 2700,
    description: 'High-yield maize seeds selected for local conditions and disease resistance.',
  },
  {
    id: 'p12',
    name: 'Hybrid Tomato Seed',
    category: 'Seeds',
    price: 2200,
    description: 'Early-maturing tomato variety for fresh market production.',
  },
  {
    id: 'p13',
    name: 'Handheld Weeder',
    category: 'Tools',
    price: 3500,
    description: 'Comfort-grip weeder suitable for small plots and garden maintenance.',
  },
  {
    id: 'p14',
    name: 'Pruning Shears',
    category: 'Tools',
    price: 4600,
    description: 'Durable pruning shears for pruning fruit trees and shrubs.',
  },
  {
    id: 'p15',
    name: 'Layer Mash Feed',
    category: 'Animal Feed',
    price: 6300,
    description: 'Balanced feed for laying hens with vitamins and protein for strong eggs.',
  },
  {
    id: 'p16',
    name: 'Pig Grower Pellet',
    category: 'Animal Feed',
    price: 7700,
    description: 'High-energy grower feed formulated for healthy pig weight gain.',
  },
];

const PAYSTACK_PUBLIC_KEY = 'pk_test_replace_with_your_key';
const PAYMENT_EMAIL = 'customer@agroshop.com';
const API_BASE_URL = 'http://10.0.2.2:3000'; // Use your local IP address if testing on a physical device

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
      <p>If the Paystack window does not appear, please reload the app and try again.</p>
    </div>
  </body>
</html>
`;

export default function App() {
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'paystack' or 'momo'
  const [momoNumber, setMomoNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const paymentAmount = totalAmount * 100;
  const paymentHtml = useMemo(
    () => getPaystackCheckoutHtml(paymentAmount, PAYMENT_EMAIL),
    [paymentAmount]
  );

  const addToCart = product => {
    setCart(prev => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  const removeFromCart = productId => {
    setCart(prev => {
      if (!prev[productId]) return prev;
      if (prev[productId].quantity > 1) {
        return { ...prev, [productId]: { ...prev[productId], quantity: prev[productId].quantity - 1 } };
      } else {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setPaymentStatus('empty');
      return;
    }

    setPaymentStatus(null);
    setPaymentReference(null);
    setShowPayment(true);
  };

  const resetPaymentFlow = () => {
    setShowPayment(false);
    setPaymentMethod(null);
    setIsProcessing(false);
  };

  const pollTransactionStatus = (transactionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payment-status/${transactionId}`);
        const data = await response.json();

        if (data.status === 'success') {
          clearInterval(interval);
          setIsProcessing(false);
          setCart({});
          setShowPayment(false);
          setShowCart(false);
          setPaymentStatus('success');
          Alert.alert('Success', 'Payment confirmed! Your order is being processed.');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsProcessing(false);
          setPaymentStatus('error');
          Alert.alert('Payment Failed', 'The transaction was declined or timed out.');
        }
        // If still 'pending', do nothing and wait for next interval
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Check every 3 seconds

    // Safety: stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isProcessing) setIsProcessing(false);
    }, 120000);
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
        body: JSON.stringify({
          phoneNumber: momoNumber,
          amount: totalAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Request Sent', data.message);
        setPaymentStatus('pending');
        pollTransactionStatus(data.transactionId);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', error.message);
      setPaymentStatus('error');
    }
  };

  const handlePaymentMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === 'success') {
        setCart({});
        setShowPayment(false);
        setShowCart(false);
        setPaymentReference(data.reference);
        setPaymentStatus('success');
      } else if (data.status === 'cancelled') {
        setShowPayment(false);
        setPaymentStatus('cancelled');
      }
    } catch (error) {
      console.warn('Payment message parse error', error);
    }
  };

  if (showPayment && paymentMethod === 'paystack') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>AGROSHOP</Text>
          <TouchableOpacity style={styles.cartButton} onPress={() => setPaymentMethod(null)}>
            <Text style={styles.cartText}>Back</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: paymentHtml }}
          onMessage={handlePaymentMessage}
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color="#186A3B" style={styles.webView} />}
          style={styles.webView}
        />
      </SafeAreaView>
    );
  }

  if (showPayment && !paymentMethod) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Payment</Text>
          <TouchableOpacity style={styles.cartButton} onPress={resetPaymentFlow}>
            <Text style={styles.cartText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.momoForm}>
          <Text style={styles.sectionTitle}>Choose Method</Text>
          <TouchableOpacity style={styles.methodCard} onPress={() => setPaymentMethod('paystack')}>
            <Text style={styles.methodTitle}>Paystack (Cards/Bank/MoMo)</Text>
          </TouchableOpacity>
          
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Direct Mobile Money</Text>
          <View style={styles.networkToggle}>
            {['MTN', 'Airtel'].map(net => (
              <TouchableOpacity 
                key={net}
                style={[styles.networkButton, selectedNetwork === net && styles.networkButtonActive]}
                onPress={() => setSelectedNetwork(net)}
              >
                <Text style={[styles.networkButtonText, selectedNetwork === net && styles.networkButtonTextActive]}>{net}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Enter Phone Number (e.g. 077...)"
            keyboardType="phone-pad"
            value={momoNumber}
            onChangeText={setMomoNumber}
          />

          <TouchableOpacity 
            style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]} 
            onPress={handleMoMoPayment}
            disabled={isProcessing}
          >
            {isProcessing ? 
              <ActivityIndicator color="#FFF" /> : 
              <Text style={styles.checkoutButtonText}>Request {selectedNetwork} Push</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>AGROSHOP</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(prev => !prev)}>
          <Text style={styles.cartText}>Cart ({cartItems.length})</Text>
        </TouchableOpacity>
      </View>

      {showCart ? (
        <ScrollView style={styles.cartContainer}>
          <Text style={styles.sectionTitle}>Your Cart</Text>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          ) : (
            cartItems.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productDetails}>{item.quantity} × ₦{item.price}</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{totalAmount}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, cartItems.length === 0 ? styles.checkoutButtonDisabled : null]}
            onPress={handleCheckout}
            disabled={cartItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>Pay Now</Text>
          </TouchableOpacity>
          {paymentStatus === 'success' && (
            <Text style={styles.paymentSuccess}>
              Payment complete! Order confirmed.
              {paymentReference ? ` Reference: ${paymentReference}` : ''}
            </Text>
          )}
          {paymentStatus === 'cancelled' && (
            <Text style={styles.paymentError}>Payment cancelled. Try again.</Text>
          )}
          {paymentStatus === 'empty' && (
            <Text style={styles.paymentError}>Add items to your cart before checkout.</Text>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              {item.imageUrl ? (
                <Image style={styles.productImage} source={{ uri: item.imageUrl }} />
              ) : null}
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productDescription}>{item.description}</Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>₦{item.price}</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, // The main container takes up the entire screen
    backgroundColor: 'skyblue', // Set the background color of the application to sky-blue
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#186A3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  cartButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  cartText: {
    color: '#186A3B',
    fontWeight: '700',
  },
  list: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: '#EAEAEA',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#163a19',
  },
  productCategory: {
    fontSize: 14,
    color: '#3f522e',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 13,
    color: '#5a6b4b',
    marginBottom: 14,
    lineHeight: 18,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#186A3B',
  },
  addButton: {
    backgroundColor: '#186A3B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cartContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    color: '#163a19',
  },
  emptyText: {
    color: '#5a6b4b',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartInfo: {
    flex: 1,
    marginRight: 12,
  },
  productDetails: {
    color: '#5a6b4b',
  },
  removeButton: {
    backgroundColor: '#F2B8B5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: '#7e2b29',
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutButton: {
    backgroundColor: '#1F8A5F',
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CC4A4',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSuccess: {
    marginTop: 12,
    color: '#1F8A5F',
    fontWeight: '700',
    textAlign: 'center',
  },
  paymentError: {
    marginTop: 12,
    color: '#C0392B',
    fontWeight: '700',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163a19',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#186A3B',
  },
  momoForm: {
    padding: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1DBBD',
    marginBottom: 16,
  },
  networkToggle: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  networkButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    marginHorizontal: 4,
    borderRadius: 10,
  },
  networkButtonActive: {
    backgroundColor: '#186A3B',
  },
  networkButtonText: {
    fontWeight: '700',
    color: '#555',
  },
  networkButtonTextActive: {
    color: '#FFF',
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#186A3B',
  },
  methodTitle: {
    color: '#186A3B',
    fontWeight: '700',
    fontSize: 16,
  }
});
