
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon, BookIcon, BriefcaseIcon } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Student specific fields
  const [studentClass, setStudentClass] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Staff specific fields
  const [nameBangla, setNameBangla] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [subject, setSubject] = useState('');
  const [designation, setDesignation] = useState('');
  const [nid, setNid] = useState('');
  const [mobile, setMobile] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Register the user with Firebase Authentication
      const user = await register(email, password, name, role);
      
      // Store additional user data in Firestore
      const userRef = doc(db, 'users', user.id);
      
      // Build the user data object based on role
      const userData = {
        email,
        name,
        role,
        createdAt: serverTimestamp(),
      };
      
      // Add role-specific fields
      if (role === 'student') {
        Object.assign(userData, {
          studentClass,
          englishName,
          motherName,
          fatherName,
          phoneNumber
        });
      } else if (role === 'staff') {
        Object.assign(userData, {
          nameBangla,
          nameEnglish,
          subject,
          designation,
          nid,
          mobile
        });
      }
      
      // Save to Firestore
      await setDoc(userRef, userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}! Your account has been created.`,
      });
      
      // Navigate based on user role
      if (role === 'student') {
        navigate('/student');
      } else if (role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "There was an error creating your account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-light to-white p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-school-primary">Create Your Account</CardTitle>
          <CardDescription>Join our school portal to access resources and stay connected</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a:</Label>
              <RadioGroup id="role" value={role} onValueChange={(value) => setRole(value as 'student' | 'staff')} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="flex items-center gap-1">
                    <BookIcon className="h-4 w-4" /> Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff" className="flex items-center gap-1">
                    <BriefcaseIcon className="h-4 w-4" /> Staff
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <MailIcon className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <LockIcon className="h-5 w-5" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <Input
                  id="name"
                  placeholder="Your full name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Role-specific fields */}
            <Tabs defaultValue={role} value={role} onValueChange={(value) => setRole(value as 'student' | 'staff')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student Details</TabsTrigger>
                <TabsTrigger value="staff">Staff Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="studentClass">Class</Label>
                    <Input
                      id="studentClass"
                      placeholder="Class/Grade"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="englishName">English Name</Label>
                    <Input
                      id="englishName"
                      placeholder="Name in English"
                      value={englishName}
                      onChange={(e) => setEnglishName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      placeholder="Mother's full name"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      placeholder="Father's full name"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="Contact number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="staff" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nameBangla">Name (Bangla)</Label>
                    <Input
                      id="nameBangla"
                      placeholder="Name in Bangla"
                      value={nameBangla}
                      onChange={(e) => setNameBangla(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nameEnglish">Name (English)</Label>
                    <Input
                      id="nameEnglish"
                      placeholder="Name in English"
                      value={nameEnglish}
                      onChange={(e) => setNameEnglish(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Subject you teach"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="Your position"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nid">NID</Label>
                    <Input
                      id="nid"
                      placeholder="National ID number"
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      placeholder="Mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-school-primary hover:underline">
                Log In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;
