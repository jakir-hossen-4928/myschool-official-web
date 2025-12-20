import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash, Edit, Download, X, Settings, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import classesData from '@/lib/classes.json';

console.log('Firebase Firestore initialized');

// Updated interface to match server API structure
interface Student {
  id: string;
  studentId: string;
  name: string;
  number: string; // Phone number
  class: string;
  description: string;
  englishName: string;
  motherName: string;
  fatherName: string;
  photoUrl: string;
  academicYear: string;
  section: string;
  shift: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const SHIFT_OPTIONS = [
  "Morning", "Day", "Evening"
];

const SECTION_OPTIONS = [
  "A", "B", "C", "D", "E", "F"
];

const ACADEMIC_YEAR_OPTIONS = [
  "2025", "2026", "2027", "2028", "2029", "2030"
];

// Performance optimization: Memoized search function
const useSearchStudents = (students: Student[], searchQuery: string, searchField: string) => {
  return useMemo(() => {
    if (!searchQuery.trim()) return students;

    const searchLower = searchQuery.toLowerCase();
    return students.filter(student => {
      switch (searchField) {
        case 'studentId':
          return student.studentId.toLowerCase().includes(searchLower);
        case 'name':
          return student.name.toLowerCase().includes(searchLower) ||
            student.englishName.toLowerCase().includes(searchLower);
        case 'number':
          return student.number.toLowerCase().includes(searchLower);
        case 'class':
          return student.class.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            student.studentId.toLowerCase().includes(searchLower) ||
            student.name.toLowerCase().includes(searchLower) ||
            student.englishName.toLowerCase().includes(searchLower) ||
            student.number.toLowerCase().includes(searchLower) ||
            student.class.toLowerCase().includes(searchLower) ||
            student.fatherName.toLowerCase().includes(searchLower) ||
            student.motherName.toLowerCase().includes(searchLower)
          );
      }
    });
  }, [students, searchQuery, searchField]);
};

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'number' | 'class' | 'studentId'>('all');

  const { toast } = useToast();

  // Performance optimization: Memoized filtered students
  const filteredStudents = useSearchStudents(students, searchQuery, searchField);

  // Performance optimization: Memoized class-filtered students
  const classFilteredStudents = useMemo(() => {
    if (!selectedClass) return filteredStudents;
    return filteredStudents.filter(student => student.class === selectedClass);
  }, [filteredStudents, selectedClass]);

  // Performance optimization: Memoized paginated students
  const paginatedStudents = useMemo(() => {
    const pageSize = 30;
    const startIndex = currentPage * pageSize;
    return classFilteredStudents.slice(startIndex, startIndex + pageSize);
  }, [classFilteredStudents, currentPage]);

  // Performance optimization: Memoized display total
  const displayTotal = classFilteredStudents.length;

  // Fetch students from Firestore with optional queries
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      let q = query(collection(db, 'students'));

      // Apply class filter query if selected
      if (selectedClass) {
        q = query(q, where('class', '==', selectedClass));
      }

      // Apply exact match for studentId or number if searching by those fields
      if (searchQuery && (searchField === 'studentId' || searchField === 'number')) {
        const field = searchField === 'studentId' ? 'studentId' : 'number';
        q = query(q, where(field, '==', searchQuery));
      }

      const snapshot = await getDocs(q);
      const allStudents: Student[] = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Student[];
      setStudents(allStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch students",
      });
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedClass, searchQuery, searchField]);

  // Upload image to ImgBB with proper error handling
  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        params: {
          key: import.meta.env.VITE_IMGBB_API_KEY || '8214c397d8d128581e7bb4f84f230a86', // Add to your .env file
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.data && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error('Invalid response from ImgBB');
      }
    } catch (error: any) {
      console.error('ImgBB upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
    }
  };

  // Handle image upload with performance optimization
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Performance optimization: File size validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image size should be less than 5MB",
      });
      return;
    }

    // Performance optimization: File type validation
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a valid image file",
      });
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await uploadImageToImgBB(file);
      if (editStudent) {
        setEditStudent({ ...editStudent, photoUrl: imageUrl });
      }
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload image",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save student with performance optimization
  const handleSave = async () => {
    if (!editStudent?.name || !editStudent?.class || !editStudent?.studentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name, Student ID and Class are required",
      });
      return;
    }

    try {
      setIsLoading(true);

      const studentData = { ...editStudent };

      if (editStudent.id) {
        // Update existing student
        await updateDoc(doc(db, 'students', editStudent.id), studentData);
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Add new student
        delete studentData.id;
        await addDoc(collection(db, 'students'), studentData);
        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      setShowModal(false);
      setEditStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save student",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete student
  const handleDelete = async (studentId: string) => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'students', studentId));
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      setShowDeleteModal(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete student",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate CSV content
  const generateCSV = (studentsToExport: Student[]): string => {
    const headers = [
      'Student ID',
      'Name',
      'English Name',
      'Phone Number',
      'Class',
      'Description',
      'Father Name',
      'Mother Name',
      'Photo URL',
      'Academic Year',
      'Section',
      'Shift'
    ];
    const csvContent = [
      headers.join(','),
      ...studentsToExport.map((student) => [
        `"${(student.studentId || '').replace(/"/g, '""')}"`,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${student.englishName.replace(/"/g, '""')}"`,
        `"${student.number.replace(/"/g, '""')}"`,
        `"${student.class.replace(/"/g, '""')}"`,
        `"${(student.description || '').replace(/"/g, '""')}"`,
        `"${(student.fatherName || '').replace(/"/g, '""')}"`,
        `"${(student.motherName || '').replace(/"/g, '""')}"`,
        `"${(student.photoUrl || '').replace(/"/g, '""')}"`,
        student.academicYear,
        student.section,
        student.shift
      ].join(','))
    ].join('\n');
    return csvContent;
  };

  // Performance optimization: Memoized export students (class only, ignore search)
  const exportStudents = useMemo(() => {
    if (!selectedClass) return students;
    return students.filter(student => student.class === selectedClass);
  }, [students, selectedClass]);

  // Handle export to CSV
  const handleExportToCSV = async () => {
    try {
      const csvContent = generateCSV(exportStudents);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students${selectedClass ? `_${selectedClass}` : ''}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV exported successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to export CSV",
      });
    }
  };

  // Handle photo download
  const handlePhotoDownload = async (student: Student) => {
    if (!student.photoUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No photo available for this student",
      });
      return;
    }

    try {
      const response = await axios.get(student.photoUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student.name}_photo.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Photo downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download photo",
      });
    }
  };

  // Effects with performance optimization
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Calculate pagination
  const totalPages = Math.ceil(displayTotal / 30);
  const startIndex = currentPage * 30;
  const endIndex = Math.min(startIndex + 30, displayTotal);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage student profiles and information</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setEditStudent({
                  id: '',
                  studentId: '',
                  name: '',
                  number: '',
                  class: '',
                  description: '',
                  englishName: '',
                  motherName: '',
                  fatherName: '',
                  photoUrl: '',
                  academicYear: '2025',
                  section: 'A',
                  shift: 'Morning',
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Add Student</span>
            </button>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Fields</option>
                <option value="studentId">Student ID</option>
                <option value="name">Name</option>
                <option value="number">Phone Number</option>
                <option value="class">Class</option>
              </select>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : paginatedStudents.length > 0 ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Students ({displayTotal})
                  </h2>
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{endIndex} of {displayTotal}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
                {paginatedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {student.photoUrl && (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                            loading="lazy"
                          />
                        )}
                        <h3 className="font-semibold text-gray-900 text-center">{student.name}</h3>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {student.studentId && (
                        <p><span className="font-medium">ID:</span> {student.studentId}</p>
                      )}
                      <p><span className="font-medium">Phone:</span> {student.number}</p>
                      <p><span className="font-medium">Class:</span> {student.class}</p>
                      <p><span className="font-medium">Year:</span> {student.academicYear}</p>
                      <p><span className="font-medium">Section:</span> {student.section}</p>
                      <p><span className="font-medium">Shift:</span> {student.shift}</p>
                      {student.description && (
                        <p><span className="font-medium">Description:</span> {student.description}</p>
                      )}
                      {student.fatherName && (
                        <p><span className="font-medium">Father:</span> {student.fatherName}</p>
                      )}
                      {student.motherName && (
                        <p><span className="font-medium">Mother:</span> {student.motherName}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setEditStudent(student);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Student"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(student.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Student"
                      >
                        <Trash size={16} />
                      </button>
                      {student.photoUrl && (
                        <button
                          onClick={() => handlePhotoDownload(student)}
                          className="text-green-600 hover:text-green-800"
                          title="Download Photo"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first student.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Student Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editStudent?.id ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button onClick={() => setShowModal(false)}>
                    <X size={24} />
                  </button>
                </div>

                {editStudent && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Student ID *</label>
                        <input
                          type="text"
                          value={editStudent.studentId}
                          onChange={(e) => setEditStudent({ ...editStudent, studentId: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={editStudent.name}
                          onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">English Name</label>
                        <input
                          type="text"
                          value={editStudent.englishName}
                          onChange={(e) => setEditStudent({ ...editStudent, englishName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Class *</label>
                        <select
                          value={editStudent.class}
                          onChange={(e) => setEditStudent({ ...editStudent, class: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Class</option>
                          {CLASS_OPTIONS.map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <input
                          type="text"
                          value={editStudent.number}
                          onChange={(e) => setEditStudent({ ...editStudent, number: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Father's Name</label>
                        <input
                          type="text"
                          value={editStudent.fatherName}
                          onChange={(e) => setEditStudent({ ...editStudent, fatherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={editStudent.motherName}
                          onChange={(e) => setEditStudent({ ...editStudent, motherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Academic Year</label>
                        <select
                          value={editStudent.academicYear}
                          onChange={(e) => setEditStudent({ ...editStudent, academicYear: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {ACADEMIC_YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <select
                          value={editStudent.section}
                          onChange={(e) => setEditStudent({ ...editStudent, section: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {SECTION_OPTIONS.map((section) => (
                            <option key={section} value={section}>
                              {section}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Shift</label>
                        <select
                          value={editStudent.shift}
                          onChange={(e) => setEditStudent({ ...editStudent, shift: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {SHIFT_OPTIONS.map((shift) => (
                            <option key={shift} value={shift}>
                              {shift}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={editStudent.description}
                        onChange={(e) => setEditStudent({ ...editStudent, description: e.target.value })}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Photo</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editStudent.photoUrl}
                          onChange={(e) => setEditStudent({ ...editStudent, photoUrl: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter photo URL or upload image"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          {isLoading ? 'Uploading...' : 'Upload'}
                        </label>
                      </div>
                      {editStudent.photoUrl && (
                        <div className="mt-2">
                          <img
                            src={editStudent.photoUrl}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editStudent.id ? 'Update Student' : 'Add Student'}
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Delete Student</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this student? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Students;