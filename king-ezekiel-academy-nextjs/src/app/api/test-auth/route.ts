import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth - Headers:', {
      authorization: request.headers.get('Authorization') ? 'Present' : 'Missing',
      cookie: request.headers.get('cookie') ? 'Present' : 'Missing'
    });

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('🔍 Test Auth - Result:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    });

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: error?.message || 'No user found',
        hasUser: false
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      hasUser: true
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      hasUser: false
    });
  }
}
