import { doc, getDocs, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { User, StudentData, StaffData } from './auth';

interface ExtendedUser extends User {
  verified?: boolean;
  staffId?: string;
  designation?: string;
  joiningDate?: any;
  nid?: string;
  photoUrl?: string;
}

export const getAllUsers = async (): Promise<ExtendedUser[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ExtendedUser));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch users');
  }
};

export const editUser = async (userId: string, updatedData: Partial<ExtendedUser>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: Partial<ExtendedUser> = { ...updatedData };
    if (updatedData.role === 'student' && updatedData.studentData) {
      updateData.studentData = updatedData.studentData;
      delete updateData.staffData;
    } else if (updatedData.role === 'staff' && updatedData.staffData) {
      updateData.staffData = updatedData.staffData;
      delete updateData.studentData;
    } else if (updatedData.role === 'admin') {
      // Keep flat fields for admin
      delete updateData.studentData;
      delete updateData.staffData;
    }
    await updateDoc(userRef, updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user');
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user');
  }
};