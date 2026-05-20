# AGROSHOP

A starter Expo React Native mobile app for selling agro inputs.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

3. Open the app on a device or emulator using the Expo Go app or the terminal QR code.

## Features included

- Product catalog with agro input items
- Add to cart interaction
- Cart view with quantity and total amount
- Webview-based Paystack payment integration
- Simple mobile-friendly design

## Payment setup

This app is configured to use Paystack checkout.

1. Open `App.js` and replace `PAYSTACK_PUBLIC_KEY` with your Paystack public key.
2. Update `PAYMENT_EMAIL` with a valid customer email address.
3. Run `npm install` and then `npm start`.

Payments are processed through Paystack, and the cart is cleared after successful checkout.
