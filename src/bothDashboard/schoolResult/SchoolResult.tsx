import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, getDoc
} from 'firebase/firestore';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import classesData from '@/lib/classes.json';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Search, Download, Filter, Trophy, GraduationCap,
  Edit2, Trash2, Printer, ChevronRight, Info,
  CheckCircle2, AlertCircle, LayoutGrid, List
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const CLASSES = (classesData as { name: string }[]).map(cls => cls.name);

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

interface ExamConfig {
  id: string;
  class: string;
  exam: string;
  subjects: string[];
}

const SchoolResult: React.FC = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>([]);
  const [availableExams, setAvailableExams] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch Exam Configs
  useEffect(() => {
    const fetchExamConfigs = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exam-configs'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamConfig));
        setExamConfigs(data);
      } catch (err) {
        console.error("Error fetching configs:", err);
      }
    };
    fetchExamConfigs();
  }, []);

  // Filter exams by class
  useEffect(() => {
    if (selectedClass) {
      const exams = examConfigs.filter(cfg => cfg.class === selectedClass).map(cfg => cfg.exam);
      setAvailableExams([...new Set(exams)]);
      setSelectedExam('');
    } else {
      setAvailableExams([]);
    }
  }, [selectedClass, examConfigs]);

  // Fetch Results
  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      let q = query(collection(db, 'exam-results'), orderBy('class'), orderBy('exam'));

      if (selectedClass) {
        q = query(collection(db, 'exam-results'), where('class', '==', selectedClass));
        if (selectedExam) {
          q = query(q, where('exam', '==', selectedExam));
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
  }, [selectedClass, selectedExam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const generateResultsPDF = useCallback((rows: ResultRow[]) => {
    const exportDate = new Date().toLocaleString();
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #1a365d;">MySchool Official</h1>
          <p style="margin: 5px 0; color: #666;">Comprehensive Result Sheet</p>
          <p style="font-size: 12px; color: #999;">Exported: ${exportDate}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead style="background-color: #f8fafc;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">ID</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Student Name</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Class</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Exam</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Rank</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${r.studentId}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${r.studentName}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${r.class}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${r.exam}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${r.total}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${r.rank}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    html2pdf().set({
      margin: 0.5,
      filename: `Results_${selectedClass || 'All'}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
    }).from(element).save();
  }, [selectedClass]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    try {
      await deleteDoc(doc(db, 'exam-results', id));
      toast({ title: 'Success', description: 'Result entry deleted.' });
      fetchResults();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">School Results</h1>
            <p className="text-gray-500 text-sm">Historical performance data and centralized merit ranking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="bg-white"
          >
            {viewMode === 'table' ? <LayoutGrid className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
          <Button
            onClick={() => generateResultsPDF(results)}
            className="bg-blue-600 shadow-md hover:shadow-lg transition-all"
            disabled={results.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Class Filter</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-white border-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-blue-500" />
                    <SelectValue placeholder="All Classes" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null_all">All Classes</SelectItem>
                  {CLASSES.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Exam Filter</label>
              <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedClass}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null_all">All Exams</SelectItem>
                  {availableExams.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" onClick={() => fetchResults()} className="w-full md:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {loadingResults ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <p className="text-gray-400 text-sm animate-pulse">Fetching academic data...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2">
                <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                  <Info className="h-10 w-10" />
                </div>
                <p className="text-gray-500 font-medium">No results found for selection</p>
                <p className="text-gray-400 text-xs text-center max-w-xs">
                  Try adjusting your filters or ensure results have been published in Exam Management.
                </p>
              </div>
            ) : viewMode === 'table' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-4">Student</TableHead>
                      <TableHead>Academic Info</TableHead>
                      <TableHead>Subjects & Marks</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Rank</TableHead>
                      {(user?.role === 'admin' || user?.role === 'staff') && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map(row => (
                      <TableRow key={row.id} className="group hover:bg-white transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                              {row.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-none">{row.studentName}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-1.5 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider">{row.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-700 border-blue-100 mb-1 block w-fit">
                            {row.class}
                          </Badge>
                          <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{row.exam}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                            {Object.entries(row.subjects || {}).map(([sub, mark]) => (
                              <div key={sub} className="flex flex-col border border-gray-100 rounded-lg overflow-hidden min-w-[60px]">
                                <span className="bg-gray-50 px-2 py-0.5 text-[8px] font-bold text-gray-400 uppercase text-center border-b border-gray-100">{sub}</span>
                                <span className="px-2 py-1 text-xs font-bold text-center bg-white text-gray-700">{mark}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-black text-gray-900">{row.total}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.rank && (
                            <div className="inline-flex flex-col items-center">
                              <Badge className={cn(
                                "text-[11px] font-black uppercase px-2.5 shadow-sm",
                                row.rank.toLowerCase().includes('1st') ? "bg-amber-400 hover:bg-amber-500" :
                                  row.rank.toLowerCase().includes('2nd') ? "bg-slate-400 hover:bg-slate-500" :
                                    row.rank.toLowerCase().includes('3rd') ? "bg-amber-700 hover:bg-amber-800" : "bg-blue-600"
                              )}>
                                {row.rank}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        {(user?.role === 'admin' || user?.role === 'staff') && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(row.id)}
                              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
              >
                {results.map(row => (
                  <Card key={row.id} className="group relative overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3">
                      <Badge className="bg-blue-600/10 text-blue-700 border-none px-3 font-black">{row.rank}</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg">
                          {row.studentName.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{row.studentName}</CardTitle>
                          <CardDescription className="font-mono text-[10px]">{row.studentId} • {row.class}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.exam}</p>
                        <div className="flex justify-between items-end">
                          <span className="text-gray-500 text-sm">Aggregate Marks</span>
                          <span className="text-3xl font-black text-gray-900">{row.total}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(row.subjects || {}).slice(0, 6).map(([sub, mark]) => (
                          <div key={sub} className="bg-white border border-gray-100 rounded-lg p-2 flex flex-col items-center">
                            <span className="text-[9px] text-gray-400 font-bold truncate w-full text-center">{sub}</span>
                            <span className="text-sm font-bold text-blue-600">{mark}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">Need a Physical Transcript?</h3>
            <p className="text-blue-100 max-w-lg">
              Students can download their official marksheets and certificates from the student portal using their registered credentials.
            </p>
          </div>
          <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 shadow-lg">
            Go to Portal
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
      </div>
    </div>
  );
};

export default SchoolResult;