
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SmsService = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">SMS Service</h2>
      <Card>
        <CardHeader>
          <CardTitle>Messaging Service</CardTitle>
          <CardDescription>Send SMS notifications to students, parents, and staff</CardDescription>
        </CardHeader>
        <CardContent>
          <p>SMS Service dashboard content will be implemented here...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmsService;
