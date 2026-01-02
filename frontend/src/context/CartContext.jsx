import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

/**
 * Cart Context Provider
 * Manages shopping cart state and operations
 * Supports both database and localStorage-based carts
 */
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  const STORAGE_KEY = 'electric_shop_cart';

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, [isAuthenticated]);

  // Initialize cart from localStorage or API
  const initializeCart = async () => {
    if (isAuthenticated) {
      await fetchCart();
    } else {
      loadLocalCart();
    }
  };

  // Load cart from localStorage
  const loadLocalCart = () => {
    try {
      // When not authenticated, always start with empty cart
      // Cart is only preserved when user is logged in
      setCart({ items: [], totalAmount: 0 });
      setUseLocalStorage(true);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart({ items: [], totalAmount: 0 });
    }
  };

  // Save cart to localStorage
  const saveToLocalStorage = (cartData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Calculate total amount
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Fetch cart from API
  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/cart');
      if (data.cart) {
        setCart(data.cart);
        setUseLocalStorage(false);
      } else {
        loadLocalCart();
      }
    } catch (error) {
      console.warn('Error fetching cart from API, using localStorage:', error.message);
      loadLocalCart();
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1, product = null) => {
    try {
      // Fetch product details if not provided
      let productDetails = product;
      if (!productDetails) {
        try {
          const { data } = await API.get(`/products/${productId}`);
          productDetails = data.product || data.data;
        } catch (error) {
          console.warn('Could not fetch product details:', error.message);
          productDetails = { _id: productId, name: 'Product', price: 0, brand: '', image: '' };
        }
      }

      // Try API first if authenticated
      if (isAuthenticated) {
        try {
          const { data } = await API.post('/cart/add', { productId, quantity });
          if (data.cart) {
            // Ensure cart items have proper product object structure
            const cart = data.cart;
            if (cart.items && Array.isArray(cart.items)) {
              cart.items = cart.items.map(item => ({
                ...item,
                product: item.product || { _id: productId, name: 'Product', price: item.price }
              }));
            }
            setCart(cart);
            setUseLocalStorage(false);
            return { success: true, message: data.message };
          }
        } catch (apiError) {
          console.warn('API add to cart failed, using localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      const updatedCart = { ...cart } || { items: [], totalAmount: 0 };
      const existingItem = updatedCart.items?.find(item => 
        item.product?._id === productId || 
        item.product?._id === productDetails._id ||
        item.productId === productId
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        updatedCart.items = (updatedCart.items || []).concat([{
          product: {
            _id: productDetails._id || productId,
            name: productDetails.name || 'Product',
            price: productDetails.price || 0,
            image: productDetails.image || '',
            brand: productDetails.brand || '',
            stock: productDetails.stock || 0
          },
          quantity,
          price: productDetails.price || 0
        }]);
      }
      
      updatedCart.totalAmount = calculateTotal(updatedCart.items);
      setCart(updatedCart);
      saveToLocalStorage(updatedCart);
      setUseLocalStorage(true);
      
      return { success: true, message: 'Item added to cart' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to add to cart'
      };
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      // Try API first if authenticated
      if (isAuthenticated) {
        try {
          const { data } = await API.put('/cart/update', { productId, quantity });
          if (data.cart) {
            // Ensure cart items have proper product object structure
            const cart = data.cart;
            if (cart.items && Array.isArray(cart.items)) {
              cart.items = cart.items.map(item => ({
                ...item,
                product: item.product || { _id: productId, name: 'Product', price: item.price }
              }));
            }
            setCart(cart);
            setUseLocalStorage(false);
            return { success: true };
          }
        } catch (apiError) {
          console.warn('API update cart failed, using localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      const updatedCart = { ...cart };
      const item = updatedCart.items?.find(item => 
        item.product?._id === productId || 
        item.productId === productId
      );
      
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
      
      updatedCart.totalAmount = calculateTotal(updatedCart.items);
      setCart(updatedCart);
      saveToLocalStorage(updatedCart);
      setUseLocalStorage(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update cart'
      };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      // Try API first if authenticated
      if (isAuthenticated) {
        try {
          const { data } = await API.delete(`/cart/remove/${productId}`);
          if (data.cart) {
            // Ensure cart items have proper product object structure
            const cart = data.cart;
            if (cart.items && Array.isArray(cart.items)) {
              cart.items = cart.items.map(item => ({
                ...item,
                product: item.product || { _id: productId, name: 'Product', price: item.price }
              }));
            }
            setCart(cart);
            setUseLocalStorage(false);
            return { success: true, message: data.message };
          }
        } catch (apiError) {
          console.warn('API remove from cart failed, using localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      const updatedCart = { ...cart };
      updatedCart.items = updatedCart.items?.filter(item => 
        item.product?._id !== productId && item.productId !== productId
      ) || [];
      
      updatedCart.totalAmount = calculateTotal(updatedCart.items);
      setCart(updatedCart);
      saveToLocalStorage(updatedCart);
      setUseLocalStorage(true);
      
      return { success: true, message: 'Item removed from cart' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from cart'
      };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      // Try API first if authenticated
      if (isAuthenticated) {
        try {
          const { data } = await API.delete('/cart/clear');
          if (data.cart) {
            setCart(data.cart);
            setUseLocalStorage(false);
            return { success: true };
          }
        } catch (apiError) {
          console.warn('API clear cart failed, using localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      const clearedCart = { items: [], totalAmount: 0 };
      setCart(clearedCart);
      saveToLocalStorage(clearedCart);
      setUseLocalStorage(true);
      
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  // Get cart item count
  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    cartCount: getCartCount(),
    useLocalStorage
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
