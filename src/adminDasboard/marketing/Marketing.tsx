import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Search, Plus, Edit2, Trash2, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { json2csv } from 'json-2-csv';

interface Lead {
  id: string;
  name: string;
  class: string;
  number: string;
  description: string;
  englishName: string;
  motherName: string;
  fatherName: string;
  photoUrl: string;
  status: 'Admitted' | 'Not Admitted' | 'Canceled';
  studentData?: {
    id: string;
    name: string;
    class: string;
    number: string;
    description: string;
    englishName: string;
    motherName: string;
    fatherName: string;
    photoUrl: string;
  } | null;
}

interface MarketingStats {
  totalLeads: number;
  statusBreakdown: {
    admitted: number;
    notAdmitted: number;
    canceled: number;
    admittedPercentage: string;
    notAdmittedPercentage: string;
    canceledPercentage: string;
  };
  numberAnalysis: {
    totalNumbers: number;
    uniqueNumbers: number;
    duplicateNumbers: number;
    matchingWithStudents: number;
  };
  classDistribution: { [key: string]: { total: number; admitted: number; notAdmitted: number; canceled: number } };
  dataQuality: {
    completeProfiles: number;
    incompleteProfiles: number;
    missingFields: {
      name: number;
      class: number;
      number: number;
      englishName: number;
      motherName: number;
      fatherName: number;
      photoUrl: number;
    };
  };
}

interface MarketingResponse {
  message: string;
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: MarketingStats;
}

interface ReportResponse {
  message: string;
  leads: Lead[];
  total: number;
}

const ITEMS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 5;
const CLASS_OPTIONS = ['নার্সারি', 'প্লে', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম'];

const Marketing: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    number: '',
    class: '',
    description: '',
    englishName: '',
    motherName: '',
    fatherName: '',
    photoUrl: '',
    status: 'Not Admitted',
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const isMobile = useIsMobile();

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const fetchLeads = useCallback(
    debounce(async (search: string, status: string, page: number, limit: number) => {
      try {
        setLoading(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) {
          throw new Error('Backend URL is not configured. Please check your .env file.');
        }

        const response = await axios.get<MarketingResponse>(
          `${backendUrl}/marketing-leads-analysis`,
          {
            params: { search, status: status === 'all' ? '' : status, page, limit },
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data || !Array.isArray(response.data.leads)) {
          throw new Error('Invalid response format from server');
        }

        setLeads(response.data.leads);
        setStats(response.data.stats || null);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch leads';
        console.error('Error fetching marketing leads:', {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          url: `${import.meta.env.VITE_BACKEND_URL}/marketing-leads-analysis`,
        });
        setError(errorMessage);
        setLeads([]);
        setStats(null);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Fetch data on mount, search, status, or page change
  useEffect(() => {
    fetchLeads(searchTerm, statusFilter, currentPage, ITEMS_PER_PAGE);
    return () => {
      fetchLeads.cancel();
    };
  }, [fetchLeads, searchTerm, statusFilter, currentPage]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLead((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.number) {
      setError('Name and Number are required');
      return;
    }

    // Validate phone number uniqueness
    const numbers = new Set(leads.map((lead) => lead.number));
    if (!editingLead && numbers.has(newLead.number)) {
      setError('Phone number already exists');
      return;
    }

    try {
      setLoading(true);
      if (editingLead) {
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/marketing-leads/${editingLead.id}`, newLead);
        toast.success('Lead updated successfully');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/marketing-leads`, newLead);
        toast.success('Lead added successfully');
      }
      setNewLead({
        name: '',
        number: '',
        class: '',
        description: '',
        englishName: '',
        motherName: '',
        fatherName: '',
        photoUrl: '',
        status: 'Not Admitted',
      });
      setIsModalOpen(false);
      setEditingLead(null);
      setError(null);
      setCurrentPage(1);
      fetchLeads(searchTerm, statusFilter, 1, ITEMS_PER_PAGE);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save lead';
      console.error('Error saving lead:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle lead deletion
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/marketing-leads/${id}`);
      toast.success('Lead deleted successfully');
      fetchLeads(searchTerm, statusFilter, currentPage, ITEMS_PER_PAGE);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete lead';
      console.error('Error deleting lead:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle lead edit
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      number: lead.number,
      class: lead.class,
      description: lead.description,
      englishName: lead.englishName,
      motherName: lead.motherName,
      fatherName: lead.fatherName,
      photoUrl: lead.photoUrl,
      status: lead.status,
    });
    setIsModalOpen(true);
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate PDF Report
const generateReport = async () => {
  try {
    const response = await axios.get<ReportResponse>(
      `${import.meta.env.VITE_BACKEND_URL}/marketing-leads-report`,
      {
        params: { search: searchTerm, status: statusFilter === 'all' ? '' : statusFilter },
      }
    );
    const reportLeads = response.data.leads;
    const exportDate = new Date().toLocaleDateString();

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      toast.error('Failed to open report window');
      return;
    }

    const reportContent = `
      <html>
        <head>
          <title>MySchool - Marketing Leads Report</title>
          <style>
            @media print {
              @page { margin: 2cm; }
              .status-admitted,
              .status-not-admitted,
              .status-canceled,
              th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #000;
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              color: #555;
              font-size: 14px;
              margin: 5px 0 0;
            }
            .stats {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              font-size: 14px;
              border: 1px solid #ddd;
            }
            .stats span {
              font-weight: 500;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background-color: #333;
              color: #fff;
              font-weight: 600;
              text-transform: uppercase;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f1f1f1;
            }
            img {
              max-width: 80px;
              height: auto;
              border-radius: 4px;
              display: block;
            }
            .status-admitted {
              color: #28a745 !important;
              font-weight: 500;
            }
            .status-not-admitted {
              color: #dc3545 !important;
              font-weight: 500;
            }
            .status-canceled {
              color: #fd7e14 !important;
              font-weight: 500;
            }
            .footer {
              margin-top: 25px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media (max-width: 768px) {
              table, th, td {
                font-size: 12px;
                padding: 8px;
              }
              img {
                max-width: 60px;
              }
              .stats {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySchool - Marketing Leads Report</h1>
              <p>Generated on: ${exportDate}</p>
            </div>
            <div class="stats">
              <span>Total Leads: ${stats?.totalLeads || 0}</span>
              <span>Admitted: ${stats?.statusBreakdown.admitted || 0} (${stats?.statusBreakdown.admittedPercentage || '0.00'}%)</span>
              <span>Not Admitted: ${stats?.statusBreakdown.notAdmitted || 0} (${stats?.statusBreakdown.notAdmittedPercentage || '0.00'}%)</span>
              <span>Canceled: ${stats?.statusBreakdown.canceled || 0} (${stats?.statusBreakdown.canceledPercentage || '0.00'}%)</span>
              <span>Unique Numbers: ${stats?.numberAnalysis.uniqueNumbers || 0}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Class</th>
                  <th>English Name</th>
                  <th>Mother Name</th>
                  <th>Father Name</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                ${reportLeads
                  .map(
                    (lead) => `
                  <tr>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.name || '-' : lead.name || '-'}</td>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.number || '-' : lead.number || '-'}</td>
                    <td class="status-${lead.status.toLowerCase().replace(' ', '-')}"">${lead.status}</td>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.class || '-' : lead.class || '-'}</td>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.englishName || '-' : lead.englishName || '-'}</td>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.motherName || '-' : lead.motherName || '-'}</td>
                    <td>${lead.status === 'Admitted' && lead.studentData ? lead.studentData.fatherName || '-' : lead.fatherName || '-'}</td>
                    <td>${
                      lead.status === 'Admitted' && lead.studentData?.photoUrl
                        ? `<img src="${lead.studentData.photoUrl}" alt="${lead.studentData.name || 'Lead'}" onerror="this.style.display='none';this.nextSibling.style.display='block'" /><span style="display:none">Image not available</span>`
                        : lead.photoUrl
                          ? `<img src="${lead.photoUrl}" alt="${lead.name || 'Lead'}" onerror="this.style.display='none';this.nextSibling.style.display='block'" /><span style="display:none">Image not available</span>`
                          : 'No photo'
                    }</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated by MySchool Official Website • https://myschool-offical.netlify.app
            </div>
          </div>
        </body>
      </html>
    `;

    reportWindow.document.write(reportContent);
    reportWindow.document.close();
    reportWindow.print();
  } catch (err: any) {
    const errorMessage = err.response?.data?.error || 'Failed to generate report';
    console.error('Error generating report:', {
      message: errorMessage,
      status: err.response?.status,
      data: err.response?.data,
    });
    toast.error(errorMessage);
  }
};


  // Generate CSV Report for all leads
  const generateCSV = async () => {
    try {
      const response = await axios.get<ReportResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/marketing-leads-report`,
        {
          params: { search: '' }, // Fetch all leads without status filter
        }
      );
      const reportLeads = response.data.leads;

      const csv = await json2csv(
        reportLeads.map((lead) => ({
          name: lead.name || '-',
          number: lead.number || '-',
          status: lead.status || '-',
          class: lead.class || '-',
          englishName: lead.englishName || '-',
          motherName: lead.motherName || '-',
          fatherName: lead.fatherName || '-',
          description: lead.description || '-',
          photoUrl: lead.photoUrl || '-',
        })),
        {
          keys: [
            { field: 'name', title: 'Name' },
            { field: 'number', title: 'Number' },
            { field: 'status', title: 'Status' },
            { field: 'class', title: 'Class' },
            { field: 'englishName', title: 'English Name' },
            { field: 'motherName', title: 'Mother Name' },
            { field: 'fatherName', title: 'Father Name' },
            { field: 'description', title: 'Description' },
            { field: 'photoUrl', title: 'Photo URL' },
          ],
        }
      );

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `marketing_leads_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to export CSV';
      console.error('Error exporting CSV:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(errorMessage);
    }
  };

  // Generate visible page numbers for pagination
  const getVisiblePages = useMemo(() => {
    const pages = [];
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start < MAX_VISIBLE_PAGES - 1) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Handle card click
  const handleCardClick = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Marketing Leads</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button onClick={generateReport} className="flex items-center gap-2" disabled={loading}>
            <Download className="w-4 h-4" />
            Generate PDF
          </Button>
          <Button onClick={generateCSV} className="flex items-center gap-2" disabled={loading}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingLead(null);
              setNewLead({
                name: '',
                number: '',
                class: '',
                description: '',
                englishName: '',
                motherName: '',
                fatherName: '',
                photoUrl: '',
                status: 'Not Admitted',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">All marketing leads</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'Admitted' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => handleCardClick('Admitted')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admitted</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.statusBreakdown.admitted || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.statusBreakdown.admittedPercentage || '0.00'}% conversion rate</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'Not Admitted' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => handleCardClick('Not Admitted')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Admitted</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.statusBreakdown.notAdmitted || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.statusBreakdown.notAdmittedPercentage || '0.00'}% of leads</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'Canceled' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => handleCardClick('Canceled')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.statusBreakdown.canceled || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.statusBreakdown.canceledPercentage || '0.00'}% of leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={searchTerm || ''}
            onChange={handleSearch}
            placeholder="Search by name, number, or class..."
            className="pl-10"
            disabled={loading}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isMobile ? 'w-[120px]' : 'w-[150px]'}>Name</TableHead>
              <TableHead className={isMobile ? 'w-[100px]' : 'w-[150px]'}>Number</TableHead>
              <TableHead className={isMobile ? 'w-[80px]' : 'w-[120px]'}>Status</TableHead>
              <TableHead className={isMobile ? 'w-[80px]' : 'w-[100px]'}>Class</TableHead>
              {!isMobile && <TableHead className="w-[100px]">Photo</TableHead>}
              {!isMobile && <TableHead className="w-[150px]">English Name</TableHead>}
              {!isMobile && <TableHead className="w-[150px]">Mother Name</TableHead>}
              {!isMobile && <TableHead className="w-[150px]">Father Name</TableHead>}
              <TableHead className={isMobile ? 'w-[80px]' : 'w-[100px]'}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 9} className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : leads.length > 0 ? (
              leads.map((lead, index) => (
                <TableRow key={`${lead.id}-${index}`}>
                  <TableCell className="truncate">
                    {lead.status === 'Admitted' && lead.studentData ? lead.studentData.name : lead.name || '-'}
                  </TableCell>
                  <TableCell className="truncate">
                    {lead.status === 'Admitted' && lead.studentData ? lead.studentData.number : lead.number || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${lead.status === 'Admitted'
                        ? 'bg-green-100 text-green-800'
                        : lead.status === 'Canceled'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell className="truncate">
                    {lead.status === 'Admitted' && lead.studentData ? lead.studentData.class : lead.class || '-'}
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      {(lead.status === 'Admitted' && lead.studentData?.photoUrl) || lead.photoUrl ? (
                        <img
                          src={lead.status === 'Admitted' && lead.studentData ? lead.studentData.photoUrl : lead.photoUrl}
                          alt={lead.status === 'Admitted' && lead.studentData ? lead.studentData.name : lead.name || 'Lead'}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onError={(e) => (e.currentTarget.src = '/fallback-image.jpg')}
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsLeadModalOpen(true);
                          }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell className="truncate">
                      {lead.status === 'Admitted' && lead.studentData ? lead.studentData.englishName : lead.englishName || '-'}
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell className="truncate">
                      {lead.status === 'Admitted' && lead.studentData ? lead.studentData.motherName : lead.motherName || '-'}
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell className="truncate">
                      {lead.status === 'Admitted' && lead.studentData ? lead.studentData.fatherName : lead.fatherName || '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditLead(lead)}
                        disabled={loading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLead(lead.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 9} className="text-center py-4">
                  No marketing leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {leads.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent className="flex flex-wrap gap-2">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => !loading && currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={`px-2 py-1 ${loading || currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                />
              </PaginationItem>
              {getVisiblePages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => !loading && handlePageChange(page)}
                    isActive={currentPage === page}
                    className={`w-10 h-10 flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => !loading && currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={`px-2 py-1 ${loading || currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Marketing Lead' : 'Add New Marketing Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={newLead.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Number</label>
                <Input
                  type="text"
                  name="number"
                  value={newLead.number || ''}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Class</label>
                <Select
                  value={newLead.class || 'none'}
                  onValueChange={(value) => setNewLead((prev) => ({ ...prev, class: value === 'none' ? '' : value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="none" value="none">
                      Select class
                    </SelectItem>
                    {CLASS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <Select
                  value={newLead.status || 'Not Admitted'}
                  onValueChange={(value) => setNewLead((prev) => ({ ...prev, status: value as Lead['status'] }))}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="not-admitted" value="Not Admitted">
                      Not Admitted
                    </SelectItem>
                    <SelectItem key="admitted" value="Admitted">
                      Admitted
                    </SelectItem>
                    <SelectItem key="canceled" value="Canceled">
                      Canceled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">English Name</label>
                <Input
                  type="text"
                  name="englishName"
                  value={newLead.englishName || ''}
                  onChange={handleInputChange}
                  placeholder="Enter English name"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Mother Name</label>
                <Input
                  type="text"
                  name="motherName"
                  value={newLead.motherName || ''}
                  onChange={handleInputChange}
                  placeholder="Enter mother name"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Father Name</label>
                <Input
                  type="text"
                  name="fatherName"
                  value={newLead.fatherName || ''}
                  onChange={handleInputChange}
                  placeholder="Enter father name"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Photo URL</label>
                <Input
                  type="text"
                  name="photoUrl"
                  value={newLead.photoUrl || ''}
                  onChange={handleInputChange}
                  placeholder="Enter photo URL"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <Input
                  type="text"
                  name="description"
                  value={newLead.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  className="mt-1"
                  disabled={loading}
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLead(null);
                  setNewLead({
                    name: '',
                    number: '',
                    class: '',
                    description: '',
                    englishName: '',
                    motherName: '',
                    fatherName: '',
                    photoUrl: '',
                    status: 'Not Admitted',
                  });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {editingLead ? 'Update Lead' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
       {/* Lead Details Modal */}
<Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Lead Details</DialogTitle>
    </DialogHeader>
    {selectedLead ? (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {(selectedLead.status === 'Admitted' && selectedLead.studentData?.photoUrl) || selectedLead.photoUrl ? (
            <img
              src={
                selectedLead.status === 'Admitted' && selectedLead.studentData
                  ? selectedLead.studentData.photoUrl
                  : selectedLead.photoUrl
              }
              alt={
                selectedLead.status === 'Admitted' && selectedLead.studentData
                  ? selectedLead.studentData.name
                  : selectedLead.name || 'Lead'
              }
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => (e.currentTarget.src = '/fallback-image.jpg')}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              No Photo
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.name
                : selectedLead.name || '-'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.number
                : selectedLead.number || '-'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Class</label>
            <p className="text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.class
                : selectedLead.class || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <p className="text-gray-800 font-semibold">
              {selectedLead.status || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">English Name</label>
            <p className="text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.englishName
                : selectedLead.englishName || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Mother Name</label>
            <p className="text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.motherName
                : selectedLead.motherName || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Father Name</label>
            <p className="text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.fatherName
                : selectedLead.fatherName || '-'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-800">
              {selectedLead.status === 'Admitted' && selectedLead.studentData
                ? selectedLead.studentData.description
                : selectedLead.description || '-'}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-gray-500">No lead data available.</p>
    )}
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsLeadModalOpen(false)} disabled={loading}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Marketing;