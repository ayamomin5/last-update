const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function login({ email, password, role }: { email: string, password: string, role: 'student' | 'company' }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Login failed');
  return res.json(); // { token, user }
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function registerStudent({ name, email, password }: { name: string, email: string, password: string }) {
  const res = await fetch(`${API_URL}/auth/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Registration failed');
  return res.json();
}

export async function registerCompany({ name, email, password }: { name: string, email: string, password: string }) {
  const res = await fetch(`${API_URL}/auth/register/company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Registration failed');
  return res.json();
}

export async function getProfile(role: 'student' | 'company', token: string) {
  const res = await fetch(`${API_URL}/profile/${role}`, {
    headers: { ...authHeader(token) }
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to fetch profile');
  return res.json();
}

export async function updateProfile(role: 'student' | 'company', profile: any, token: string) {
  const res = await fetch(`${API_URL}/profile/${role}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ profile })
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to update profile');
  return res.json();
}

// Company Profile Types
export interface CompanyProfile {
  name: string;
  industry: string;
  location: string;
  description: string;
  website: string;
  contactEmail: string;
  logo?: string;
}

// Get company profile
export async function getCompanyProfile(token: string) {
  const res = await fetch(`${API_URL}/auth/company/profile`, {
    headers: { ...authHeader(token) }
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to fetch company profile');
  return res.json();
}

// Update company profile
export async function updateCompanyProfile(profile: Partial<CompanyProfile>, token: string) {
  try {
    const res = await fetch(`${API_URL}/auth/company/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(profile)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || 'Failed to update company profile');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
}

// Upload company logo
export async function uploadCompanyLogo(file: File, token: string) {
  const formData = new FormData();
  formData.append('logo', file);

  try {
    const res = await fetch(`${API_URL}/auth/company/profile/logo`, {
      method: 'POST',
      headers: { ...authHeader(token) },
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || 'Failed to upload logo');
    }

    const data = await res.json();
    if (!data.logoUrl) {
      throw new Error('No logo URL in response');
    }

    return data.logoUrl;
  } catch (error) {
    console.error('Logo upload error:', error);
    throw error;
  }
}

export interface Opportunity {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  category: 'software' | 'data' | 'design' | 'marketing' | 'business' | 'other';
  tags: string[];
  salary: {
    min?: number;
    max?: number;
    currency: string;
  };
  duration: string;
  deadline: string;
  company: string;
  status: 'draft' | 'active' | 'closed' | 'expired';
  createdAt: string;
  updatedAt: string;
  applicants: Array<{
    _id: string;
    status: string;
  }>;
  lastUpdatedBy: string;
  opportunityType: 'internship' | 'externship' | 'freelance' | 'part-time' | 'full-time' | 'remote' | 'contract' | 'research' | 'apprenticeship';
}

// Create new opportunity
export async function createOpportunity(data: Partial<Opportunity>, token: string): Promise<Opportunity> {
  const response = await fetch(`${API_URL}/opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to create opportunity');
  }

  return response.json();
}

// Update opportunity
export async function updateOpportunity(id: string, data: Partial<Opportunity>, token: string): Promise<Opportunity> {
  const response = await fetch(`${API_URL}/opportunities/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to update opportunity');
  }

  return response.json();
}

// Get opportunity by ID
export async function getOpportunity(id: string, token: string): Promise<Opportunity> {
  console.log('API URL:', API_URL);
  console.log('Fetching opportunity with ID:', id);
  
  const response = await fetch(`${API_URL}/opportunities/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData.msg || `Failed to fetch opportunity: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('API Response:', data);
  return data;
}

// Get all opportunities with optional filters
export async function getOpportunities(params: {
  category?: string;
  status?: string;
  search?: string;
  opportunityType?: string;
  location?: string;
  skills?: string;
  minSalary?: string;
  maxSalary?: string;
  experienceLevel?: string;
}, token: string): Promise<Opportunity[]> {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.opportunityType) queryParams.append('opportunityType', params.opportunityType);
  if (params.location) queryParams.append('location', params.location);
  if (params.skills) queryParams.append('skills', params.skills);
  if (params.minSalary) queryParams.append('minSalary', params.minSalary);
  if (params.maxSalary) queryParams.append('maxSalary', params.maxSalary);
  if (params.experienceLevel) queryParams.append('experienceLevel', params.experienceLevel);
  const response = await fetch(`${API_URL}/opportunities?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to fetch opportunities');
  }

  return response.json();
}

// Delete opportunity
export async function deleteOpportunity(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/opportunities/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to delete opportunity');
  }
}

// Save opportunity (for students)
export async function saveOpportunity(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/opportunities/save/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to save opportunity');
  }
}

// Unsave opportunity (for students)
export async function unsaveOpportunity(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/opportunities/unsave/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to unsave opportunity');
  }
}

export async function getCompanyOpportunities(token: string,status?: string
): Promise<{ opportunities: Opportunity[], stats?: {
  activePostings: number,
  totalApplications: number,
  interviewsScheduled: number,
  acceptedApplications: number,
  rejectedApplications: number
}}> {
  const url = status
    ? `${API_URL}/opportunities/company?status=${status}`
    : `${API_URL}/opportunities/company`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to fetch company opportunities');
  }

  return await response.json(); // { opportunities, stats }
}

// Fetch all applications for the company (populates student and opportunity)
export async function getCompanyApplications(token: string) {
  const response = await fetch(`${API_URL}/applications/company`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to fetch applications');
  }
  return response.json();
}

// Fetch a single application by ID (populates student and opportunity)
export async function getApplicationById(id: string, token: string) {
  const response = await fetch(`${API_URL}/applications/company`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to fetch applications');
  }
  const apps = await response.json();
  return apps.find((app: any) => app.id === id || app._id === id);
}

// Update application status (accept/reject)
export async function updateApplicationStatus(id: string, status: string, token: string) {
  const response = await fetch(`${API_URL}/applications/${id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to update application status');
  }
  return response.json();
}

// Fetch student notifications
export async function getStudentNotifications(token: string) {
  const response = await fetch(`${API_URL}/profile/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to fetch notifications');
  }
  return response.json();
}

// Schedule interview for an application
export async function scheduleInterview(applicationId: string, interview: { date: string, time: string, type: string, link?: string, notes?: string }, token: string) {
  const response = await fetch(`${API_URL}/applications/${applicationId}/interview`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ interview })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to schedule interview');
  }
  return response.json();
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(token: string) {
  const response = await fetch(`${API_URL}/profile/notifications/read-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to mark notifications as read');
  }
  return response.json();
}

// Mark a single notification as read by index
export async function markNotificationAsRead(index: number, token: string) {
  const response = await fetch(`${API_URL}/profile/notifications/${index}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Failed to mark notification as read');
  }
  return response.json();
}
