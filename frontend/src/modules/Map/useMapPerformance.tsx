// hooks/useMapPerformance.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { CampusFacility, Room, FilterCriteria } from '../types/MapTypes';
import { fetchDormitories, fetchFacilities, fetchRooms } from '../services/api';

/**
 * Custom hook for lazy loading map data with caching
 */
export function useLazyLoadMapData() {
  const [dormitories, setDormitories] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<CampusFacility[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState({
    dormitories: false,
    facilities: false,
    rooms: false
  });
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Map<string, any>>(new Map());

  const loadDormitories = useCallback(async () => {
    const cacheKey = 'dormitories';
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      setDormitories(cacheRef.current.get(cacheKey));
      return;
    }

    setLoading(prev => ({ ...prev, dormitories: true }));
    try {
      const data = await fetchDormitories();
      cacheRef.current.set(cacheKey, data);
      setDormitories(data);
    } catch (err) {
      setError('Failed to load dormitories');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, dormitories: false }));
    }
  }, []);

  const loadFacilities = useCallback(async (types?: string[]) => {
    const cacheKey = `facilities-${types?.join(',') || 'all'}`;
    
    if (cacheRef.current.has(cacheKey)) {
      setFacilities(cacheRef.current.get(cacheKey));
      return;
    }

    setLoading(prev => ({ ...prev, facilities: true }));
    try {
      const data = await fetchFacilities();
      const filtered = types 
        ? data.filter(f => types.includes(f.type))
        : data;
      
      cacheRef.current.set(cacheKey, filtered);
      setFacilities(filtered);
    } catch (err) {
      setError('Failed to load facilities');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, facilities: false }));
    }
  }, []);

  const loadRooms = useCallback(async (filters?: FilterCriteria) => {
    setLoading(prev => ({ ...prev, rooms: true }));
    try {
      const data = await fetchRooms(filters);
      setRooms(data);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, []);

  return {
    dormitories,
    facilities,
    rooms,
    loading,
    error,
    loadDormitories,
    loadFacilities,
    loadRooms,
    clearCache: () => cacheRef.current.clear()
  };
}

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for viewport-based loading
 */
export function useViewportLoader(mapInstance: L.Map | null) {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (!mapInstance) return;

    const updateVisibleItems = () => {
      const currentBounds = mapInstance.getBounds();
      setBounds(currentBounds);

      // Logic to determine which items are visible
      const visible = new Set<string>();
      
      // This would check each facility/dorm against the bounds
      // and add visible ones to the set
      
      setVisibleItems(visible);
    };

    mapInstance.on('moveend', updateVisibleItems);
    mapInstance.on('zoomend', updateVisibleItems);
    
    // Initial load
    updateVisibleItems();

    return () => {
      mapInstance.off('moveend', updateVisibleItems);
      mapInstance.off('zoomend', updateVisibleItems);
    };
  }, [mapInstance]);

  return { visibleItems, bounds };
}

/**
 * Custom hook for progressive image loading
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
): { src: string; isLoading: boolean } {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSrc(lowQualitySrc);
    setIsLoading(true);

    const img = new Image();
    img.src = highQualitySrc;

    img.onload = () => {
      setSrc(highQualitySrc);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, isLoading };
}

/**
 * Custom hook for batch loading with priority
 */
export function useBatchLoader<T>(
  items: T[],
  batchSize: number = 10,
  delay: number = 100
): {
  loaded: T[];
  loading: boolean;
  progress: number;
} {
  const [loaded, setLoaded] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    setLoading(true);
    setLoaded([]);
    setProgress(0);

    let currentBatch = 0;
    const totalBatches = Math.ceil(items.length / batchSize);

    const loadBatch = () => {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, items.length);
      const batch = items.slice(start, end);

      setLoaded(prev => [...prev, ...batch]);
      setProgress((currentBatch + 1) / totalBatches * 100);

      currentBatch++;

      if (currentBatch < totalBatches) {
        setTimeout(loadBatch, delay);
      } else {
        setLoading(false);
      }
    };

    loadBatch();

    return () => {
      setLoading(false);
    };
  }, [items, batchSize, delay]);

  return { loaded, loading, progress };
}

/**
 * Custom hook for intersection observer
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Custom hook for request animation frame
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}

/**
 * Custom hook for tile caching
 */
export function useTileCache(mapInstance: L.Map | null) {
  const [cacheStatus, setCacheStatus] = useState({
    cached: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    if (!mapInstance) return;

    // Implement tile caching logic
    // This is a simplified version
    const cacheTiles = async () => {
      const bounds = mapInstance.getBounds();
      const zoom = mapInstance.getZoom();
      
      // Calculate tile coordinates
      const tileUrls: string[] = [];
      
      // Cache tiles
      const cache = await caches.open('map-tiles');
      let cached = 0;
      
      for (const url of tileUrls) {
        try {
          const response = await cache.match(url);
          if (!response) {
            await cache.add(url);
          }
          cached++;
          setCacheStatus({
            cached,
            total: tileUrls.length,
            percentage: (cached / tileUrls.length) * 100
          });
        } catch (error) {
          console.error('Failed to cache tile:', error);
        }
      }
    };

    // Cache tiles on map idle
    mapInstance.on('idle', cacheTiles);

    return () => {
      mapInstance.off('idle', cacheTiles);
    };
  }, [mapInstance]);

  return cacheStatus;
}

/**
 * Custom hook for memory management
 */
export function useMemoryManagement() {
  const [memoryUsage, setMemoryUsage] = useState({
    used: 0,
    limit: 0,
    percentage: 0
  });

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        
        setMemoryUsage({
          used,
          limit,
          percentage: (used / limit) * 100
        });

        // Trigger cleanup if memory usage is high
        if ((used / limit) > 0.9) {
          console.warn('High memory usage detected, triggering cleanup');
          // Implement cleanup logic
        }
      }
    };

    const interval = setInterval(checkMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}
