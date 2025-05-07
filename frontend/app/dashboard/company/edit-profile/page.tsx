"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo, CompanyProfile } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const initialFormState: Partial<CompanyProfile> = {
  name: "",
  industry: "",
  location: "",
  description: "",
  website: "",
  contactEmail: ""
};

export default function EditCompanyProfile() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>(initialFormState);

  // Fetch company profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Error",
            description: "Please login to continue",
            variant: "destructive"
          });
          router.push('/login');
          return;
        }
        const profile = await getCompanyProfile(token);
        const { logo: profileLogo, ...restProfile } = profile;
        setFormData({
          ...initialFormState,
          ...restProfile
        });
        if (profileLogo) {
          setLogo(profileLogo);
          setFormData(prev => ({ ...prev, logo: profileLogo }));
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      }
    };
    fetchProfile();
  }, [router, toast]);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/dashboard/company");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }
      await updateCompanyProfile(formData, token);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      router.push("/dashboard/company");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }

      const logoUrl = await uploadCompanyLogo(file, token);
      setLogo(logoUrl);
      setFormData(prev => ({ ...prev, logo: logoUrl }));
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Company Profile</h1>
            <p className="text-gray-700 dark:text-gray-400">Update your company information and preferences</p>
          </div>

          {/* Profile Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Company Logo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Logo
                </label>
                <div 
                  className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden group hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={triggerFileInput}
                >
                  {logo ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={logo}
                        alt="Company Logo"
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-gray-500 dark:text-gray-400">Click to</span>
                      <span className="text-gray-500 dark:text-gray-400">upload logo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name
                </label>
                <Input
                  name="name"
                  type="text"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Industry
                </label>
                <Input
                  name="industry"
                  type="text"
                  value={formData.industry || ""}
                  onChange={handleInputChange}
                  placeholder="Enter industry"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <Input
                  name="location"
                  type="text"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
              </div>

              {/* Company Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  placeholder="Tell us about your company..."
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[120px]"
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Write a brief description of your company, its mission, and what makes it unique.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 