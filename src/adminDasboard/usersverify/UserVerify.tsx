import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, editUser, deleteUser } from '@/lib/usersverifyfunctions';
import { User, StudentData, StaffData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Trash2Icon, PencilIcon, SearchIcon } from 'lucide-react';

// Extend User interface to handle flat fields from your sample data
interface ExtendedUser extends User {
  verified?: boolean; // From your sample
  staffId?: string; // Flat fields for admin/staff
  designation?: string;
  joiningDate?: any; // Firestore Timestamp
  nid?: string;
  photoUrl?: string; // Flat photoUrl for admin
}

const UserVerify: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff' | 'student'>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'student'>('all');
  const [studentData, setStudentData] = useState<StudentData>({
    studentId: '',
    name: '',
    class: '',
    number: '',
    description: '',
    englishName: '',
    motherName: '',
    fatherName: '',
    photoUrl: '',
  });
  const [staffData, setStaffData] = useState<StaffData>({
    staffId: '',
    nameBangla: '',
    nameEnglish: '',
    subject: '',
    designation: '',
    joiningDate: new Date(),
    nid: '',
    mobile: '',
    salary: 0,
    email: '',
    address: '',
    bloodGroup: '',
    workingDays: 0,
    photoUrl: '',
  });
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    staffId: '',
    designation: '',
    joiningDate: new Date(),
    nid: '',
    photoUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers as ExtendedUser[]);
        setFilteredUsers(fetchedUsers as ExtendedUser[]);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch users',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  // Filter users
  useEffect(() => {
    let result = users;
    if (searchTerm) {
      result = result.filter(
        (user) =>
          (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  // Handle edit button click
  const handleEditClick = (user: ExtendedUser) => {
    setSelectedUser(user);
    setRole(user.role);

    if (user.role === 'student' && user.studentData) {
      setStudentData({ ...user.studentData });
    } else if (user.role === 'staff' && user.staffData) {
      setStaffData({
        ...user.staffData,
        joiningDate: user.staffData.joiningDate instanceof Date
          ? user.staffData.joiningDate
          : new Date((user.staffData.joiningDate as any)?.seconds * 1000 || Date.now()),
      });
    } else if (user.role === 'admin') {
      setAdminData({
        name: user.name || '',
        email: user.email || '',
        staffId: user.staffId || '',
        designation: user.designation || '',
        joiningDate: user.joiningDate instanceof Date
          ? user.joiningDate
          : new Date((user.joiningDate as any)?.seconds * 1000 || Date.now()),
        nid: user.nid || '',
        photoUrl: user.photoUrl || '',
      });
    }

    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || isProcessing) return;

    setIsProcessing(true);
    try {
      let updateData: Partial<ExtendedUser> = { role };
      if (role === 'student') {
        updateData.studentData = studentData;
        delete updateData.staffData;
      } else if (role === 'staff') {
        updateData.staffData = staffData;
        delete updateData.studentData;
      } else if (role === 'admin') {
        updateData = {
          ...updateData,
          name: adminData.name,
          email: adminData.email,
          staffId: adminData.staffId,
          designation: adminData.designation,
          joiningDate: adminData.joiningDate,
          nid: adminData.nid,
          photoUrl: adminData.photoUrl,
        };
        delete updateData.studentData;
        delete updateData.staffData;
      }

      await editUser(selectedUser.id, updateData);
      toast({
        title: 'Success',
        description: `${selectedUser.name}'s data updated successfully.`,
      });
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers as ExtendedUser[]);
      setFilteredUsers(updatedUsers as ExtendedUser[]);
      setIsModalOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update user',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string, userName: string) => {
    if (isProcessing || !window.confirm(`Are you sure you want to delete ${userName}?`)) return;

    setIsProcessing(true);
    try {
      await deleteUser(userId);
      toast({
        title: 'Success',
        description: `${userName} deleted successfully.`,
      });
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers as ExtendedUser[]);
      setFilteredUsers(updatedUsers as ExtendedUser[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete user',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        {/* Header with Filters */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={isProcessing}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value: 'all' | 'admin' | 'staff' | 'student') => setRoleFilter(value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Photo</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Email</TableHead>
                  <TableHead className="text-left">Role</TableHead>
                  <TableHead className="text-left">Role-Specific Info</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.photoUrl || user.studentData?.photoUrl || user.staffData?.photoUrl ? (
                          <img
                            src={user.photoUrl || user.studentData?.photoUrl || user.staffData?.photoUrl}
                            alt={user.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{user.name || 'Unknown'}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.role === 'student' && user.studentData ? (
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Student ID:</span> {user.studentData.studentId}</p>
                            <p><span className="font-medium">Class:</span> {user.studentData.class}</p>
                            <p><span className="font-medium">Number:</span> {user.studentData.number}</p>
                            <p><span className="font-medium">Description:</span> {user.studentData.description || 'N/A'}</p>
                            <p><span className="font-medium">English Name:</span> {user.studentData.englishName || 'N/A'}</p>
                            <p><span className="font-medium">Mother’s Name:</span> {user.studentData.motherName || 'N/A'}</p>
                            <p><span className="font-medium">Father’s Name:</span> {user.studentData.fatherName || 'N/A'}</p>
                          </div>
                        ) : user.role === 'staff' && user.staffData ? (
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Staff ID:</span> {user.staffData.staffId}</p>
                            <p><span className="font-medium">Name (Bangla):</span> {user.staffData.nameBangla}</p>
                            <p><span className="font-medium">Subject:</span> {user.staffData.subject}</p>
                            <p><span className="font-medium">Designation:</span> {user.staffData.designation}</p>
                            <p><span className="font-medium">Joining Date:</span> {new Date(user.staffData.joiningDate).toLocaleDateString()}</p>
                            <p><span className="font-medium">NID:</span> {user.staffData.nid}</p>
                            <p><span className="font-medium">Mobile:</span> {user.staffData.mobile}</p>
                          </div>
                        ) : user.role === 'admin' ? (
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Staff ID:</span> {user.staffId || 'N/A'}</p>
                            <p><span className="font-medium">Designation:</span> {user.designation || 'N/A'}</p>
                            <p><span className="font-medium">Joining Date:</span> {user.joiningDate ? new Date((user.joiningDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                            <p><span className="font-medium">NID:</span> {user.nid || 'N/A'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No role-specific data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            disabled={isProcessing}
                          >
                            {isProcessing && selectedUser?.id === user.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <PencilIcon className="h-4 w-4 mr-1" />
                            )}
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.name || 'Unknown')}
                            disabled={isProcessing}
                          >
                            {isProcessing && selectedUser?.id === user.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2Icon className="h-4 w-4 mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Role-Based Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value: 'admin' | 'staff' | 'student') => setRole(value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={studentData.studentId}
                      onChange={(e) => setStudentData({ ...studentData, studentId: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={studentData.name}
                      onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={studentData.class}
                      onChange={(e) => setStudentData({ ...studentData, class: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Number</Label>
                    <Input
                      id="number"
                      value={studentData.number}
                      onChange={(e) => setStudentData({ ...studentData, number: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={studentData.description || ''}
                      onChange={(e) => setStudentData({ ...studentData, description: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="englishName">English Name</Label>
                    <Input
                      id="englishName"
                      value={studentData.englishName || ''}
                      onChange={(e) => setStudentData({ ...studentData, englishName: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherName">Mother’s Name</Label>
                    <Input
                      id="motherName"
                      value={studentData.motherName || ''}
                      onChange={(e) => setStudentData({ ...studentData, motherName: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fatherName">Father’s Name</Label>
                    <Input
                      id="fatherName"
                      value={studentData.fatherName || ''}
                      onChange={(e) => setStudentData({ ...studentData, fatherName: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={studentData.photoUrl || ''}
                      onChange={(e) => setStudentData({ ...studentData, photoUrl: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                </>
              )}

              {role === 'staff' && (
                <>
                  <div>
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      value={staffData.staffId}
                      onChange={(e) => setStaffData({ ...staffData, staffId: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameBangla">Name (Bangla)</Label>
                    <Input
                      id="nameBangla"
                      value={staffData.nameBangla}
                      onChange={(e) => setStaffData({ ...staffData, nameBangla: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameEnglish">Name (English)</Label>
                    <Input
                      id="nameEnglish"
                      value={staffData.nameEnglish}
                      onChange={(e) => setStaffData({ ...staffData, nameEnglish: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={staffData.subject}
                      onChange={(e) => setStaffData({ ...staffData, subject: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={staffData.designation}
                      onChange={(e) => setStaffData({ ...staffData, designation: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={staffData.joiningDate.toISOString().split('T')[0]}
                      onChange={(e) => setStaffData({ ...staffData, joiningDate: new Date(e.target.value) })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nid">NID</Label>
                    <Input
                      id="nid"
                      value={staffData.nid}
                      onChange={(e) => setStaffData({ ...staffData, nid: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={staffData.mobile}
                      onChange={(e) => setStaffData({ ...staffData, mobile: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={staffData.photoUrl || ''}
                      onChange={(e) => setStaffData({ ...staffData, photoUrl: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                </>
              )}

              {role === 'admin' && (
                <>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={adminData.name}
                      onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      value={adminData.staffId}
                      onChange={(e) => setAdminData({ ...adminData, staffId: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={adminData.designation}
                      onChange={(e) => setAdminData({ ...adminData, designation: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={adminData.joiningDate.toISOString().split('T')[0]}
                      onChange={(e) => setAdminData({ ...adminData, joiningDate: new Date(e.target.value) })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nid">NID</Label>
                    <Input
                      id="nid"
                      value={adminData.nid}
                      onChange={(e) => setAdminData({ ...adminData, nid: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input
                      id="photoUrl"
                      value={adminData.photoUrl || ''}
                      onChange={(e) => setAdminData({ ...adminData, photoUrl: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                </>
              )}

              <DialogFooter className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2 mt-4">
                <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserVerify;