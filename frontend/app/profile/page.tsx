"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Building2, GraduationCap, Calendar, FileText, Edit2, Trash2, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@/lib/api";
import { title } from "process";

interface ProfileData {
  name: string;
  email: string;
  title: string;
  profileImage: string | null;
  skills: string[];
  phone?: string;
  location?: string;
}

interface ExperienceEntry {
  id: number;
  position: string;
  company: string;
  period: string;
  description: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | undefined>();
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [educationEntries, setEducationEntries] = useState<any[]>([]);
  const [newEducation, setNewEducation] = useState({ institution: "", degree: "", years: "" });
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [newExperience, setNewExperience] = useState<Omit<ExperienceEntry, 'id'>>({
    position: "",
    company: "",
    period: "",
    description: [""]
  });

  useEffect(() => {
    // Fetch profile from backend
    setIsLoading(true)
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return;
    const parsedUser = JSON.parse(user);
    const role = parsedUser.opportunities !== undefined ? 'company' : 'student';
    getProfile(role, token)
      .then((data) => {
       setProfileData(data)
        setEducationEntries(data?.education || []);
        setExperienceEntries(data?.experience || []);
        setIsLoading(false);
      })
      .catch(() => {});
  }, []);


  const handleEditClick = async () => {
    if (isEditing) {
      // Save profile to backend
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (!token || !user) return;
      const parsedUser = JSON.parse(user);
      const role = parsedUser.opportunities !== undefined ? 'company' : 'student';
      try {
        await updateProfile(role, {
          ...profileData,
          profileImage: profileData?.profileImage,
          name: profileData?.name,
          email: profileData?.email,
          title: profileData?.title,
          phone: profileData?.phone,
          location: profileData?.location,
          skills: profileData?.skills,
          education: educationEntries,
          experience: experienceEntries,
        }, token);
        setIsEditing(false);
      } catch (err) {
        alert('Failed to update profile');
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
      setProfileData({ ...profileData!, name: e.target.value });
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData!, title: e.target.value });
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData!, email: e.target.value });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData!, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData?.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData!,
        skills: [...profileData!.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileData({
      ...profileData!,
      skills: profileData!.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleAddEducation = () => {
    if (newEducation.institution && newEducation.degree && newEducation.years) {
      setEducationEntries([...educationEntries, { id: Date.now(), ...newEducation }]);
      setNewEducation({ institution: "", degree: "", years: "" }); // Reset input fields
    }
  };

  const handleDeleteEducation = (id: number) => {
    setEducationEntries(educationEntries.filter(entry => entry.id !== id));
  };

  const handleAddExperience = () => {
    if (newExperience.position && newExperience.company && newExperience.period) {
      setExperienceEntries([...experienceEntries, { id: Date.now(), ...newExperience }]);
      setNewExperience({
        position: "",
        company: "",
        period: "",
        description: [""]
      });
    }
  };


  const handleDeleteExperience = (id: number) => {
    setExperienceEntries(experienceEntries.filter(entry => entry.id !== id));
  };

  const handleAddDescription = (index: number) => {
    const updatedDescription = [...newExperience.description];
    updatedDescription.splice(index + 1, 0, "");
    setNewExperience({ ...newExperience, description: updatedDescription });
  };

  const handleRemoveDescription = (index: number) => {
    const updatedDescription = [...newExperience.description];
    updatedDescription.splice(index, 1);
    setNewExperience({ ...newExperience, description: updatedDescription });
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updatedDescription = [...newExperience.description];
    updatedDescription[index] = value;
    setNewExperience({ ...newExperience, description: updatedDescription });
  };

  const handleBack = () => {
    router.back();
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData!, phone: e.target.value });
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData!, location: e.target.value });
  };

  if(isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          {/* Back Button Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>

          {/* Profile Header Skeleton */}
          <div className="relative mb-8">
            {/* Cover Image Skeleton */}
            <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            
            {/* Profile Info Skeleton */}
            <div className="absolute -bottom-16 left-8 flex items-end gap-6">
              <div className="w-32 h-32 rounded-xl bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 animate-pulse"></div>
              <div className="mb-4 space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Edit Profile Button Skeleton */}
            <div className="absolute top-4 right-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-32 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column Skeleton */}
            <div className="space-y-6">
              {/* Contact Information Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Education Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Cover Image */}
          <div className="h-48 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400"></div>
          
          {/* Profile Info */}
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 overflow-hidden relative">
              {profileData?.profileImage ? (
                <Image
                  src={profileData?.profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-300 dark:text-gray-600">
                  {profileData?.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                >
                  Upload Photo
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="mb-4">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={profileData?.name}
                    onChange={handleNameChange}
                    className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={profileData?.title}
                    onChange={handleTitleChange}
                    className="text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profileData?.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{profileData?.title}</p>
                </>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <button 
            onClick={handleEditClick}
            className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </div>

        {/* Profile Content */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Mail className="w-5 h-5" />
                      <input type="email" value={profileData?.email} onChange={handleEmailChange} className="border rounded p-1" />
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone className="w-5 h-5" />
                      <input type="tel" value={profileData?.phone || ""} onChange={handlePhoneChange} className="border rounded p-1" />
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-5 h-5" />
                      <input type="text" value={profileData?.location || ""} onChange={handleLocationChange} className="border rounded p-1" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Mail className="w-5 h-5" />
                      <span>{profileData?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone className="w-5 h-5" />
                      <span>{profileData?.phone || ""}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-5 h-5" />
                      <span>{profileData?.location || ""}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Education</h2>
              <div className="space-y-4">
                {educationEntries.map((entry) => (
                  <div key={entry.id} className="flex gap-4 items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{entry.institution}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.degree}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{entry.years}</p>
                    </div>
                    {isEditing && (
                      <button onClick={() => handleDeleteEducation(entry.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex flex-col mt-4">
                    <input
                      type="text"
                      placeholder="Institution"
                      value={newEducation.institution}
                      onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                      className="border rounded p-1 mb-2"
                    />
                    <input
                      type="text"
                      placeholder="Degree"
                      value={newEducation.degree}
                      onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                      className="border rounded p-1 mb-2"
                    />
                    <input
                      type="text"
                      placeholder="Years"
                      value={newEducation.years}
                      onChange={(e) => setNewEducation({ ...newEducation, years: e.target.value })}
                      className="border rounded p-1 mb-2"
                    />
                    <button onClick={handleAddEducation} className="bg-blue-500 text-white rounded px-4 py-2">
                      Add Education
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profileData?.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-800 flex items-center gap-2"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add new skill"
                    className="border rounded p-1 flex-1"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="bg-blue-500 text-white rounded px-4 py-1"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Experience & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience</h2>
              <div className="space-y-6">
                {experienceEntries.map((entry) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={entry.position}
                            onChange={(e) => {
                              const updatedEntries = experienceEntries.map(exp => 
                                exp.id === entry.id ? { ...exp, position: e.target.value } : exp
                              );
                              setExperienceEntries(updatedEntries);
                            }}
                            className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
                          />
                          <input
                            type="text"
                            value={entry.company}
                            onChange={(e) => {
                              const updatedEntries = experienceEntries.map(exp => 
                                exp.id === entry.id ? { ...exp, company: e.target.value } : exp
                              );
                              setExperienceEntries(updatedEntries);
                            }}
                            className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
                          />
                          <input
                            type="text"
                            value={entry.period}
                            onChange={(e) => {
                              const updatedEntries = experienceEntries.map(exp => 
                                exp.id === entry.id ? { ...exp, period: e.target.value } : exp
                              );
                              setExperienceEntries(updatedEntries);
                            }}
                            className="text-sm text-gray-500 dark:text-gray-500 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
                          />
                          <div className="space-y-1">
                            {entry.description.map((desc, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => {
                                    const updatedEntries = experienceEntries.map(exp => {
                                      if (exp.id === entry.id) {
                                        const updatedDesc = [...exp.description];
                                        updatedDesc[index] = e.target.value;
                                        return { ...exp, description: updatedDesc };
                                      }
                                      return exp;
                                    });
                                    setExperienceEntries(updatedEntries);
                                  }}
                                  className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
                                />
                                <button
                                  onClick={() => {
                                    const updatedEntries = experienceEntries.map(exp => {
                                      if (exp.id === entry.id) {
                                        const updatedDesc = [...exp.description];
                                        updatedDesc.splice(index, 1);
                                        return { ...exp, description: updatedDesc };
                                      }
                                      return exp;
                                    });
                                    setExperienceEntries(updatedEntries);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const updatedEntries = experienceEntries.map(exp => {
                                  if (exp.id === entry.id) {
                                    return { ...exp, description: [...exp.description, ""] };
                                  }
                                  return exp;
                                });
                                setExperienceEntries(updatedEntries);
                              }}
                              className="text-sm text-blue-500 hover:text-blue-700"
                            >
                              + Add Description
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteExperience(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete Experience
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium text-gray-900 dark:text-white">{entry.position}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{entry.company}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">{entry.period}</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {entry.description.map((desc, index) => (
                              <li key={index}>{desc}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <div className="space-y-4 mt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Add New Experience</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Position"
                        value={newExperience.position}
                        onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                        className="border rounded p-1 w-full"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        className="border rounded p-1 w-full"
                      />
                      <input
                        type="text"
                        placeholder="Period (e.g., Jun 2023 - Aug 2023)"
                        value={newExperience.period}
                        onChange={(e) => setNewExperience({ ...newExperience, period: e.target.value })}
                        className="border rounded p-1 w-full"
                      />
                      <div className="space-y-2">
                        {newExperience.description.map((desc, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Description"
                              value={desc}
                              onChange={(e) => handleDescriptionChange(index, e.target.value)}
                              className="border rounded p-1 flex-1"
                            />
                            <button
                              onClick={() => handleRemoveDescription(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddDescription(newExperience.description.length - 1)}
                          className="text-sm text-blue-500 hover:text-blue-700"
                        >
                          + Add Description
                        </button>
                      </div>
                      <button
                        onClick={handleAddExperience}
                        className="bg-blue-500 text-white rounded px-4 py-2"
                      >
                        Add Experience
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"> */}
            {/*   <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2> */}
            {/*   <div className="space-y-4"> */}
            {/*     {[1, 2, 3].map((i) => ( */}
            {/*       <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"> */}
            {/*         <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"> */}
            {/*           <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> */}
            {/*         </div> */}
            {/*         <div> */}
            {/*           <p className="text-gray-900 dark:text-white">Applied for <span className="font-medium">Software Engineering Intern</span> at Tech Company {i}</p> */}
            {/*           <div className="flex items-center gap-2 mt-1"> */}
            {/*             <Calendar className="w-4 h-4 text-gray-400" /> */}
            {/*             <span className="text-sm text-gray-500 dark:text-gray-400">2 days ago</span> */}
            {/*           </div> */}
            {/*         </div> */}
            {/*       </div> */}
            {/*     ))} */}
            {/*   </div> */}
            {/* </div> */}
          </div>
        </div>
      </main>
    </div>
  );
} 