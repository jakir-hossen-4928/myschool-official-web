interface StudentData {
  studentId: string;
  name: string;
  class: string;
  number: string;
  description?: string;
  englishName?: string;
  motherName?: string;
  fatherName?: string;
  email: string;
  bloodGroup: string;
  photoUrl?: string;
}
interface StaffData {
  staffId: string;
  nameBangla: string;
  nameEnglish: string;
  subject: string;
  designation: string;
  joiningDate: string;
  nid: string;
  mobile: string;
  salary: number;
  email: string;
  address: string;
  bloodGroup: string;
  workingDays: number;
  photoUrl?: string;
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