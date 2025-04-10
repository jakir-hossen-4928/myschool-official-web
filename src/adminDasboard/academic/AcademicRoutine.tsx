
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AcademicRoutine = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Academic Routine</h2>
      <Card>
        <CardHeader>
          <CardTitle>Academic Schedule</CardTitle>
          <CardDescription>Manage class schedules and academic routines</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Academic Routine dashboard content will be implemented here...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicRoutine;
