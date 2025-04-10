
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Register a new user
export const register = async (
  email: string, 
  password: string, 
  name: string, 
  role: "student" | "staff" | "admin" = "student"
) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with name
    await updateProfile(user, { displayName: name });

    // Save additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    });

    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      role
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login an existing user
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (!userData) {
      throw new Error("User data not found");
    }

    return {
      id: user.uid,
      email: user.email,
      name: user.displayName || userData.name,
      role: userData.role
    };
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout the current user
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Get the current authenticated user
export const getCurrentUser = async () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();

          resolve({
            id: user.uid,
            email: user.email,
            name: user.displayName || (userData?.name || ""),
            role: userData?.role || "student"
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          reject(error);
        }
      } else {
        resolve(null);
      }
    }, reject);
  });
};

// Check if the user is logged in
export const isLoggedIn = async () => {
  const user = await getCurrentUser();
  return !!user;
};
