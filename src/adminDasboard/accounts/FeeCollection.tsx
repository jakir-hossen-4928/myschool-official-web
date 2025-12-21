import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Printer, Calendar as CalendarIcon, Send } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { Search, User, CreditCard, Receipt, FileText, Smartphone, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import classesData from '@/lib/classes.json';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';



interface Student {
  id: string; // Firestore Doc ID
  studentId: string; // Roll/Code
  name: string;
  number: string;
  class: string;
  section?: string;
  shift?: string;
  fatherName?: string;
}

interface FeeAnalysisItem {
  feeId: string;
  description: string;
  actualAmount: number;
  totalPaid: number;
  dueAmount: number;
  // For UI state
  selected: boolean;
  amountToPay: number;
}

interface FeeSetting {
  id: string; // Firestore DOC ID
  feeType: string;
  description: string;
  amount: number;
  classes: string[];
  activeFrom: string;
  activeTo: string;
  frequency: 'monthly' | 'one-time';
}

interface FeeCollectionRecord {
  id: string;
  date: string;
  studentId: string;
  feeId: string;
  month: string;
  year: string;
  quantity: number;
  amountPaid: number;
  paymentMethod: string;
  description: string;
}

interface CustomFee {
  id: string;
  studentId: string;
  feeId: string;
  newAmount: number;
  effectiveFrom: string;
  active: boolean;
  reason: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const FeeCollection = () => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [collectionItems, setCollectionItems] = useState<FeeAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [narration, setNarration] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const { toast } = useToast();
  const receiptRef = useRef(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [allFeeSettings, setAllFeeSettings] = useState<FeeSetting[]>([]);
  const [targetMonth, setTargetMonth] = useState((new Date().getMonth() + 1).toString());
  const [targetYear, setTargetYear] = useState(new Date().getFullYear().toString());

  const MONTHS = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const YEARS = Array.from({ length: 11 }, (_, i) => (2025 + i).toString());

  // Compute fee summary
  const computeFeeSummary = useCallback(async (student: Student) => {
    try {
      // Fetch all fee settings
      const feeSettingsSnapshot = await getDocs(collection(db, 'fee-settings'));
      const feeSettings: FeeSetting[] = feeSettingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeSetting));

      // Filter applicable fee settings for student's class and current date
      const now = new Date();
      const applicableFees = feeSettings.filter(fee => {
        const isClassApplicable = fee.classes.includes('all') || fee.classes.includes(student.class);
        const isActiveInRange = isWithinInterval(now, {
          start: startOfDay(new Date(fee.activeFrom)),
          end: endOfDay(new Date(fee.activeTo))
        });
        return isClassApplicable && isActiveInRange;
      });

      // Fetch custom fees for student
      const customQuery = query(collection(db, 'custom-student-fees'), where('studentId', '==', student.studentId), where('active', '==', true));
      const customSnapshot = await getDocs(customQuery);
      const customFees: CustomFee[] = customSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomFee));

      // Fetch existing payments for student for this specific year
      // We will filter by month in memory to handle different frequencies
      const paymentQuery = query(
        collection(db, 'fee-collections'),
        where('studentId', '==', student.studentId),
        where('year', '==', targetYear)
      );
      const paymentSnapshot = await getDocs(paymentQuery);
      const payments: FeeCollectionRecord[] = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeCollectionRecord));

      // Compute summary
      const summary: FeeAnalysisItem[] = applicableFees.map(fee => {
        const custom = customFees.find(c => c.feeId === fee.id);
        const actualAmount = custom ? custom.newAmount : fee.amount;

        // Calculate paid amount based on frequency
        let totalPaid = 0;
        if (fee.frequency === 'monthly') {
          // Monthly fees only care about the target month
          totalPaid = payments
            .filter(p => p.feeId === fee.id && p.month === targetMonth)
            .reduce((sum, p) => sum + p.amountPaid, 0);
        } else {
          // One-time fees care about the whole session (year)
          totalPaid = payments
            .filter(p => p.feeId === fee.id)
            .reduce((sum, p) => sum + p.amountPaid, 0);
        }

        const dueAmount = Math.max(0, actualAmount - totalPaid);

        return {
          feeId: fee.id,
          description: fee.description + (fee.frequency === 'monthly' ? ` (${MONTHS.find(m => m.value === targetMonth)?.label})` : ''),
          actualAmount,
          totalPaid,
          dueAmount,
          selected: dueAmount > 0,
          amountToPay: dueAmount,
        };
      });

      setCollectionItems(summary);
    } catch (error) {
      console.error('Error computing fee summary:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to compute fee summary.' });
    }
  }, [toast, targetMonth, targetYear, MONTHS]);

  const handleLoadStudent = useCallback(async () => {
    if (!studentIdInput) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
      return;
    }
    setIsLoading(true);
    try {
      let student: Student | null = null;
      // Try by studentId first
      const idQuery = query(collection(db, 'students'), where('studentId', '==', studentIdInput));
      let snapshot = await getDocs(idQuery);
      if (snapshot.docs.length > 0) {
        student = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student;
      } else {
        // Fallback to number
        const numberQuery = query(collection(db, 'students'), where('number', '==', studentIdInput));
        snapshot = await getDocs(numberQuery);
        if (snapshot.docs.length > 0) {
          student = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student;
        }
      }

      if (!student) {
        toast({ variant: 'destructive', title: 'Not Found', description: 'Student not found.' });
        setSelectedStudent(null);
        setCollectionItems([]);
        return;
      }
      setSelectedStudent(student);

      await computeFeeSummary(student);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student data.' });
      setSelectedStudent(null);
      setCollectionItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentIdInput, toast, computeFeeSummary]);

  const handleItemSelection = (feeId: string, isSelected: boolean) => {
    setCollectionItems(prev =>
      prev.map(item =>
        item.feeId === feeId ? { ...item, selected: isSelected } : item
      )
    );
  };

  const handleAmountToPayChange = (feeId: string, amount: number) => {
    setCollectionItems(prev =>
      prev.map(item => {
        if (item.feeId === feeId) {
          const newAmount = Math.max(0, amount);
          return {
            ...item,
            amountToPay: newAmount,
            dueAmount: Math.max(0, item.actualAmount - (item.totalPaid + newAmount)),
          };
        }
        return item;
      })
    );
  };

  const totalToCollect = collectionItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.amountToPay, 0);

  const generateAndPrintInvoice = (paidItems: any[], transactionId: string) => {
    const studentCopy = `
      <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; font-family: sans-serif;">
        <h2 style="text-align: center;">Student Copy</h2>
        <p><strong>Student:</strong> ${selectedStudent?.name}</p>
        <p><strong>Student ID:</strong> ${selectedStudent?.studentId}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${format(collectionDate, 'PPP')}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr><th style="border-bottom: 1px solid #000; text-align: left;">Fee Head</th><th style="border-bottom: 1px solid #000; text-align: right;">Amount</th></tr></thead>
          <tbody>
            ${paidItems.map(item => `<tr><td style="padding: 5px 0;">${item.description}</td><td style="padding: 5px 0; text-align: right;">${item.amountToPay.toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; margin-top: 10px;">Total Paid: ${totalToCollect.toFixed(2)}</p>
      </div>`;

    const officeCopy = studentCopy.replace('Student Copy', 'Office Copy');

    const combined = `<div ref={receiptRef}>${studentCopy}${officeCopy}</div>`;

    const element = document.createElement('div');
    element.innerHTML = combined;

    html2pdf().from(element).set({
      margin: 10,
      filename: `receipt-${selectedStudent?.studentId}-${transactionId}.pdf`,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  const handlePost = async () => {
    const itemsToPay = collectionItems.filter(item => item.selected && item.amountToPay > 0);
    if (itemsToPay.length === 0 || !selectedStudent) {
      toast({ variant: 'destructive', title: 'Error', description: 'No items selected for payment.' });
      return;
    }

    setIsLoading(true);
    const transactionId = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Date.now()}`;

    try {
      const collectionPromises = itemsToPay.map(item => {
        const payload = {
          date: collectionDate.toISOString(),
          studentId: selectedStudent.studentId,
          feeId: item.feeId,
          month: targetMonth,
          year: targetYear,
          quantity: 1,
          amountPaid: item.amountToPay,
          paymentMethod: paymentMethod,
          description: narration || item.description,
        };
        return addDoc(collection(db, 'fee-collections'), payload);
      });

      await Promise.all(collectionPromises);

      if (sendSms && selectedStudent?.number) {
        // Since we are removing backend, we'll suggest a manual SMS or just log it
        toast({ title: 'Payment Recorded', description: 'SMS functionality is currently offline. Please send a manual confirmation.' });
      }

      toast({ title: 'Success', description: 'Payment posted successfully.' });
      generateAndPrintInvoice(itemsToPay, transactionId);
      // Reload student data
      handleLoadStudent();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post payment.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Update SMS template when student or fee data changes
  useEffect(() => {
    if (!selectedStudent) {
      setSmsMessage('');
      return;
    }
    const unpaidItems = collectionItems.filter(item => item.dueAmount > 0);
    const unpaidText = unpaidItems.map(item => `${item.description}: ৳${item.dueAmount.toFixed(2)}`).join(', ');
    setSmsMessage(
      `প্রিয় অভিভাবক, ${selectedStudent.name} (${selectedStudent.id})-এর জন্য বকেয়া: ${unpaidText || 'নেই'}। অনুগ্রহ করে নির্ধারিত সময়ে পরিশোধ করুন। ধন্যবাদ, MySchool`
    );
  }, [selectedStudent, collectionItems]);

  const handleSendSms = async () => {
    toast({ title: 'Information', description: 'SMS service is being migrated to Firebase Cloud Functions and is temporarily unavailable.' });
  };

  useEffect(() => {
    const fetchAllFeeSettings = async () => {
      const snapshot = await getDocs(collection(db, 'fee-settings'));
      const allSettings: FeeSetting[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeSetting));
      setAllFeeSettings(allSettings);
    };
    fetchAllFeeSettings();
  }, []);

  const handleAddOtherFee = (feeId: string) => {
    const fee = allFeeSettings.find(f => f.id === feeId);
    if (fee && !collectionItems.some(item => item.feeId === feeId)) {
      setCollectionItems(prev => [
        ...prev,
        {
          feeId: fee.id,
          description: fee.description,
          actualAmount: fee.amount,
          totalPaid: 0,
          dueAmount: fee.amount,
          selected: true,
          amountToPay: fee.amount,
        }
      ]);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fees Collection</h1>
            <p className="text-gray-500 mt-1">Manage student payments and generate digital receipts</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold flex items-center gap-2 border border-blue-100">
              <CreditCard size={18} />
              Total: ৳{totalToCollect.toLocaleString()}
            </div>
          </div>
        </header>

        {/* Top Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Search size={16} className="text-blue-500" />
              Student Search (ID or Number)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter St Code..."
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadStudent()}
                className="focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleLoadStudent} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? '...' : 'Load'}
              </Button>
              {selectedStudent && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentIdInput('');
                    setCollectionItems([]);
                  }}
                  className="px-2"
                >
                  <X size={18} />
                </Button>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-500" />
              Target Month & Year
            </label>
            <div className="flex gap-2">
              <Select value={targetMonth} onValueChange={setTargetMonth}>
                <SelectTrigger className="flex-1 bg-white border border-gray-200">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={targetYear} onValueChange={setTargetYear}>
                <SelectTrigger className="w-[100px] bg-white border border-gray-200">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" />
              Payment Method
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full bg-white border border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash (Hand-to-hand)</SelectItem>
                <SelectItem value="bKash">bKash (Mobile)</SelectItem>
                <SelectItem value="Nagad">Nagad (Mobile)</SelectItem>
                <SelectItem value="Rocket">Rocket (Mobile)</SelectItem>
                <SelectItem value="Bank Transfer">Bank Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-500" />
              Collection Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal border-gray-200", !collectionDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {collectionDate ? format(collectionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={collectionDate} onSelect={(d) => setCollectionDate(d || new Date())} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Reference
            </label>
            <Input disabled value={`TXN-${format(new Date(), 'yyyyMMdd')}`} className="bg-gray-50 italic opacity-70" />
          </div>

          <div className="col-span-full space-y-2 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Internal Note / Narration
            </label>
            <Input placeholder="Add any special notes or receipt references here..." value={narration} onChange={(e) => setNarration(e.target.value)} className="bg-gray-50/50" />
          </div>
        </div>

        {/* Student Profile Card */}
        <AnimatePresence>
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <User size={120} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 backdrop-blur-sm">
                    <User size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-blue-100 font-medium opacity-90">Class: {selectedStudent.class} • Sec: {selectedStudent.section || 'General'} • Roll: {selectedStudent.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm bg-black/10 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex flex-col"><span className="opacity-70 font-medium">Guardian</span><span>{selectedStudent.fatherName || 'N/A'}</span></div>
                  <div className="flex flex-col"><span className="opacity-70 font-medium">Mobile</span><span>{selectedStudent.number}</span></div>
                  <div className="flex flex-col"><span className="opacity-70 font-medium">Shift</span><span>{selectedStudent.shift || 'N/A'}</span></div>
                  <div className="flex flex-col"><span className="opacity-70 font-medium">Status</span><span className="text-green-300 font-bold">Active</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collection Entry Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Receipt size={18} className="text-blue-500" />
              Fee Breakdown
            </h3>
            {selectedStudent && (
              <Select onValueChange={handleAddOtherFee}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-gray-50 border-gray-200">
                  <SelectValue placeholder="+ Add Optional Fee" />
                </SelectTrigger>
                <SelectContent>
                  {allFeeSettings.filter(f => !collectionItems.some(item => item.feeId === f.id)).map(fee => (
                    <SelectItem key={fee.id} value={fee.id}>{fee.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center">
                    <Checkbox
                      checked={collectionItems.length > 0 && collectionItems.every(item => item.selected)}
                      onCheckedChange={(checked) => setCollectionItems(prev => prev.map(item => ({ ...item, selected: !!checked })))}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Fee Category</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Mandatory Amt</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Paid so far</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Current Balance</TableHead>
                  <TableHead className="text-right w-[160px] font-semibold text-gray-700">Payment Intake</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionItems.length > 0 ? collectionItems.map(item => (
                  <TableRow key={item.feeId} className={cn("transition-colors", item.selected ? "bg-blue-50/30" : "")}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) => handleItemSelection(item.feeId, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {item.description}
                      <p className="text-[10px] text-gray-400 font-mono tracking-tighter">Code: {item.feeId.slice(-6)}</p>
                    </TableCell>
                    <TableCell className="text-right text-gray-600">৳{item.actualAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">৳{item.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      ৳{(item.actualAmount - (item.totalPaid + (item.selected ? item.amountToPay : 0))).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">৳</span>
                        <Input
                          type="number"
                          className={cn(
                            "text-right h-9 focus:ring-2",
                            item.selected ? "bg-white border-blue-300 ring-blue-500" : "bg-gray-100/50 border-transparent italic"
                          )}
                          value={item.amountToPay}
                          onChange={(e) => handleAmountToPayChange(item.feeId, parseFloat(e.target.value) || 0)}
                          disabled={!item.selected}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-48 py-10">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Receipt size={64} />
                        <p>{selectedStudent ? 'No applicable fees for this student today.' : 'Please load a student record to begin collection'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Payable Amount</p>
            <p className="text-4xl font-extrabold text-blue-900 leading-none">
              <span className="text-xl font-normal text-blue-600 mr-2">৳</span>
              {totalToCollect.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={handlePost}
              disabled={isLoading || totalToCollect === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 shadow-md h-12 active:scale-95 transition-all"
            >
              <Plus className="mr-2 h-5 w-5" /> Post Payment
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSmsModalOpen(true)}
                disabled={!selectedStudent}
                className="h-12 w-12 text-blue-600 border-blue-100 hover:bg-blue-50"
              >
                <Smartphone size={20} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => generateAndPrintInvoice(collectionItems.filter(i => i.selected && i.amountToPay > 0), 'preview')}
                disabled={!selectedStudent || totalToCollect === 0}
                className="h-12 w-12 text-orange-600 border-orange-100 hover:bg-orange-50"
              >
                <Receipt size={20} />
              </Button>
            </div>
          </div>
        </div>
        {/* SMS Modal */}
        <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send SMS to Parent</DialogTitle>
            </DialogHeader>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={4}
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                placeholder="Edit the SMS message before sending..."
              />
              <p className="text-xs text-gray-500 mt-2">
                এখানে আপনি SMS টেমপ্লেট সম্পাদনা করতে পারেন। বকেয়া, ছাত্রের নাম, এবং অন্যান্য তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে, তবে আপনি চাইলে বার্তা পরিবর্তন করতে পারবেন। এই বার্তা অভিভাবকের মোবাইলে যাবে।
              </p>
            </div>
            <DialogFooter className="flex flex-row gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={async () => { await handleSendSms(); setSmsModalOpen(false); }} disabled={smsLoading || !selectedStudent}>
                <Send className="mr-2 h-4 w-4" /> {smsLoading ? 'Sending...' : 'Send SMS'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FeeCollection;