import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, StudentData, StaffData } from '../lib/types';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const register = async (
  email: string,
  password: string,
  role: 'admin' | 'staff' | 'student' = 'student',
  additionalData: { studentData?: StudentData; staffData?: StaffData } = {}
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Store basic user info in 'users' collection
    const userRef = doc(db, 'users', userId);
    const userData: User = {
      id: userId,
      email,
      role,
      verified: role === 'admin' ? true : false,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);

    // Store role-specific data in respective collections
    if (role === 'student' && additionalData.studentData) {
      const studentRef = doc(db, 'students', userId);
      await setDoc(studentRef, {
        studentId: userId,
        ...additionalData.studentData,
      });
      userData.studentData = additionalData.studentData;
    } else if (role === 'staff' && additionalData.staffData) {
      const staffRef = doc(db, 'staff', userId);
      await setDoc(staffRef, {
        staffId: userId,
        ...additionalData.staffData,
      });
      userData.staffData = additionalData.staffData;
    }

    console.log('Registered user:', userData);
    return userData;
  } catch (error: any) {
    console.error('Error signing up:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use a different email or log in.');
    }
    throw new Error(error.message || 'Failed to sign up');
  }
};

// Updated login function to allow Google login only for verified users with existing Firestore doc
export const login = async (
  email?: string,
  password?: string,
  useGoogle: boolean = false
): Promise<User> => {
  try {
    let userCredential;

    if (useGoogle) {
      // Google Sign-In
      userCredential = await signInWithPopup(auth, googleProvider);
      const userEmail = userCredential.user.email;
      if (!userEmail) {
        throw new Error('Google account has no email associated.');
      }

      // Check if email exists in Firestore and user is verified
      const usersQuery = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        // Email not found in Firestore
        await firebaseSignOut(auth); // Sign out to prevent unauthorized access
        throw new Error('This email is not registered. Please sign up first.');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      if (!userData.verified) {
        await firebaseSignOut(auth); // Sign out unverified user
        throw new Error('Your account is not verified. Please wait for admin approval.');
      }

      // Ensure Firestore user ID matches Firebase Auth UID
      if (userDoc.id !== userCredential.user.uid) {
        await firebaseSignOut(auth); // Sign out if UIDs don't match
        throw new Error('User ID mismatch. Please contact support.');
      }
    } else if (email && password) {
      // Email/Password Sign-In
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw new Error('Invalid login credentials');
    }

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found in Firestore');
    }

    const userData = userDoc.data() as User;

    if (userData.verified === false) {
      await firebaseSignOut(auth); // Sign out unverified user
      throw new Error('Your account is not verified. Please wait for admin approval.');
    }

    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      role: userData.role || 'student',
      verified: userData.verified,
      createdAt: userData.createdAt,
    };

    // Fetch additional data based on role
    if (userData.role === 'student') {
      const studentDoc = await getDoc(doc(db, 'students', userCredential.user.uid));
      if (studentDoc.exists()) {
        user.studentData = studentDoc.data() as StudentData;
      }
    } else if (userData.role === 'staff') {
      const staffDoc = await getDoc(doc(db, 'staff', userCredential.user.uid));
      if (staffDoc.exists()) {
        user.staffData = staffDoc.data() as StaffData;
      }
    }

    console.log('Logged in user:', user);
    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Convenience function for Google login
export const loginWithGoogle = async (): Promise<User> => {
  return login(undefined, undefined, true);
};

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (!userDoc.exists()) {
            console.log('User document not found for UID:', firebaseUser.uid);
            await firebaseSignOut(auth); // Sign out if no document
            resolve(null);
            return;
          }

          const userData = userDoc.data() as User;
          if (!userData.verified) {
            console.log('User not verified for UID:', firebaseUser.uid);
            await firebaseSignOut(auth); // Sign out unverified user
            resolve(null);
            return;
          }

          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: userData.role || 'student',
            verified: userData.verified,
            createdAt: userData.createdAt,
          };

          // Fetch role-specific data
          if (userData.role === 'student') {
            const studentDoc = await getDoc(doc(db, 'students', firebaseUser.uid));
            if (studentDoc.exists()) {
              user.studentData = studentDoc.data() as StudentData;
            }
          } else if (userData.role === 'staff' || userData.role === 'admin') {
            const staffDoc = await getDoc(doc(db, 'staff', firebaseUser.uid));
            if (staffDoc.exists()) {
              user.staffData = staffDoc.data() as StaffData;
            }
          }

          console.log('Current user fetched:', user);
          resolve(user);
        } catch (error: any) {
          console.error('Error fetching current user:', error);
          reject(new Error(error.message || 'Failed to fetch user'));
        }
      } else {
        console.log('No user currently authenticated');
        resolve(null);
      }
    });
  });
};

export const logout = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('User logged out successfully');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};