'use client';

import React, { useEffect } from 'react';
import { useHubSpot } from '@/hooks/useHubSpot';
import { useAuth } from '@/contexts/AuthContextOptimized';

interface HubSpotProviderProps {
  children?: React.ReactNode;
}

/**
 * HubSpot Provider Component
 * Initializes HubSpot tracking and identifies users when authenticated
 */
export default function HubSpotProvider({ children }: HubSpotProviderProps) {
  const { identifyUser } = useHubSpot();
  const { user } = useAuth();

  useEffect(() => {
    // Identify user in HubSpot when authenticated
    if (user?.email) {
      const userProperties: Record<string, any> = {
        email: user.email,
      };

      // Add optional user properties if available
      if (user.user_metadata?.full_name) {
        userProperties.firstname = user.user_metadata.full_name.split(' ')[0];
        userProperties.lastname = user.user_metadata.full_name.split(' ').slice(1).join(' ');
      }

      if (user.user_metadata?.phone) {
        userProperties.phone = user.user_metadata.phone;
      }

      // Track user signup/login date
      if (user.created_at) {
        userProperties.signup_date = user.created_at;
      }

      identifyUser(user.email, userProperties);
    }
  }, [user, identifyUser]);

  return <>{children}</>;
}

