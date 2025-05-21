export interface StudentData {
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  grade: string;
  section: string;
  enrollmentDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  medicalInfo?: string;
  previousSchool?: string;
  createdAt: any;
  updatedAt: any;
}

export interface StaffData {
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  emergencyContact: string;
  medicalInfo?: string;
  qualifications?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  email: string | null;
  role: string;
  verified: boolean;
  createdAt: any;
  studentData?: StudentData;
  staffData?: StaffData;
}