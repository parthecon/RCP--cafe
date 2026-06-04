import { useState, useEffect } from 'react';
import { 
  subscribeToMenu, 
  saveMenuItem, 
  deleteMenuItem as apiDeleteMenuItem, 
  toggleMenuItemAvailability 
} from '../firebase/dbService';

export const useMenu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMenu((menuItems) => {
      setMenu(menuItems);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const addMenuItem = async (item) => {
    try {
      await saveMenuItem(item);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const updateMenuItem = async (item) => {
    try {
      await saveMenuItem(item);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await apiDeleteMenuItem(id);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const toggleAvailability = async (id, isAvailable) => {
    try {
      await toggleMenuItemAvailability(id, isAvailable);
    } catch (err) {
      console.error(err);
      setError(err.message);
      throw err;
    }
  };

  return {
    menu,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability
  };
};

export default useMenu;
