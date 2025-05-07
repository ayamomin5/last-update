import { NextResponse } from 'next/server';

// Default API URL if environment variable is not set
const DEFAULT_API_URL = 'http://localhost:5000';

export async function GET() {
  try {
    // Use environment variable with fallback to default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
    console.log('Using API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/api/opportunities`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Disable caching to ensure fresh data
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response data
    if (!Array.isArray(data)) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from backend');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in opportunities API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 