// Temporary in-memory user store for development. Replace with MongoDB logic later.
export type User = {
  email: string;
  name: string;
  password: string; // Store hashed passwords in production!
  phone?: string;
  location?: string;
  role?: string;
  createdAt: Date;
  // Optional fields for UI compatibility
  avatar?: string;
  verified?: boolean;
  rating?: number;
  reviews?: number;
  responseTime?: string;
  favorites?: string[]; // Array of item IDs
  bio?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  profileVisibility?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  updatedAt?: Date;
};

// Import user data from JSON file
import usersData from './users.json';

// Convert the imported data to User objects with proper Date types
let users: User[] = usersData.map((user: any) => ({
  ...user,
  createdAt: new Date(user.createdAt),
  updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
  favorites: user.favorites || []
}));

export function getUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

export function validateUser(email: string, password: string): User | undefined {
  return users.find((u) => u.email === email && u.password === password);
}

export function createUser(user: Omit<User, 'createdAt'>): User {
  const newUser: User = {
    ...user,
    createdAt: new Date(),
  };
  users.push(newUser);
  return newUser;
}

export function updateUser(email: string, updates: Partial<User>): User | undefined {
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex !== -1) {
    users[userIndex] = { 
      ...users[userIndex], 
      ...updates,
      updatedAt: new Date()
    };
    return users[userIndex];
  }
  return undefined;
}

export function getAllUsers(): User[] {
  return users;
}

export function deleteUserByEmail(email: string): boolean {
  const idx = users.findIndex((u) => u.email === email);
  if (idx !== -1) {
    users.splice(idx, 1);
    return true;
  }
  return false;
}