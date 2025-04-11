import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookIcon, BriefcaseIcon, UploadIcon, UserIcon, LockIcon, MailIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

const CLASS_OPTIONS = ["নার্সারি", "প্লে", "প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ"];

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Student fields
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  // Staff fields
  const [staffId, setStaffId] = useState('');
  const [nid, setNid] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const IMAGE_HOST_KEY = import.meta.env.VITE_IMGBB_API_KEY;
    if (!IMAGE_HOST_KEY) throw new Error('ImgBB API key not configured');

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGE_HOST_KEY}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Error uploading image to ImgBB');
      const data = await response.json();
      return data.data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImageToImgBB(file);
      setPhotoUrl(url);
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Image upload failed" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast({ variant: "destructive", title: "Please select your role" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }

    setIsLoading(true);
    try {
      const additionalData = role === 'student' ? {
        studentId, class: className, fatherName, motherName, photoUrl
      } : {
        staffId, nid, designation, joiningDate: new Date(joiningDate), photoUrl
      };

      await register(email, password, name, role, additionalData);
      toast({ title: "Registration successful!" });
      navigate(role === 'student' ? '/student' : '/staff');
    } catch (error) {
      toast({ variant: "destructive", title: "Registration failed" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-light to-white p-4">
        <div className="max-w-md w-full space-y-4">
          <h2 className="text-3xl font-bold text-center text-school-primary">Join Our School</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setRole('student')}
              className="p-8 border-2 rounded-xl hover:border-school-primary transition-all flex flex-col items-center"
            >
              <BookIcon className="h-12 w-12 mb-4 text-school-primary" />
              <h3 className="text-xl font-semibold">Student</h3>
              <p className="text-muted-foreground">Create student account</p>
            </button>
            <button
              onClick={() => setRole('staff')}
              className="p-8 border-2 rounded-xl hover:border-school-primary transition-all flex flex-col items-center"
            >
              <BriefcaseIcon className="h-12 w-12 mb-4 text-school-primary" />
              <h3 className="text-xl font-semibold">Staff</h3>
              <p className="text-muted-foreground">Create staff account</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-light to-white p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-school-primary">
            {role === 'student' ? 'Student Registration' : 'Staff Registration'}
          </CardTitle>
          <CardDescription>
            <button onClick={() => setRole(null)} className="text-school-primary hover:underline">
              ← Change role
            </button>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="name"><UserIcon className="inline h-4 w-4" /> Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email"><MailIcon className="inline h-4 w-4" /> Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password"><LockIcon className="inline h-4 w-4" /> Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword"><LockIcon className="inline h-4 w-4" /> Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label><UploadIcon className="inline h-4 w-4" /> Profile Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
              {photoUrl && <img src={photoUrl} alt="Preview" className="mt-2 h-20 w-20 rounded-full object-cover" />}
            </div>

            {/* Role-specific Fields */}
            {role === 'student' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select Class</option>
                      {CLASS_OPTIONS.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Father's Name</Label>
                    <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother's Name</Label>
                    <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Staff ID</Label>
                    <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>NID Number</Label>
                    <Input value={nid} onChange={(e) => setNid(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Date</Label>
                    <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-school-primary hover:underline">
                Log in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;