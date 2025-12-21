import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, getDoc
} from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, Download, Trash2, Edit2,
  ChevronRight, ClipboardList, GraduationCap, Trophy,
  Save, X, CheckCircle2, ChevronDown, LayoutDashboard,
  FileText, UserPlus, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
// @ts-ignore
import classesData from '@/lib/classes.json';

const CLASSES = (classesData as any[]).map(cls => cls.name);

interface ExamConfig {
  id: string;
  class: string;
  exam: string;
  subjects: string[];
}

interface Student {
  id: string;
  studentId: string;
  name: string;
  class: string;
}

interface ResultRow {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  exam: string;
  subjects: Record<string, string>;
  total: string;
  rank: string;
}

const ExamManagement: React.FC = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('');
  const [examName, setExamName] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [configs, setConfigs] = useState<ExamConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState<{ [subject: string]: string }>({});
  const [rank, setRank] = useState('');
  const [total, setTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableExams, setAvailableExams] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [tab, setTab] = useState('exam');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultClass, setResultClass] = useState('');
  const [resultExam, setResultExam] = useState('');
  const [editingConfig, setEditingConfig] = useState<ExamConfig | null>(null);
  const [editingResult, setEditingResult] = useState<ResultRow | null>(null);
  const [isAddingNewExam, setIsAddingNewExam] = useState(false);

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'exam-configs'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamConfig));
      setConfigs(data);
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load configurations.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      try {
        const q = query(collection(db, 'students'), where('class', '==', selectedClass));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          studentId: doc.data().studentId,
          name: doc.data().name,
          class: doc.data().class
        } as Student));
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  // Fetch results
  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      let q = query(collection(db, 'exam-results'), orderBy('class'), orderBy('exam'));
      if (resultClass) {
        q = query(collection(db, 'exam-results'), where('class', '==', resultClass));
        if (resultExam) {
          q = query(q, where('exam', '==', resultExam));
        }
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResultRow));
      setResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  }, [resultClass, resultExam]);

  useEffect(() => {
    if (tab === 'results') {
      fetchResults();
    }
  }, [tab, fetchResults]);

  // Update total marks
  useEffect(() => {
    const sum = (availableSubjects.length > 0 ? availableSubjects : customSubjects)
      .reduce((acc, sub) => acc + (parseInt(marks[sub] || '0', 10) || 0), 0);
    setTotal(sum ? sum.toString() : '0');
  }, [marks, availableSubjects, customSubjects]);

  // Update available exams & subjects
  useEffect(() => {
    const exams = configs.filter(cfg => cfg.class === selectedClass).map(cfg => cfg.exam);
    setAvailableExams([...new Set(exams)]);
  }, [selectedClass, configs]);

  useEffect(() => {
    if (selectedClass && selectedExam) {
      const config = configs.find(cfg => cfg.class === selectedClass && cfg.exam === selectedExam);
      setAvailableSubjects(config ? config.subjects : []);
      if (!editingResult) {
        setCustomSubjects([]);
        setMarks({});
      }
    }
  }, [selectedClass, selectedExam, configs, editingResult]);

  const handleSaveConfig = async () => {
    if (!selectedClass || !examName || subjects.length === 0) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Class, exam, and subjects are required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { class: selectedClass, exam: examName, subjects };
      if (editingConfig) {
        await updateDoc(doc(db, 'exam-configs', editingConfig.id), payload);
        toast({ title: 'Success', description: 'Exam configuration updated!' });
      } else {
        await addDoc(collection(db, 'exam-configs'), payload);
        toast({ title: 'Success', description: 'Exam configuration saved!' });
      }
      setSubjects([]);
      setExamName('');
      setEditingConfig(null);
      fetchConfigs();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = (config: ExamConfig) => {
    setEditingConfig(config);
    setSelectedClass(config.class);
    setExamName(config.exam);
    setSubjects(config.subjects);
    setTab('exam');
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Delete this exam configuration?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'exam-configs', id));
      toast({ title: 'Deleted', description: 'Exam configuration deleted!' });
      fetchConfigs();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClass || !selectedExam) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Student, class, and exam are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const dynamicSubs = availableSubjects.length > 0 ? availableSubjects : customSubjects;
      const subjectsObj: Record<string, string> = {};
      dynamicSubs.forEach(sub => subjectsObj[sub] = marks[sub] || '');

      const payload = {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.name,
        class: selectedClass,
        exam: selectedExam,
        subjects: subjectsObj,
        total,
        rank
      };

      if (editingResult) {
        await updateDoc(doc(db, 'exam-results', editingResult.id), payload);
        toast({ title: 'Updated', description: 'Result updated successfully!' });
      } else {
        await addDoc(collection(db, 'exam-results'), payload);
        toast({ title: 'Published', description: 'Result published successfully!' });
      }
      setMarks({});
      setRank('');
      setSelectedStudent(null);
      setEditingResult(null);
      setTab('results');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save result.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResult = (result: ResultRow) => {
    setEditingResult(result);
    setSelectedClass(result.class);
    setSelectedExam(result.exam);
    setSelectedStudent({ id: '', studentId: result.studentId, name: result.studentName, class: result.class });
    setMarks(result.subjects);
    setRank(result.rank);
    setTotal(result.total);
    setTab('result');
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Delete this result?')) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'exam-results', id));
      toast({ title: 'Deleted', description: 'Result removed!' });
      fetchResults();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Exam Management
          </h1>
          <p className="text-gray-500 mt-1">Configure exams, manage subjects, and publish student results</p>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full bg-gray-100/80 p-1">
            <TabsTrigger value="exam" className="data-[state=active]:bg-white">Settings</TabsTrigger>
            <TabsTrigger value="result" className="data-[state=active]:bg-white">Publish</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-white">Archives</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'exam' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Exam Configuration Form */}
              <Card className="lg:col-span-1 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-500" />
                    {editingConfig ? 'Edit Configuration' : 'Create New Exam'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Name</label>
                    <div className="relative">
                      <Input
                        value={examName}
                        onChange={e => setExamName(e.target.value)}
                        placeholder="e.g. Final Term 2024"
                        className="pl-9"
                      />
                      <ClipboardList className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subjects</label>
                    <div className="flex gap-2">
                      <Input
                        value={subjectInput}
                        onChange={e => setSubjectInput(e.target.value)}
                        placeholder="Add subject"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                      />
                      <Button onClick={handleAddSubject} size="icon" className="shrink-0 bg-blue-600">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {subjects.map(sub => (
                        <Badge key={sub} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                          {sub}
                          <button onClick={() => handleRemoveSubject(sub)} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {subjects.length === 0 && <p className="text-xs text-gray-400 italic">No subjects added yet</p>}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button onClick={handleSaveConfig} className="flex-1 bg-blue-600" disabled={loading}>
                      {loading ? 'Processing...' : (editingConfig ? 'Update Config' : 'Save Configuration')}
                    </Button>
                    {editingConfig && (
                      <Button variant="outline" onClick={() => { setEditingConfig(null); setExamName(''); setSubjects([]); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Existing Configurations Table */}
              <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Existing Configurations</CardTitle>
                    <CardDescription>Active exam rules and mark distributions</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{configs.length} Total</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="w-[120px]">Class</TableHead>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-gray-500 italic">
                            No configurations found. Start by creating one.
                          </TableCell>
                        </TableRow>
                      ) : configs.map(cfg => (
                        <TableRow key={cfg.id} className="group hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-bold">{cfg.class}</TableCell>
                          <TableCell className="font-medium text-gray-900">{cfg.exam}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {cfg.subjects.map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{s}</span>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEditConfig(cfg)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(cfg.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'result' && (
            <Card className="border-none shadow-sm max-w-4xl mx-auto">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {editingResult ? 'Update Result Entry' : 'Manual Result Entry'}
                </CardTitle>
                <CardDescription>Enter marks for individual students based on configured exams</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmitResult} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Class</label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Student</label>
                      <Select onValueChange={(val) => {
                        const s = students.find(x => x.studentId === val);
                        if (s) setSelectedStudent(s);
                      }} disabled={!selectedClass} value={selectedStudent?.studentId}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={students.length > 0 ? "Choose Student" : "No students in class"} />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(s => <SelectItem key={s.id} value={s.studentId}>{s.name} ({s.studentId})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Exam</label>
                      <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedStudent}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExams.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedExam && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 pt-4 border-t border-gray-100"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {(availableSubjects.length > 0 ? availableSubjects : customSubjects).map(subject => (
                          <div key={subject} className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">{subject}</label>
                            <Input
                              type="number"
                              placeholder="Score"
                              value={marks[subject] || ''}
                              onChange={e => {
                                const val = e.target.value;
                                if (/^\d{0,3}$/.test(val) && (parseInt(val) <= 100 || val === '')) {
                                  setMarks(prev => ({ ...prev, [subject]: val }));
                                }
                              }}
                              className="bg-white font-mono text-center"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-md border border-gray-200">
                          <span className="text-sm font-medium text-gray-500">Aggregate Total</span>
                          <span className="text-xl font-bold text-gray-900">{total}</span>
                        </div>
                        <div className="relative">
                          <Input
                            placeholder="Merit Rank (e.g. 1st, 2nd)"
                            value={rank}
                            onChange={e => setRank(e.target.value)}
                            className="bg-white"
                          />
                          <Trophy className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => { setEditingResult(null); setMarks({}); setRank(''); setSelectedStudent(null); }}
                        >
                          Reset Form
                        </Button>
                        <Button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                          disabled={isSubmitting}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Publishing...' : (editingResult ? 'Update Result' : 'Publish Result')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {tab === 'results' && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Result Archives</CardTitle>
                  <CardDescription>Browse historical exam results and export PDF reports</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={resultClass} onValueChange={setResultClass}>
                    <SelectTrigger className="w-[140px] bg-white text-xs h-9">
                      <Filter className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {CLASSES.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={resultExam} onValueChange={setResultExam} disabled={!resultClass}>
                    <SelectTrigger className="w-[160px] bg-white text-xs h-9">
                      <SelectValue placeholder="All Exams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Exams</SelectItem>
                      {availableExams.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={() => fetchResults()} className="h-9">
                    <Search className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class/Exam</TableHead>
                      <TableHead>Marks Visualization</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingResults ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-gray-400">Loading result data...</TableCell>
                      </TableRow>
                    ) : results.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-gray-500 italic">No results found for selected filters</TableCell>
                      </TableRow>
                    ) : results.map(row => (
                      <TableRow key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                              {row.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-none">{row.studentName}</p>
                              <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">{row.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-bold text-blue-600 uppercase">{row.class}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{row.exam}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {Object.entries(row.subjects).map(([sub, mark]) => (
                              <Badge key={sub} variant="outline" className="text-[9px] px-1.5 py-0 border-gray-200">
                                {sub}: <span className="text-blue-600 font-bold ml-1">{mark}</span>
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex flex-col">
                            <span className="text-sm font-black text-gray-900">{row.total}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.rank && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-black uppercase">{row.rank}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEditResult(row)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteResult(row.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ExamManagement;