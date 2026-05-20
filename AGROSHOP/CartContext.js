import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});

  const cartItems = useMemo(() => Object.values(cart), [cart]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addToCart = (product) => {
    setCart((prev) => {
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

  const removeFromCart = (productId) => {
    setCart((prev) => {
      if (!prev[productId]) return prev;
      if (prev[productId].quantity > 1) {
        return { ...prev, [productId]: { ...prev[productId], quantity: prev[productId].quantity - 1 } };
      } else {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const clearCart = () => setCart({});

  return (
    <CartContext.Provider value={{ cartItems, totalAmount, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);