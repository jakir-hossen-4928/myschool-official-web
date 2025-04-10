
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FundTracker = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Fund Tracker</h2>
      <Card>
        <CardHeader>
          <CardTitle>Financial Management</CardTitle>
          <CardDescription>Manage school finances and track expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Fund Tracker dashboard content will be implemented here...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundTracker;
