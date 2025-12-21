import React, { useEffect, useState, useRef, useCallback } from 'react';
import AdmitCard from '@/components/pdf/AdmitCard';
import IDCard from '@/components/pdf/IDCard';
import ResultCard from '@/components/pdf/ResultCard';
import SeatPlan from '@/components/pdf/SeatPlan';
import html2pdf from 'html2pdf.js';
import classesList from '@/lib/classes.json';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAbsoluteUrl, cn } from '@/lib/utils';
import {
  FileText, CreditCard, UserCheck, MapPin,
  Download, Printer, Filter, Users,
  ChevronRight, LayoutDashboard, Settings2,
  CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';

const SCHOOL_NAME = 'MySchool Official';
const SCHOOL_LOGO = '/public/my-school-logo.jpg';

const PDF_TYPES = [
  { value: 'result', label: 'Result Card', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  { value: 'admit', label: 'Admit Card', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 'seat', label: 'Exam Seat Plan', icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-50' },
  { value: 'id', label: 'ID Card', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const PDFGenerator = () => {
  const [pdfType, setPdfType] = useState('result');
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [exam, setExam] = useState('');
  const [exams, setExams] = useState<string[]>([]);
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const pdfRef = useRef<HTMLDivElement>(null);

  // Fetch Students by Class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!className) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'students'), where('class', '==', className));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(data);
        setSelectedStudents([]);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [className]);

  // Fetch Exam Configs by Class
  useEffect(() => {
    const fetchConfigs = async () => {
      if (!className) return;
      try {
        const q = query(collection(db, 'exam-configs'), where('class', '==', className));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data().exam);
        setExams([...new Set(data)] as string[]);
      } catch (err) {
        console.error("Error fetching configs:", err);
      }
    };
    fetchConfigs();
  }, [className]);

  // Fetch results for selected students if PDF type is result
  useEffect(() => {
    const fetchBulkResults = async () => {
      if (pdfType === 'result' && selectedStudents.length > 0 && exam) {
        setLoading(true);
        try {
          const resMap: Record<string, any> = {};
          await Promise.all(selectedStudents.map(async (sid) => {
            const student = students.find(s => s.id === sid);
            if (!student) return;
            // Fetch by studentId (Roll/Code) from results
            const q = query(
              collection(db, 'exam-results'),
              where('studentId', '==', student.studentId),
              where('exam', '==', exam),
              where('class', '==', student.class)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              resMap[sid] = snapshot.docs[0].data();
            }
          }));
          setResults(resMap);
        } catch (err) {
          console.error("Error fetching bulk results:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBulkResults();
  }, [pdfType, selectedStudents, exam, students]);

  const handleStudentSelect = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const preloadImages = async (urls: string[]) => {
    const promises = urls.filter(Boolean).map(url =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = getAbsoluteUrl(url);
      })
    );
    await Promise.all(promises);
  };

  const handleGeneratePDF = async () => {
    if (!pdfRef.current) return;
    const selectedStudentObjs = students.filter(s => selectedStudents.includes(s.id));
    const imageUrls = [SCHOOL_LOGO, ...selectedStudentObjs.map(s => s.photoUrl).filter(Boolean)];

    setLoading(true);
    await preloadImages(imageUrls);

    pdfRef.current.classList.add('pdf-mode');

    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `${pdfType}-cards-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#fff', useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(pdfRef.current).save().finally(() => {
      pdfRef.current?.classList.remove('pdf-mode');
      setLoading(false);
    });
  };

  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const selectedStudentObjs = students.filter(s => selectedStudents.includes(s.id));
  const seatPlanStudents = selectedStudentObjs.map((s, i) => ({ ...s, seat: (i + 1).toString() }));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Printer className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Academic Documents</h1>
            <p className="text-gray-500 text-sm">Generate official printables and student credentials</p>
          </div>
        </div>
        <Button
          onClick={handleGeneratePDF}
          disabled={selectedStudents.length === 0 || loading}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Processing...
            </div>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF ({selectedStudents.length})
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-indigo-500" />
                Print Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-gray-400">Document Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PDF_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setPdfType(t.value)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                        pdfType === t.value
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      )}
                    >
                      <t.icon className={cn("h-6 w-6", pdfType === t.value ? "text-indigo-600" : "text-gray-400")} />
                      <span className={cn("text-[10px] font-bold uppercase", pdfType === t.value ? "text-indigo-900" : "text-gray-500")}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Academic Class</Label>
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map(cls => <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {(pdfType === 'result' || pdfType === 'admit' || pdfType === 'seat') && (
                  <div className="space-y-2">
                    <Label>Target Examination</Label>
                    <Select value={exam} onValueChange={setExam} disabled={!className}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.length > 0 ? exams.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>) : <SelectItem value="none" disabled>No exams found</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {pdfType === 'seat' && (
                  <div className="space-y-2">
                    <Label>Examination Hall / Room</Label>
                    <Input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. Room 302"
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-gray-400">Target Students</Label>
                  {students.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSelectedStudents(students.map(s => s.id))}
                      className="text-[10px] h-auto p-0 text-indigo-600"
                    >
                      Select All
                    </Button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                  {loading && <p className="text-center text-xs text-gray-400 py-4">Loading student directory...</p>}
                  {!loading && students.length === 0 && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[10px] text-gray-400">Select a class to list students</p>
                    </div>
                  )}
                  {students.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleStudentSelect(s.id)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
                        selectedStudents.includes(s.id) ? "bg-indigo-50 border-indigo-100" : "hover:bg-gray-50 border-transparent"
                      )}
                    >
                      <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => handleStudentSelect(s.id)} />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                        <p className="text-[9px] text-gray-400 font-mono">{s.studentId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-700 border-none px-3">Live Preview</Badge>
              <span className="text-[10px] text-gray-400">Scale: A4 (Portrait)</span>
            </div>
            <p className="text-[10px] text-gray-500 italic">Formatting for 210mm x 297mm print area</p>
          </div>

          <div className="preview-container bg-gray-200/50 rounded-2xl p-8 overflow-auto flex justify-center shadow-inner h-[800px] border-4 border-white">
            <div
              className="a4-sheet bg-white shadow-2xl origin-top"
              style={{
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
                padding: '0',
                position: 'relative',
              }}
              ref={pdfRef}
            >
              <style>{`
                .a4-sheet {
                  background: #fff !important;
                }
                .pdf-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  grid-template-rows: repeat(3, 1fr);
                  width: 100%;
                  height: 297mm;
                  page-break-after: always;
                }
                .pdf-item-container {
                  border: 1px dashed #eee;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 10px;
                  box-sizing: border-box;
                }
                .pdf-result-card-container {
                  width: 100%;
                  padding: 20mm 15mm;
                  box-sizing: border-box;
                  page-break-after: always;
                }
                @media print {
                  .pdf-grid { border: none; }
                  .pdf-item-container { border: none !important; }
                }
              `}</style>

              {selectedStudentObjs.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-gray-300 opacity-50 h-[297mm]">
                  <Printer className="h-20 w-20 mb-4" />
                  <p className="text-xl font-bold uppercase tracking-widest">Document Workspace</p>
                  <p className="text-sm">Select students to generate live preview</p>
                </div>
              )}

              {/* PDF Preview Content */}
              {pdfType === 'result' && selectedStudentObjs.map((student) => (
                <div key={student.id} className="pdf-result-card-container">
                  <ResultCard
                    student={student}
                    result={results[student.id] ? {
                      exam: results[student.id].exam,
                      subjects: Object.entries(results[student.id].subjects || {}).map(([subject, mark]) => ({ subject, mark: String(mark) })),
                      total: results[student.id].total,
                      rank: results[student.id].rank,
                    } : { exam, subjects: [], total: '', rank: '' }}
                    schoolName={SCHOOL_NAME}
                    schoolLogoUrl={SCHOOL_LOGO}
                  />
                </div>
              ))}

              {(pdfType === 'admit' || pdfType === 'seat' || pdfType === 'id') && chunkArray(selectedStudentObjs, 6).map((chunk, pageIdx) => (
                <div key={pageIdx} className="pdf-grid">
                  {chunk.map((student, i) => (
                    <div key={student.id} className="pdf-item-container">
                      {pdfType === 'admit' && (
                        <AdmitCard
                          students={[student]}
                          exam={exam}
                          schoolName={SCHOOL_NAME}
                          schoolLogoUrl={SCHOOL_LOGO}
                        />
                      )}
                      {pdfType === 'seat' && (
                        <SeatPlan
                          students={[student]}
                          exam={exam}
                          room={room}
                          schoolName={SCHOOL_NAME}
                          schoolLogoUrl={SCHOOL_LOGO}
                        />
                      )}
                      {pdfType === 'id' && (
                        <IDCard
                          students={[student]}
                          schoolName={SCHOOL_NAME}
                          schoolLogoUrl={SCHOOL_LOGO}
                        />
                      )}
                    </div>
                  ))}
                  {/* Fill empty cells to maintain grid */}
                  {[...Array(6 - chunk.length)].map((_, i) => (
                    <div key={`empty-${i}`} className="pdf-item-container"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;