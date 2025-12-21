import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
    DollarSign, TrendingUp, Users, AlertCircle, Calendar,
    ArrowUpRight, ArrowDownRight, Filter, Download, PieChart as PieChartIcon
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinanceAnalytics: React.FC = () => {
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('6months');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const snapshot = await getDocs(collection(db, 'fee-collections'));
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCollections(data);
            } catch (error) {
                console.error("Error fetching collections:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        let totalRevenue = 0;
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        const methodCounts: Record<string, number> = {};

        collections.forEach(c => {
            const amount = c.amountPaid || 0;
            totalRevenue += amount;

            const date = parseISO(c.date);
            if (isWithinInterval(date, { start: thisMonthStart, end: thisMonthEnd })) {
                thisMonthRevenue += amount;
            } else if (isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd })) {
                lastMonthRevenue += amount;
            }

            const method = c.paymentMethod || 'Unknown';
            methodCounts[method] = (methodCounts[method] || 0) + amount;
        });

        const monthDiff = lastMonthRevenue === 0 ? 100 : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        return {
            totalRevenue,
            thisMonthRevenue,
            lastMonthRevenue,
            monthDiff,
            methodData: Object.entries(methodCounts).map(([name, value]) => ({ name, value }))
        };
    }, [collections]);

    const chartData = useMemo(() => {
        const months = [];
        const monthsToFetch = timeRange === '12months' ? 12 : 6;

        for (let i = monthsToFetch - 1; i >= 0; i--) {
            const d = subMonths(new Date(), i);
            months.push({
                month: format(d, 'MMM yy'),
                start: startOfMonth(d),
                end: endOfMonth(d),
                total: 0
            });
        }

        collections.forEach(c => {
            const date = parseISO(c.date);
            const amount = c.amountPaid || 0;
            const monthObj = months.find(m => isWithinInterval(date, { start: m.start, end: m.end }));
            if (monthObj) monthObj.total += amount;
        });

        return months;
    }, [collections, timeRange]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finance Analytics</h1>
                    <p className="text-gray-500">Real-time insights into school revenue and fee collections</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px] bg-white border-gray-200">
                            <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6months">Last 6 Months</SelectItem>
                            <SelectItem value="12months">Last 12 Months</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="bg-white border-gray-200">
                        <Download className="mr-2 h-4 w-4 text-gray-500" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <DollarSign className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                            <h3 className="text-3xl font-bold mt-1">৳{stats.totalRevenue.toLocaleString()}</h3>
                            <p className="text-blue-200 text-xs mt-2 flex items-center">
                                All time collection
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className={cn(
                                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                                stats.monthDiff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {stats.monthDiff >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                                {Math.abs(stats.monthDiff).toFixed(1)}%
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-medium">Current Month</p>
                            <h3 className="text-3xl font-bold mt-1 text-gray-900">৳{stats.thisMonthRevenue.toLocaleString()}</h3>
                            <p className="text-gray-400 text-xs mt-2 italic">
                                vs ৳{stats.lastMonthRevenue.toLocaleString()} last month
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-medium">Unique Payers</p>
                            <h3 className="text-3xl font-bold mt-1 text-gray-900">
                                {new Set(collections.map(c => c.studentId)).size}
                            </h3>
                            <p className="text-gray-400 text-xs mt-2">
                                Students with payments
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-medium">Recent Transactions</p>
                            <h3 className="text-3xl font-bold mt-1 text-gray-900">
                                {collections.filter(c => parseISO(c.date) > subMonths(new Date(), 1)).length}
                            </h3>
                            <p className="text-gray-400 text-xs mt-2">
                                Last 30 days activity
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Line Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">Collection Trend</CardTitle>
                                <CardDescription>Visual trend of fee collection over time</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(value) => `৳${value / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => [`৳${value.toLocaleString()}`, "Collection"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods Pie Chart */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-lg">Payment Methods</CardTitle>
                        <CardDescription>Revenue distribution by source</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.methodData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.methodData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => `৳${value.toLocaleString()}`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {stats.methodData.slice(0, 3).map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">{((item.value / stats.totalRevenue) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown by Category Section (Future extension) */}
            <Card className="border-none shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-blue-500" />
                        <CardTitle className="text-lg">Detailed Collection Log</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Student ID</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Transaction Date</th>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {collections.slice(0, 10).sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{c.studentId}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                                c.paymentMethod === 'Cash' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {c.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{format(parseISO(c.date), 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 text-gray-500 italic">{c.month}/{c.year}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">৳{c.amountPaid.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {collections.length > 10 && (
                        <div className="p-4 text-center border-t border-gray-100">
                            <Button variant="ghost" className="text-blue-600 text-sm hover:bg-blue-50">
                                View All Transactions
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FinanceAnalytics;
