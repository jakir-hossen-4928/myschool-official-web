
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, FileUploadIcon, User, UserCheck, School, Phone, Mail, FileText } from 'lucide-react';

const StudentDataCollection = () => {
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, you would submit this data to your API
      const studentData = {
        name,
        englishName,
        class: studentClass,
        number: phoneNumber,
        motherName,
        fatherName,
        description,
        email,
        photoUrl
      };
      
      console.log('Submitting student data:', studentData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Data submitted successfully",
        description: "Thank you for submitting your information.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting student data:', error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-school-primary">Student Information Form</CardTitle>
          <CardDescription>Please provide your information accurately</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Name (Bengali)
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name in Bengali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="englishName" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Name (English)
                </Label>
                <Input
                  id="englishName"
                  placeholder="Enter your name in English"
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="studentClass" className="flex items-center gap-2">
                  <School className="h-4 w-4" /> Class
                </Label>
                <Input
                  id="studentClass"
                  placeholder="Enter your class/grade"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="motherName" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Mother's Name
                </Label>
                <Input
                  id="motherName"
                  placeholder="Enter your mother's name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fatherName" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Father's Name
                </Label>
                <Input
                  id="fatherName"
                  placeholder="Enter your father's name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photoUrl" className="flex items-center gap-2">
                  <FileUploadIcon className="h-4 w-4" /> Photo URL
                </Label>
                <Input
                  id="photoUrl"
                  placeholder="Enter photo URL (if available)"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Additional Information
              </Label>
              <Textarea
                id="description"
                placeholder="Any additional information you'd like to provide"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-school-primary hover:bg-school-dark" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Information"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              By submitting this form, you agree to the school's data privacy policy.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default StudentDataCollection;
