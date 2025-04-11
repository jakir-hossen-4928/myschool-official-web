import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { auth, db } from './firebase';

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.error('Multiple tabs open, persistence can only be enabled in one tab at a time');
  } else if (err.code === 'unimplemented') {
    console.error('The current browser does not support offline persistence');
  }
});

// Define role-specific interfaces
export interface StudentData {
  studentId: string;
  name: string;
  class: string;
  number: string;
  description?: string;
  englishName?: string;
  motherName?: string;
  fatherName?: string;
  photoUrl?: string;
}

export interface StaffData {
  staffId: string;
  nameBangla: string;
  nameEnglish: string;
  subject: string;
  designation: string;
  joiningDate: Date;
  nid: string;
  mobile: string;
  salary: number;
  email: string;
  address: string;
  bloodGroup: string;
  workingDays: number;
  photoUrl?: string;
}

// Define User interface with strict typing
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'staff' | 'student';
  createdAt?: any; // Firestore Timestamp
  // Role-specific data
  studentData?: StudentData;
  staffData?: StaffData;
}

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found in Firestore');
    }

    const userData = userDoc.data() as User;
    if (!userData.verified) {
      throw new Error('Your account is not verified. Please wait for admin approval.');
    }

    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      name: userCredential.user.displayName || userData.name,
      role: userData.role || 'student',
      verified: userData.verified,
      studentData: userData.studentData,
      staffData: userData.staffData,
      createdAt: userData.createdAt,
    };
    console.log('Logged in user:', user);
    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const register = async (
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'staff' | 'student' = 'student',
  additionalData: Partial<User> = {}
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', userCredential.user.uid);

    const userData: User = {
      id: userCredential.user.uid,
      email,
      name,
      role,
      verified: role === 'admin' ? true : false, // Admins are auto-verified
      createdAt: serverTimestamp(),
      ...additionalData,
    };

    await setDoc(userRef, userData);

    console.log('Registered user:', userData);
    return userData;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
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

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || userData.name,
              role: userData.role || 'student',
              verified: userData.verified,
              studentData: userData.studentData,
              staffData: userData.staffData,
              createdAt: userData.createdAt,
            };
            console.log('Current user fetched:', user);
            resolve(user);
          } else {
            const defaultData: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Unknown',
              role: 'student',
              verified: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), defaultData);
            console.log('Created default user:', defaultData);
            resolve(defaultData);
          }
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

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};