import { useState, useEffect } from 'react';
import { 
  subscribeToOrders, 
  subscribeToOrder, 
  createOrder, 
  updateOrderStatus, 
  updateOrderItems,
  deleteOrder as apiDeleteOrder 
} from '../firebase/dbService';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToOrders((allOrders) => {
      // Sort by newest first
      const sorted = [...allOrders].sort((a, b) => b.createdAt - a.createdAt);
      setOrders(sorted);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const addOrder = async (orderData) => {
    try {
      const orderId = await createOrder(orderData);
      return orderId;
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await apiDeleteOrder(orderId);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const updateItems = async (orderId, items, totalAmount) => {
    try {
      await updateOrderItems(orderId, items, totalAmount);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    addOrder,
    updateStatus,
    updateItems,
    deleteOrder
  };
};

export const useOrder = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToOrder(orderId, (orderData) => {
      setOrder(orderData);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [orderId]);

  return {
    order,
    loading,
    error
  };
};
