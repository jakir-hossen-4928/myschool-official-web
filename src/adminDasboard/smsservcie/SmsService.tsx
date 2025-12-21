import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, DollarSign, Wifi, X, Info,
  Search, Clipboard, CheckCircle2, AlertCircle,
  MessageSquare, LayoutGrid, List, FileText,
  ChevronRight, ArrowRight, Download, Filter,
  Phone, User, Hash, History, Settings
} from 'lucide-react';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
// @ts-ignore
import classesData from '@/lib/classes.json';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

interface Student {
  id: string;
  name: string;
  number: string;
  class: string;
  englishName?: string;
  motherName?: string;
  fatherName?: string;
  studentId: string;
}

const PLACEHOLDERS = [
  { key: '{student_name}', label: 'Student Name' },
  { key: '{english_name}', label: 'English Name' },
  { key: '{class}', label: 'Class' },
  { key: '{mother_name}', label: 'Mother Name' },
  { key: '{father_name}', label: 'Father Name' },
];

const SMS_LIMIT_GSM = 160;
const SMS_LIMIT_UNICODE = 70;

const SmsService: React.FC = () => {
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info' | 'error' | 'success' }[]>([]);
  const [activeTab, setActiveTab] = useState('compose');

  const addLog = useCallback((msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [{
      time: new Date().toLocaleTimeString(),
      msg,
      type
    }, ...prev].slice(0, 50));
  }, []);

  // Fetch initial data (Balance & IP)
  useEffect(() => {
    const fetchInitialData = async () => {
      addLog('Checking gateway connection...', 'info');
      try {
        const balanceResponse = await axios.get(`${BACKEND_URL}/getBalance`);
        if (balanceResponse.data && balanceResponse.data.balance !== undefined) {
          setApiStatus('connected');
          setAccountBalance(parseFloat(balanceResponse.data.balance));
          addLog('Gateway connected successfully', 'success');
        } else {
          setApiStatus('error');
          addLog('Failed to fetch gateway balance', 'error');
        }
      } catch (error) {
        setApiStatus('error');
        addLog(`Gateway error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    };
    fetchInitialData();
  }, [addLog]);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      setIsLoading(true);
      addLog(`Loading students for class: ${selectedClass}`, 'info');
      try {
        const q = query(
          collection(db, 'students'),
          where('class', '==', selectedClass),
          orderBy('name')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Student));
        setStudents(data);
        addLog(`Successfully loaded ${data.length} students from Firestore`, 'success');
      } catch (error) {
        addLog(`Firestore error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        toast.error('Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass, addLog]);

  const filteredStudents = useMemo(() => students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.number && student.number.includes(searchTerm)) ||
    (student.studentId && student.studentId.includes(searchTerm))
  ), [students, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const numbers = filteredStudents.map(s => s.number).filter(Boolean);
      setSelectedNumbers(numbers);
    } else {
      setSelectedNumbers([]);
    }
  };

  const handleCheckStudent = (number: string, checked: boolean) => {
    if (checked) {
      setSelectedNumbers(prev => [...prev, number]);
    } else {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    }
  };

  const generatePersonalizedMessage = (student: Student, template: string) => {
    let msg = template;
    msg = msg.replace(/{student_name}/g, student.name || '');
    msg = msg.replace(/{english_name}/g, student.englishName || '');
    msg = msg.replace(/{class}/g, student.class || '');
    msg = msg.replace(/{mother_name}/g, student.motherName || '');
    msg = msg.replace(/{father_name}/g, student.fatherName || '');
    return msg;
  };

  const isUnicode = (text: string) => {
    const gsm7BitExChars = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!\"#$%&'()*+,\-./:;<=>?-siÄÖÑÜ§¿äöñüà^{}\[~\]|€]+$/;
    return !gsm7BitExChars.test(text);
  };

  const smsMetrics = useMemo(() => {
    if (!message) return { parts: 0, totalSms: 0, cost: 0 };

    // We base the limit on the "worst case" (unicode if any student name is unicode or message is unicode)
    const unicode = isUnicode(message);
    const limitPerSms = unicode ? SMS_LIMIT_UNICODE : SMS_LIMIT_GSM;

    let totalParts = 0;
    selectedNumbers.forEach(num => {
      const student = students.find(s => s.number === num);
      if (student) {
        const personalized = generatePersonalizedMessage(student, message);
        totalParts += Math.ceil(personalized.length / limitPerSms);
      } else {
        totalParts += Math.ceil(message.length / limitPerSms);
      }
    });

    return {
      parts: totalParts,
      totalSms: selectedNumbers.length,
      cost: totalParts * 0.35 // Assuming 0.35 BDT per part
    };
  }, [message, selectedNumbers, students]);

  const handleSendSms = async () => {
    if (selectedNumbers.length === 0 || !message) {
      toast.error('Select recipients and enter a message');
      return;
    }

    if (accountBalance !== null && smsMetrics.cost > accountBalance) {
      toast.error('Insufficient gateway balance');
      return;
    }

    setIsLoading(true);
    addLog(`Initiating bulk send to ${selectedNumbers.length} recipients...`, 'info');

    let successCount = 0;
    let failCount = 0;

    try {
      // For heavy bulk operations, we process in chunks or handle all promises
      const chunk = async (nums: string[]) => {
        const promises = nums.map(async (number) => {
          const student = students.find(s => s.number === number);
          const personalizedMessage = student ? generatePersonalizedMessage(student, message) : message;

          try {
            const response = await axios.post(`${BACKEND_URL}/sendSMS`, {
              number,
              message: personalizedMessage,
            });
            if (response.data.response_code === 202) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
          }
        });
        await Promise.all(promises);
      };

      // Process in small batches of 5 to avoid overwhelming the gateway/server
      const batchSize = 5;
      for (let i = 0; i < selectedNumbers.length; i += batchSize) {
        await chunk(selectedNumbers.slice(i, i + batchSize));
      }

      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} messages`);
        addLog(`Batch complete. Success: ${successCount}, Failed: ${failCount}`, successCount > 0 ? 'success' : 'error');
        // Refresh balance after delay
        setTimeout(async () => {
          const balanceRes = await axios.get(`${BACKEND_URL}/getBalance`);
          if (balanceRes.data.balance) setAccountBalance(parseFloat(balanceRes.data.balance));
        }, 2000);
      } else {
        toast.error('Bulk sending failed');
      }

      if (failCount === 0) {
        setSelectedNumbers([]);
        setMessage('');
      }

    } catch (error) {
      addLog(`Critical error during bulk send: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
      toast.error('Bulk sending interrupted');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      {/* Header & Stats */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SMS Command Center</h1>
              <p className="text-slate-500 text-sm">Automated student notifications and bulk alerts</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold transition-all",
              apiStatus === 'connected' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
            )}>
              <span className={cn("h-2 w-2 rounded-full animate-pulse", apiStatus === 'connected' ? "bg-emerald-500" : "bg-red-500")} />
              {apiStatus === 'connected' ? "Gateway Active" : "Gateway Offline"}
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 font-black shadow-sm">
              <DollarSign className="h-5 w-5" />
              <span className="text-lg">
                {accountBalance !== null ? `${accountBalance.toFixed(2)} ৳` : '---'}
              </span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Configuration & Recipients */}
            <div className="w-full lg:w-[400px] shrink-0 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden overflow-y-auto max-h-[calc(100vh-200px)] sticky top-8">
                <CardHeader className="bg-white border-b border-slate-50 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 capitalize">Academy Class</label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="rounded-xl bg-slate-50 border-transparent focus:ring-indigo-500">
                          <SelectValue placeholder="Select class..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {CLASS_OPTIONS.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 capitalize">Quick Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Name, ID or Number..."
                          className="pl-9 rounded-xl border-none bg-slate-50"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedNumbers.length > 0 && selectedNumbers.length === filteredStudents.length}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        />
                        <label htmlFor="select-all" className="text-xs font-bold text-slate-600 cursor-pointer">
                          Select All ({filteredStudents.length})
                        </label>
                      </div>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px] font-black">
                        {selectedNumbers.length} SELECTED
                      </Badge>
                    </div>

                    <ScrollArea className="h-[300px] pr-4 -mr-4">
                      <div className="space-y-1">
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                            <p className="text-xs text-slate-400 animate-pulse">Synchronizing directory...</p>
                          </div>
                        ) : filteredStudents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                            <User className="h-10 w-10 opacity-20" />
                            <p className="text-[10px] font-bold uppercase">No records found</p>
                          </div>
                        ) : filteredStudents.map(student => (
                          <div
                            key={student.id}
                            onClick={() => handleCheckStudent(student.number, !selectedNumbers.includes(student.number))}
                            className={cn(
                              "group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                              selectedNumbers.includes(student.number) ? "bg-indigo-50/50 border-indigo-100" : "hover:bg-slate-50 border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedNumbers.includes(student.number)}
                                onCheckedChange={(checked) => handleCheckStudent(student.number, checked === true)}
                                onClick={e => e.stopPropagation()}
                              />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate leading-none">{student.name}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-mono">{student.number || 'No Number'}</p>
                              </div>
                            </div>
                            <Badge className="text-[9px] bg-slate-100 text-slate-500 font-mono shadow-none border-none">
                              {student.studentId?.slice(-4) || '---'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Execution */}
            <div className="flex-1 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Send className="h-5 w-5 text-indigo-600" />
                      Compose Message
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setMessage('')} className="text-xs text-red-500 hover:bg-red-50 rounded-xl px-3 h-8">
                        Clear Draft
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {PLACEHOLDERS.map(p => (
                        <Button
                          key={p.key}
                          variant="outline"
                          size="sm"
                          onClick={() => setMessage(prev => prev + p.key)}
                          className="text-[10px] font-bold h-7 rounded-lg border-slate-200 text-slate-600 bg-slate-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95"
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                    <textarea
                      className="w-full min-h-[220px] p-6 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300 resize-none font-medium leading-relaxed"
                      placeholder="Start typing your school alert here..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex flex-col justify-center gap-1">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Character Count</p>
                      <p className="text-2xl font-black text-indigo-700">{message.length}</p>
                    </div>
                    <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100/50 flex flex-col justify-center gap-1">
                      <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Est. SMS Parts</p>
                      <p className="text-2xl font-black text-violet-700">{smsMetrics.parts}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-center gap-1">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Projected Cost</p>
                      <p className="text-2xl font-black text-emerald-700">{smsMetrics.cost.toFixed(2)} ৳</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleSendSms}
                      disabled={isLoading || !message || selectedNumbers.length === 0}
                      className="rounded-2xl px-12 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 font-black text-lg group"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          TRANSMITTING...
                        </div>
                      ) : (
                        <>
                          DISPATCH SMS
                          <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm rounded-3xl h-[300px] flex flex-col">
                  <CardHeader className="py-4 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-400" />
                      ACTIVITY LOGS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {logs.length === 0 && <p className="text-[10px] text-center text-slate-300 py-10 italic">No activity recorded for this session</p>}
                        {logs.map((log, i) => (
                          <div key={i} className="flex gap-3 text-[10px] font-medium leading-normal animate-in slide-in-from-left-2 duration-300">
                            <span className="text-slate-300 shrink-0 font-mono">{log.time}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full",
                              log.type === 'success' ? "bg-emerald-50 text-emerald-600" :
                                log.type === 'error' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
                            )}>
                              {log.msg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 text-white relative overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-indigo-100 font-medium">1. Use <strong>Personalized Tags</strong> to increase student engagement and trust.</p>
                    <p className="text-sm text-indigo-100 font-medium">2. Keep messages under <strong>70 characters</strong> for Bengali/Unicode to stay within 1 SMS part.</p>
                    <p className="text-sm text-indigo-100 font-medium">3. Verify your <strong>Gateway Balance</strong> before executing large scale broadcasts.</p>
                    <div className="pt-4">
                      <Button variant="secondary" className="w-full rounded-xl bg-white/10 hover:bg-white/20 border-none text-white font-bold">
                        Read Documentation
                      </Button>
                    </div>
                  </CardContent>
                  {/* Background decoration */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </Card>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SmsService;