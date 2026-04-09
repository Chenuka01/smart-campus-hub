import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const getStorageKey = () => `favorites_${user?.id || 'guest'}`;

  // Load from local storage on mount
  useEffect(() => {
    if (!user) return;
    const key = getStorageKey();
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = (facilityId: string) => {
    if (!user) return;
    const key = getStorageKey();
    
    setFavorites(prev => {
      const isFavorite = prev.includes(facilityId);
      const newFavorites = isFavorite 
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId];
      
      try {
        localStorage.setItem(key, JSON.stringify(newFavorites));
      } catch (err) {
        console.error('Failed to save favorites', err);
      }
      
      return newFavorites;
    });
  };

  const isFavorite = (facilityId: string) => favorites.includes(facilityId);

  return { favorites, toggleFavorite, isFavorite };
}
