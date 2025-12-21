import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash, Search, User, Tag, Edit, DollarSign, Info, CheckCircle2, XCircle, Settings, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import classesData from '@/lib/classes.json';

interface CustomFee {
  id?: string;
  studentId: string; // Link via studentId (Roll)
  studentName: string;
  feeId: string;
  newAmount: number;
  effectiveFrom: string;
  active: boolean;
  reason: string;
}

interface Student {
  id: string; // Firestore Doc ID
  studentId: string; // Roll/Code
  name: string;
  number: string;
  class: string;
}

interface FeeSetting {
  id: string; // Firestore DOC ID
  description: string;
  amount: number;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const CustomStudentFees: React.FC = () => {
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState<Partial<CustomFee>>({
    feeId: '',
    newAmount: 0,
    reason: '',
    active: true
  });

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [feesSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'custom-student-fees')),
        getDocs(collection(db, 'fee-settings'))
      ]);

      setCustomFees(feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomFee)));
      setFeeSettings(settingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeeSetting)));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Initialization failed" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSearchStudent = async () => {
    if (!studentSearch.trim()) return;
    setIsSearching(true);
    try {
      // Search by ID (ST_CODE)
      const q = query(collection(db, 'students'), where('studentId', '==', studentSearch.trim()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setSelectedStudent({ id: snap.docs[0].id, ...snap.docs[0].data() } as Student);
      } else {
        // Fallback search by number
        const q2 = query(collection(db, 'students'), where('number', '==', studentSearch.trim()));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          setSelectedStudent({ id: snap2.docs[0].id, ...snap2.docs[0].data() } as Student);
        } else {
          toast({ variant: 'destructive', title: 'Not Found', description: 'No student found with this ID/Number' });
          setSelectedStudent(null);
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStudent || !formData.feeId || formData.newAmount === undefined) {
      toast({ variant: 'destructive', title: 'Validation', description: 'Please select a student, fee rule and specify amount' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        feeId: formData.feeId,
        newAmount: formData.newAmount,
        reason: formData.reason || '',
        active: formData.active ?? true,
        effectiveFrom: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'custom-student-fees'), payload);
      setCustomFees(prev => [...prev, { id: docRef.id, ...payload } as CustomFee]);

      toast({ title: 'Success', description: 'Custom fee override established.' });

      // Reset form
      setFormData({ feeId: '', newAmount: 0, reason: '', active: true });
      setSelectedStudent(null);
      setStudentSearch('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save record' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? Standard fees will apply to this student again.")) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'custom-student-fees', id));
      setCustomFees(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Success', description: 'Override removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Delete failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Custom Student Fees</h1>
            <p className="text-gray-500 mt-1">Manage individual fee overrides and scholarships for specific students</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Plus size={20} className="text-blue-600" />
                Add New Override
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Search Student</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter ID or Phone..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                      className="bg-gray-50 border-gray-200"
                    />
                    <Button onClick={handleSearchStudent} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700">
                      {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search size={16} />}
                    </Button>
                  </div>
                </div>

                {selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3"
                  >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900 truncate">{selectedStudent.name}</p>
                      <p className="text-xs text-blue-700">Class {selectedStudent.class} • ID: {selectedStudent.id}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)} className="h-6 w-6 text-blue-400 hover:text-blue-600">
                      <XCircle size={14} />
                    </Button>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Select Fee Setting</label>
                  <Select
                    value={formData.feeId}
                    onValueChange={(val) => setFormData({ ...formData, feeId: val })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Choose a fee rule..." />
                    </SelectTrigger>
                    <SelectContent>
                      {feeSettings.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">New Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-7 bg-gray-50 border-gray-200 font-bold text-gray-900"
                      value={formData.newAmount}
                      onChange={(e) => setFormData({ ...formData, newAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Reason for override</label>
                  <Input
                    placeholder="e.g. Sibling Discount, Scholarship"
                    className="bg-gray-50 border-gray-200"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 shadow-md font-bold h-11"
                  onClick={handleSave}
                  disabled={isLoading || !selectedStudent || !formData.feeId}
                >
                  <Plus className="mr-2 h-4 w-4" /> Apply Override
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <Info className="text-blue-600 shrink-0" size={20} />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-bold">Information:</p>
                <p>Custom fees created here will override the default class fee structures during the collection process for the specific student.</p>
              </div>
            </div>
          </div>

          {/* List Area */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Active Fee Overrides</h2>
                <div className="text-xs text-gray-400">{customFees.length} Records Found</div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Student</TableHead>
                      <TableHead className="font-semibold text-gray-700">Fee Context</TableHead>
                      <TableHead className="font-semibold text-gray-700">Override Amt</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFees.length > 0 ? customFees.map((fee) => (
                      <TableRow key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                              {fee.studentName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{fee.studentName}</p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-tighter">ID: {fee.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag size={12} className="text-blue-500 opacity-50" />
                            <span className="text-sm text-gray-600 italic">
                              {feeSettings.find(f => f.id === fee.feeId)?.description || 'Loading/Removed...'}
                            </span>
                          </div>
                          {fee.reason && (
                            <p className="text-[10px] text-gray-400 mt-1 pl-5">Note: {fee.reason}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          ৳{fee.newAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {fee.active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 size={10} className="mr-1" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              <XCircle size={10} className="mr-1" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(fee.id!)}
                          >
                            <Trash size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-gray-400 py-10">
                          <div className="flex flex-col items-center justify-center opacity-30">
                            <Info size={48} />
                            <p className="mt-2">No custom student fees found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomStudentFees;