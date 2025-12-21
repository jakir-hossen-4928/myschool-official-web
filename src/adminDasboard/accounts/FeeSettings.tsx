import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash, X, Calendar as CalendarIcon, Info, Layers, Tag, DollarSign, Calculator } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addYears, formatISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import classesData from '@/lib/classes.json';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

interface FeeSetting {
  feeId?: string;
  feeType: string;
  classes: string[];
  description: string;
  amount: number;
  activeFrom: string;
  activeTo: string;
  canOverride: boolean;
  frequency: 'monthly' | 'one-time';
  examName?: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const DEFAULT_FEE_TYPE_OPTIONS = [
  { value: 'admission', label: 'Admission Fee' },
  { value: 'tuition', label: 'Tuition Fee' },
  { value: 'session', label: 'Session Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'library', label: 'Library Fee' },
  { value: 'laboratory', label: 'Laboratory Fee' },
  { value: 'transport', label: 'Transport Fee' },
  { value: 'idcard', label: 'ID Card Fee' },
  { value: 'sports', label: 'Sports Fee' },
  { value: 'development', label: 'Development Fee' },
  { value: 'computer', label: 'Computer Fee' },
  { value: 'hostel', label: 'Hostel Fee' },
  { value: 'uniform', label: 'Uniform Fee' },
  { value: 'extra', label: 'Extra-Curricular Fee' },
  { value: 'latefine', label: 'Late Fee Fine' },
  { value: 'tc', label: 'Transfer Certificate Fee' },
];

const FEE_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'books', label: 'Books Fee' },
  // Add more as needed
];

const todayISO = formatISO(new Date(), { representation: 'date' });
const nextYearISO = formatISO(addYears(new Date(), 1), { representation: 'date' });

const PRESET_FEES = [
  { feeType: 'monthly', classes: ['Play'], amount: 300 },
  { feeType: 'monthly', classes: ['Nursery'], amount: 500 },
  { feeType: 'monthly', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'monthly', classes: ['Three', 'Four'], amount: 800 },
  { feeType: 'exam', classes: ['Play'], amount: 300 },
  { feeType: 'exam', classes: ['Nursery'], amount: 500 },
  { feeType: 'exam', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'exam', classes: ['Three', 'Four'], amount: 800 },
  { feeType: 'books', classes: ['Play'], amount: 300 },
  { feeType: 'books', classes: ['Nursery'], amount: 500 },
  { feeType: 'books', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'books', classes: ['Three', 'Four'], amount: 800 },
].map(fee => ({
  ...fee,
  description: `${fee.feeType} fee for ${fee.classes.join(', ')}`,
  activeFrom: todayISO,
  activeTo: nextYearISO,
  canOverride: false,
  frequency: fee.feeType === 'monthly' ? 'monthly' : 'one-time',
}));

const FeeSettings: React.FC = () => {
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editFeeSetting, setEditFeeSetting] = useState<Partial<FeeSetting> | null>(null);
  const { toast } = useToast();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const paginatedFeeSettings = useMemo(() => {
    const start = page * rowsPerPage;
    return feeSettings.slice(start, start + rowsPerPage);
  }, [feeSettings, page, rowsPerPage]);

  const [batchFees, setBatchFees] = useState([
    { feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false, frequency: 'one-time' }
  ]);

  const [customFeeTypes, setCustomFeeTypes] = useState<{ value: string, label: string }[]>([]);
  const allFeeTypeOptions = [...DEFAULT_FEE_TYPE_OPTIONS, ...customFeeTypes];

  const fetchFeeSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'fee-settings'));
      const allFeeSettings: FeeSetting[] = snapshot.docs.map((docSnapshot) => ({
        feeId: docSnapshot.id,
        ...docSnapshot.data(),
      })) as FeeSetting[];
      setFeeSettings(allFeeSettings);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch fee settings",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeeSettings();
  }, [fetchFeeSettings]);

  const handleSave = async () => {
    if (!editFeeSetting || !editFeeSetting.feeType || !editFeeSetting.description || !editFeeSetting.amount || !Array.isArray(editFeeSetting.classes) || editFeeSetting.classes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill all required fields and select at least one class.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...editFeeSetting,
        classes: editFeeSetting.classes,
      };
      delete (payload as any).feeId;

      if (editFeeSetting.feeId) {
        await updateDoc(doc(db, 'fee-settings', editFeeSetting.feeId), payload);
        toast({ title: 'Success', description: 'Fee setting updated successfully.' });
      } else {
        const docRef = await addDoc(collection(db, 'fee-settings'), payload);
        const newSetting = { ...payload, feeId: docRef.id };
        setFeeSettings(prev => [...prev, newSetting as FeeSetting]);
        toast({ title: 'Success', description: 'Fee setting added successfully.' });
      }
      setShowModal(false);
      setEditFeeSetting(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save fee setting.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (feeId: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'fee-settings', feeId));
      setFeeSettings(prev => prev.filter(s => s.feeId !== feeId));
      toast({ title: 'Success', description: 'Fee setting deleted successfully.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete fee setting.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditFeeSetting({
      feeType: '',
      classes: [],
      description: '',
      amount: 0,
      activeFrom: todayISO,
      activeTo: nextYearISO,
      canOverride: false,
      frequency: 'one-time',
    });
    setShowModal(true);
  };

  console.log(CLASS_OPTIONS);

  const [selectedClass, setSelectedClass] = useState("all");

  const handleClassCheckboxChange = (value: string, checked: boolean) => {
    if (value === "all") {
      setEditFeeSetting({
        ...editFeeSetting,
        classes: checked ? ["all"] : [],
      });
    } else {
      let newClasses = Array.isArray(editFeeSetting.classes) ? [...editFeeSetting.classes] : [];
      newClasses = newClasses.filter((v) => v !== "all"); // Remove "all" if present
      if (checked) {
        newClasses.push(value);
      } else {
        newClasses = newClasses.filter((v) => v !== value);
      }
      setEditFeeSetting({
        ...editFeeSetting,
        classes: newClasses,
      });
    }
  };

  const handleBatchFeeChange = (idx: number, field: string, value: any) => {
    setBatchFees(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleBatchClassChange = (idx: number, classValue: string, checked: boolean) => {
    setBatchFees(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      let newClasses = Array.isArray(row.classes) ? [...row.classes] : [];
      if (classValue === 'all') {
        newClasses = checked ? ['all'] : [];
      } else {
        newClasses = newClasses.filter(v => v !== 'all');
        if (checked) newClasses.push(classValue);
        else newClasses = newClasses.filter(v => v !== classValue);
      }
      return { ...row, classes: newClasses };
    }));
  };

  const addBatchFeeRow = () => setBatchFees(prev => [...prev, { feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false, frequency: 'one-time' }]);
  const removeBatchFeeRow = (idx: number) => setBatchFees(prev => prev.filter((_, i) => i !== idx));

  const handleBatchSubmit = async () => {
    const validFees = batchFees.filter(f => f.feeType && Array.isArray(f.classes) && f.classes.length > 0 && f.amount > 0 && f.description && f.activeFrom && f.activeTo);
    if (validFees.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all fields for at least one fee.' });
      return;
    }
    setIsLoading(true);
    try {
      await Promise.all(validFees.map(async fee => {
        const docRef = await addDoc(collection(db, 'fee-settings'), fee);
        return { ...fee, feeId: docRef.id };
      }));
      toast({ title: 'Success', description: 'Batch fees added successfully.' });
      setBatchFees([{ feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false, frequency: 'one-time' }]);
      fetchFeeSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add batch fees.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to load preset fees
  const loadPresetFees = () => {
    setBatchFees(PRESET_FEES.map(fee => ({ ...fee })));
  };

  // Add this function to reset batch fees
  const resetBatchFees = () => {
    setBatchFees([{ feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false, frequency: 'one-time' }]);
  };

  const handleAddFeeType = (newType: string) => {
    if (!newType) return;
    const exists = allFeeTypeOptions.some(opt => opt.value === newType.toLowerCase());
    if (!exists) {
      const newOption = { value: newType.toLowerCase(), label: newType };
      setCustomFeeTypes(prev => [...prev, newOption]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fee Settings</h1>
            <p className="text-gray-500 mt-1">Configure and manage school fee structures across all classes</p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Add New Setting
          </Button>
        </header>

        <Tabs defaultValue="main-table" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6 p-1 bg-gray-100/80 rounded-lg">
            <TabsTrigger value="main-table" className="rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Layers className="w-4 h-4 mr-2" /> Fee Table
            </TabsTrigger>
            <TabsTrigger value="batch-add" className="rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Batch Add
            </TabsTrigger>
          </TabsList>
          <TabsContent value="main-table">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {isLoading && (
                <div className="flex flex-col justify-center items-center p-20 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500 font-medium">Fetching fee structures...</span>
                </div>
              )}
              {!isLoading && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Fee Type</TableHead>
                        <TableHead className="font-semibold text-gray-700">Class</TableHead>
                        <TableHead className="font-semibold text-gray-700">Description</TableHead>
                        <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-700">Active Range</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFeeSettings.length > 0 ? paginatedFeeSettings.map((setting) => (
                        <TableRow key={setting.feeId} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium text-blue-600">
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="opacity-50" />
                              {allFeeTypeOptions.find(opt => opt.value === setting.feeType)?.label || setting.feeType}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(setting.classes || []).map(cls => (
                                <span key={cls} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                                  {cls === 'all' ? 'All Classes' : cls}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-gray-600 italic">
                            {setting.description}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900">
                            <span className="text-green-600 mr-0.5">৳</span>
                            {setting.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1 text-gray-500">
                                <span className="w-10">From:</span>
                                <span className="font-medium text-gray-700">{format(new Date(setting.activeFrom), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <span className="w-10">To:</span>
                                <span className="font-medium text-gray-700">{format(new Date(setting.activeTo), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setEditFeeSetting({ ...setting });
                                  setShowModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this fee setting?")) {
                                    handleDelete(setting.feeId!);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                            No fee settings found. Click "Add New Setting" to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bg-white"
                >
                  Previous
                </Button>
                <div className="px-3 py-1 bg-gray-50 rounded-md text-sm font-medium text-gray-700 border border-gray-200">
                  Page {page + 1} of {Math.ceil(feeSettings.length / rowsPerPage) || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * rowsPerPage >= feeSettings.length}
                  className="bg-white"
                >
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600">Rows per page:</label>
                <Select value={String(rowsPerPage)} onValueChange={v => setRowsPerPage(Number(v))}>
                  <SelectTrigger className="w-[80px] h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="batch-add">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Batch Entry</h2>
                    <p className="text-sm text-gray-500">Configure multiple fee rules simultaneously</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadPresetFees} className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                    <Layers className="w-4 h-4 mr-2" /> Load Templates
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetBatchFees} className="text-gray-500 hover:text-red-600">
                    <X className="w-4 h-4 mr-1" /> Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {batchFees.map((row, idx) => (
                  <div key={idx} className="group relative bg-gray-50/50 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/10 transition-all">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Fee Type Select */}
                      <div className="lg:col-span-3 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Type</label>
                        <select
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                          value={row.feeType}
                          onChange={e => handleBatchFeeChange(idx, 'feeType', e.target.value)}
                        >
                          <option value="">Choose Type</option>
                          {allFeeTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Class Multiselect (simulated with grid of labels) */}
                      <div className="lg:col-span-5 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Classes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {CLASS_OPTIONS.map(opt => (
                            <label key={opt} className={cn(
                              "flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer border transition-all",
                              Array.isArray(row.classes) && row.classes.includes(opt)
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                            )}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={Array.isArray(row.classes) && row.classes.includes(opt)}
                                onChange={e => handleBatchClassChange(idx, opt, e.target.checked)}
                              />
                              {opt === 'all' ? 'Every Class' : opt}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="lg:col-span-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                          <input
                            type="number"
                            className="w-full bg-white border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                            value={row.amount}
                            onChange={e => handleBatchFeeChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* Description Input */}
                      <div className="lg:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Short note..."
                          value={row.description}
                          onChange={e => handleBatchFeeChange(idx, 'description', e.target.value)}
                        />
                      </div>

                      {/* Action Button */}
                      <div className="lg:col-span-1 pt-7">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBatchFeeRow(idx)}
                          disabled={batchFees.length === 1}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Button variant="ghost" onClick={addBatchFeeRow} className="text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Another Row
                </Button>
                <div className="flex gap-3">
                  <p className="text-xs text-gray-500 hidden sm:block">Only filled rows will be submitted</p>
                  <Button onClick={handleBatchSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-md">
                    {isLoading ? 'Processing...' : 'Save All Records'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <AnimatePresence>
          {showModal && editFeeSetting && (
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
                    {editFeeSetting.feeId ? 'Edit Fee Setting' : 'Add New Fee Setting'}
                  </h2>
                  <button onClick={() => setShowModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">Fee Frequency</span>
                  </div>
                  <Select
                    value={editFeeSetting.frequency || 'one-time'}
                    onValueChange={(value) => setEditFeeSetting({ ...editFeeSetting, frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Recurring</SelectItem>
                      <SelectItem value="one-time">One-time Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">Fee Type</span>
                    <span className="text-xs text-gray-500">(ফি-এর ধরন লিখুন)</span>
                  </div>
                  <Input
                    placeholder="Fee Type (e.g., monthly_fee)"
                    value={editFeeSetting.feeType || ''}
                    onChange={(e) => setEditFeeSetting({ ...editFeeSetting, feeType: e.target.value } as any)}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">Class</span>
                    <span className="text-xs text-gray-500">(শ্রেণি নির্ধারণ করুন)</span>
                  </div>
                  <div>
                    <label className="font-semibold">Classes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CLASS_OPTIONS.filter(opt => opt !== 'all').map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Array.isArray(editFeeSetting.classes) && editFeeSetting.classes.includes(opt)}
                            onChange={e => handleClassCheckboxChange(opt, e.target.checked)}
                            disabled={
                              opt !== "all" &&
                              Array.isArray(editFeeSetting.classes) &&
                              editFeeSetting.classes.includes("all")
                            }
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">Description</span>
                    <span className="text-xs text-gray-500">(ফি-এর বিবরণ)</span>
                  </div>
                  <Input
                    placeholder="Description"
                    value={editFeeSetting.description || ''}
                    onChange={(e) => setEditFeeSetting({ ...editFeeSetting, description: e.target.value } as any)}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">Amount</span>
                    <span className="text-xs text-gray-500">(ফি-এর পরিমাণ)</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={editFeeSetting.amount || 0}
                    onChange={(e) => setEditFeeSetting({ ...editFeeSetting, amount: parseFloat(e.target.value) || 0 } as any)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editFeeSetting.activeFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFeeSetting.activeFrom ? format(new Date(editFeeSetting.activeFrom), "PPP") : <span>Pick a start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editFeeSetting.activeFrom as string)}
                        onSelect={(date) => setEditFeeSetting({ ...editFeeSetting, activeFrom: date?.toISOString() } as any)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editFeeSetting.activeTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFeeSetting.activeTo ? format(new Date(editFeeSetting.activeTo as string), "PPP") : <span>Pick an end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editFeeSetting.activeTo as string)}
                        onSelect={(date) => setEditFeeSetting({ ...editFeeSetting, activeTo: date?.toISOString() } as any)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canOverride"
                    checked={editFeeSetting.canOverride}
                    onCheckedChange={(checked) => setEditFeeSetting({ ...editFeeSetting, canOverride: !!checked } as any)}
                  />
                  <label htmlFor="canOverride">Allow override for individual students</label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Setting'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FeeSettings;