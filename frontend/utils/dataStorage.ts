import { TabularItem, DataStorage, CSVExportOptions } from '@/types/dataStorage';

// Local storage key
const STORAGE_KEY = 'fintech_hack_data_storage';

// Initialize default storage
const getDefaultStorage = (): DataStorage => ({
  items: [],
  videos: [],
  metadata: {
    lastUpdated: new Date().toISOString(),
    totalItems: 0,
    totalValue: 0,
    averageValue: 0,
    categories: {
      "$": 0,
      "$$": 0,
      "$$$": 0
    }
  }
});

// Load data from localStorage
export const loadDataStorage = (): DataStorage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all required fields exist
      return {
        ...getDefaultStorage(),
        ...parsed,
        metadata: {
          ...getDefaultStorage().metadata,
          ...parsed.metadata
        }
      };
    }
  } catch (error) {
    console.error('Error loading data storage:', error);
  }
  return getDefaultStorage();
};

// Save data to localStorage
export const saveDataStorage = (storage: DataStorage): void => {
  try {
    // Update metadata before saving
    const updatedStorage = {
      ...storage,
      metadata: {
        ...storage.metadata,
        lastUpdated: new Date().toISOString(),
        totalItems: storage.items.length,
        totalValue: storage.items.reduce((sum, item) => sum + item.marketPrice, 0),
        averageValue: storage.items.length > 0 
          ? storage.items.reduce((sum, item) => sum + item.marketPrice, 0) / storage.items.length 
          : 0,
        categories: {
          "$": storage.items.filter(item => item.category === "$").length,
          "$$": storage.items.filter(item => item.category === "$$").length,
          "$$$": storage.items.filter(item => item.category === "$$$").length
        }
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStorage));
    console.log('💾 Data storage saved:', updatedStorage.metadata);
  } catch (error) {
    console.error('Error saving data storage:', error);
  }
};

// Add or update an item
export const upsertItem = (item: TabularItem): void => {
  const storage = loadDataStorage();
  const existingIndex = storage.items.findIndex(i => i.id === item.id);
  
  if (existingIndex >= 0) {
    // Update existing item
    storage.items[existingIndex] = {
      ...item,
      updatedAt: new Date().toISOString()
    };
    console.log('🔄 Updated item in storage:', item.id);
  } else {
    // Add new item
    storage.items.push({
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('➕ Added new item to storage:', item.id);
  }
  
  saveDataStorage(storage);
};

// Add or update a video
export const upsertVideo = (video: any): void => {
  const storage = loadDataStorage();
  const existingIndex = storage.videos.findIndex(v => v.id === video.id);
  
  if (existingIndex >= 0) {
    storage.videos[existingIndex] = video;
  } else {
    storage.videos.push(video);
  }
  
  saveDataStorage(storage);
};

// Remove an item
export const removeItem = (itemId: string): void => {
  const storage = loadDataStorage();
  storage.items = storage.items.filter(item => item.id !== itemId);
  saveDataStorage(storage);
  console.log('🗑️ Removed item from storage:', itemId);
};

// Clear all data
export const clearDataStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🧹 Data storage cleared');
};

// Export to CSV
export const exportToCSV = (options: CSVExportOptions = {}): string => {
  const storage = loadDataStorage();
  let items = [...storage.items];
  
  // Apply filters
  if (options.filter) {
    if (options.filter.category) {
      items = items.filter(item => options.filter!.category!.includes(item.category));
    }
    if (options.filter.videoId) {
      items = items.filter(item => options.filter!.videoId!.includes(item.videoId));
    }
    if (options.filter.source) {
      items = items.filter(item => options.filter!.source!.includes(item.source));
    }
    if (options.filter.dateRange) {
      items = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        const start = new Date(options.filter!.dateRange!.start);
        const end = new Date(options.filter!.dateRange!.end);
        return itemDate >= start && itemDate <= end;
      });
    }
  }
  
  // Determine columns to export
  const columns = options.columns || [
    'id', 'name', 'category', 'marketPrice', 'confidence', 'timestamp', 
    'videoId', 'source', 'gcsUri', 'publicUrl', 'createdAt'
  ];
  
  // Convert to CSV
  const headers = options.includeHeaders !== false ? columns.join(',') + '\n' : '';
  const rows = items.map(item => {
    return columns.map(col => {
      const value = item[col];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  }).join('\n');
  
  return headers + rows;
};

// Download CSV file
export const downloadCSV = (filename: string, options: CSVExportOptions = {}): void => {
  const csv = exportToCSV(options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Get storage statistics
export const getStorageStats = () => {
  const storage = loadDataStorage();
  return storage.metadata;
};

// Get items by category
export const getItemsByCategory = (category: "$" | "$$" | "$$$"): TabularItem[] => {
  const storage = loadDataStorage();
  return storage.items.filter(item => item.category === category);
};

// Get items by video
export const getItemsByVideo = (videoId: string): TabularItem[] => {
  const storage = loadDataStorage();
  return storage.items.filter(item => item.videoId === videoId);
}; 