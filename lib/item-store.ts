import { getAllItems as dbGetAllItems, getItemById as dbGetItemById, Item } from "./database";

// Use a cached version to ensure all components receive consistent data
// This is our source of truth for the app
let itemsCache: Item[] = dbGetAllItems();

// Get all items from cache (or refresh first if needed)
export function getAllItems(forceRefresh = false) {
  if (forceRefresh) {
    refreshItemStore();
  }
  return itemsCache;
}

// Get a specific item by ID
export function getItemById(id: string): Item | null {
  const item = itemsCache.find(item => item.id === id);
  return item || null;
}

// Force a refresh of the item store from the database
export function refreshItemStore() {
  itemsCache = dbGetAllItems();
  return itemsCache;
}
