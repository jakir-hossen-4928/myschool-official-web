
import { account } from './appwrite';
import { ID } from 'appwrite';

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'student';
}

// Current user state
let currentUser: User | null = null;

// Register a new user
export const register = async (email: string, password: string, name: string, role: 'admin' | 'staff' | 'student') => {
  try {
    const response = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    
    if (response) {
      // Create session (log in)
      await account.createEmailSession(email, password);
      
      // Update preferences to store role
      await account.updatePrefs({
        role: role
      });
      
      // Get updated account
      const user = await account.get();
      const prefs = await account.getPrefs();
      
      currentUser = {
        id: user.$id,
        email: user.email,
        name: user.name,
        role: prefs.role || 'student'
      };
      
      return currentUser;
    }
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login
export const login = async (email: string, password: string) => {
  try {
    await account.createEmailSession(email, password);
    
    // Get user data
    const user = await account.get();
    const prefs = await account.getPrefs();
    
    currentUser = {
      id: user.$id,
      email: user.email,
      name: user.name,
      role: prefs.role || 'student'
    };
    
    return currentUser;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await account.deleteSession('current');
    currentUser = null;
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  if (currentUser) return currentUser;
  
  try {
    const user = await account.get();
    const prefs = await account.getPrefs();
    
    currentUser = {
      id: user.$id,
      email: user.email,
      name: user.name,
      role: prefs.role || 'student'
    };
    
    return currentUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Check if user is logged in
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
};

// Password reset
export const resetPassword = async (email: string) => {
  try {
    await account.createRecovery(email, `${window.location.origin}/reset-password`);
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Complete password reset
export const completeReset = async (userId: string, secret: string, password: string, confirmPassword: string) => {
  try {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    
    await account.updateRecovery(userId, secret, password, confirmPassword);
    return true;
  } catch (error) {
    console.error("Complete reset error:", error);
    throw error;
  }
};
