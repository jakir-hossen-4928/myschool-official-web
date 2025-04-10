
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ContentGanarator = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Content Generator</h2>
      <Card>
        <CardHeader>
          <CardTitle>Educational Content</CardTitle>
          <CardDescription>Generate educational content and materials</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content Generator features will be implemented here...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGanarator;
