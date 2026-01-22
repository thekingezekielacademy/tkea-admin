import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ContactUploader, { Contact } from './ContactUploader';
import TimeBasedGrouping from './TimeBasedGrouping';
import CategoryManager from './CategoryManager';

// User group types
type UserGroup = 
  | 'hasnt_paid_build'
  | 'paid_build'
  | 'bought_course'
  | 'hasnt_bought_course';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
}

const BulkBroadcast: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State - Tab management
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'telegram'>('email');
  
  // Email Broadcast State
  const [emailSelectedGroup, setEmailSelectedGroup] = useState<UserGroup | ''>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailFirstSentence, setEmailFirstSentence] = useState('');
  const [emailSecondSentence, setEmailSecondSentence] = useState('');
  const [emailSoftLink, setEmailSoftLink] = useState('');
  const [emailSoftLinkText, setEmailSoftLinkText] = useState('');
  const [emailSupportLine, setEmailSupportLine] = useState('');
  const [emailButtonText, setEmailButtonText] = useState('');
  const [emailButtonLink, setEmailButtonLink] = useState('');
  const [emailUploadedContacts, setEmailUploadedContacts] = useState<Contact[]>([]);
  const [emailSelectedCategories, setEmailSelectedCategories] = useState<string[]>([]);
  const [emailSelectedLeads, setEmailSelectedLeads] = useState<Array<{id: string; name: string; email: string; phone: string | null; created_at: string}>>([]);
  const [emailUseTimeBasedGrouping, setEmailUseTimeBasedGrouping] = useState(false);
  const [emailUseUploadedContacts, setEmailUseUploadedContacts] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [emailResults, setEmailResults] = useState<{ success: boolean; message: string } | null>(null);
  const [emailError, setEmailError] = useState('');
  
  // SMS Broadcast State
  const [smsSelectedGroup, setSmsSelectedGroup] = useState<UserGroup | ''>('');
  const [smsBody, setSmsBody] = useState('');
  const [smsUploadedContacts, setSmsUploadedContacts] = useState<Contact[]>([]);
  const [smsSelectedCategories, setSmsSelectedCategories] = useState<string[]>([]);
  const [smsUseUploadedContacts, setSmsUseUploadedContacts] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const [smsResults, setSmsResults] = useState<{ success: boolean; message: string } | null>(null);
  const [smsError, setSmsError] = useState('');
  
  // Telegram Broadcast State
  const [telegramTitle, setTelegramTitle] = useState('');
  const [telegramDescription, setTelegramDescription] = useState('');
  const [telegramButtonText, setTelegramButtonText] = useState('');
  const [telegramButtonLink, setTelegramButtonLink] = useState('');
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramResults, setTelegramResults] = useState<{ success: boolean; message: string } | null>(null);
  const [telegramError, setTelegramError] = useState('');
  
  // Shared state for user groups
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [groupCounts, setGroupCounts] = useState<{ [key in UserGroup]: number | null }>({
    hasnt_paid_build: null,
    paid_build: null,
    bought_course: null,
    hasnt_bought_course: null,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Admin check
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Helper: Check if user has BUILD access (either via live_class record OR 3+ BUILD courses)
  const getUserBuildAccess = useCallback(async (): Promise<{
    hasBuildAccessIds: Set<string>;
    hasBuildAccessEmails: Set<string>;
  }> => {
    const hasBuildAccessIds = new Set<string>();
    const hasBuildAccessEmails = new Set<string>();

    // Method 1: Check for product_type='live_class' records
    const { data: buildPurchases } = await supabase
      .from('product_purchases')
      .select('buyer_id, buyer_email')
      .eq('product_type', 'live_class')
      .eq('payment_status', 'success')
      .eq('access_granted', true);

    buildPurchases?.forEach(p => {
      if (p.buyer_id) hasBuildAccessIds.add(p.buyer_id);
      if (p.buyer_email) hasBuildAccessEmails.add(p.buyer_email.toLowerCase().trim());
    });

    // Method 2: Check for users with 3+ BUILD courses
    const BUILD_COURSE_TITLES = [
      'FREELANCING - THE UNTAPPED MARKET',
      'INFORMATION MARKETING: THE INFINITE CASH LOOP',
      'YOUTUBE MONETIZATION: From Setup To Monetization',
      'EARN 500K SIDE INCOME SELLING EBOOKS',
      'CPA MARKETING BLUEPRINT: TKEA RESELLERS'
    ];

    // First, get all BUILD course IDs
    const buildCourseIds: string[] = [];
    for (const title of BUILD_COURSE_TITLES) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .ilike('title', `%${title}%`)
        .eq('status', 'published')
        .limit(1);
      
      if (courses && courses.length > 0) {
        buildCourseIds.push(courses[0].id);
      }
    }

    if (buildCourseIds.length === 0) {
      // No BUILD courses found, return only Method 1 results
      return { hasBuildAccessIds, hasBuildAccessEmails };
    }

    // Get all course purchases for BUILD courses
    const { data: buildCoursePurchases } = await supabase
      .from('product_purchases')
      .select('buyer_id, buyer_email, product_id')
      .eq('product_type', 'course')
      .eq('payment_status', 'success')
      .eq('access_granted', true)
      .in('product_id', buildCourseIds);

    // Group by user and count BUILD courses
    const userBuildCourseCount = new Map<string, Set<string>>(); // user identifier -> set of course IDs
    const userIdentifiers = new Map<string, { id?: string; email?: string }>(); // identifier -> user info

    buildCoursePurchases?.forEach(purchase => {
      const userId = purchase.buyer_id;
      const userEmail = purchase.buyer_email?.toLowerCase().trim();
      const identifier = userId || userEmail || '';

      if (identifier) {
        if (!userBuildCourseCount.has(identifier)) {
          userBuildCourseCount.set(identifier, new Set());
          userIdentifiers.set(identifier, { id: userId, email: userEmail });
        }
        userBuildCourseCount.get(identifier)?.add(purchase.product_id);
      }
    });

    // Add users with 3+ BUILD courses to the access sets
    userBuildCourseCount.forEach((courseIds, identifier) => {
      if (courseIds.size >= 3) {
        const userInfo = userIdentifiers.get(identifier);
        if (userInfo?.id) hasBuildAccessIds.add(userInfo.id);
        if (userInfo?.email) hasBuildAccessEmails.add(userInfo.email);
      }
    });

    return { hasBuildAccessIds, hasBuildAccessEmails };
  }, []);

  // Fetch users by group
  const fetchUsersByGroup = useCallback(async (group: UserGroup): Promise<User[]> => {
    try {
      let users: User[] = [];

      switch (group) {
        case 'hasnt_paid_build': {
          // Get all leads from the leads table
          const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('name, email, phone');

          if (leadsError) {
            console.error('Error fetching leads:', leadsError);
            users = [];
            break;
          }

          // Get all users who HAVE BUILD access (to filter them out)
          const { hasBuildAccessIds, hasBuildAccessEmails } = await getUserBuildAccess();

          // Convert leads to User format and filter out those who have paid
          users = (leads || [])
            .filter(lead => {
              // Filter out leads whose email matches someone who has paid for BUILD
              const leadEmail = lead.email?.toLowerCase().trim();
              if (!leadEmail) return false; // Skip leads without email
              
              // Check if this lead's email is in the list of people who have paid
              const hasPaid = hasBuildAccessEmails.has(leadEmail);
              return !hasPaid; // Only include leads who HAVEN'T paid
            })
            .map(lead => ({
              id: '', // Leads don't have user IDs
              email: lead.email || '',
              name: lead.name || lead.email?.split('@')[0] || '',
              phone: lead.phone || null,
            }));

          // Remove duplicates by email
          const uniqueUsers = new Map<string, User>();
          users.forEach(user => {
            const email = user.email?.toLowerCase().trim();
            if (email) {
              if (!uniqueUsers.has(email)) {
                uniqueUsers.set(email, user);
              }
            }
          });

          users = Array.from(uniqueUsers.values());

          break;
        }

        case 'paid_build': {
          // Users who have BUILD access (via either method: live_class record OR 3+ BUILD courses)
          const { hasBuildAccessIds, hasBuildAccessEmails } = await getUserBuildAccess();

          if (hasBuildAccessIds.size === 0 && hasBuildAccessEmails.size === 0) return [];

          const buyerIds = Array.from(hasBuildAccessIds);
          const buyerEmails = Array.from(hasBuildAccessEmails);

          // Get profiles for users with IDs
          let profiles: User[] = [];
          if (buyerIds.length > 0) {
            const { data: profilesById } = await supabase
              .from('profiles')
              .select('id, email, name, phone')
              .in('id', buyerIds);
            profiles = (profilesById || []) as User[];
          }

          // Get profiles for users with emails (if not already found)
          if (buyerEmails.length > 0) {
            const foundEmails = new Set(profiles.map(p => p.email?.toLowerCase().trim()));
            const missingEmails = buyerEmails.filter(e => !foundEmails.has(e));
            
            if (missingEmails.length > 0) {
              const { data: profilesByEmail } = await supabase
                .from('profiles')
                .select('id, email, name, phone')
                .in('email', missingEmails);
              profiles = [...profiles, ...((profilesByEmail || []) as User[])];
            }
          }

          users = profiles;

          // Also include users by email if they don't have a profile yet
          const foundEmails = new Set(profiles.map(p => p.email?.toLowerCase().trim()));
          const emailOnlyUsers = buyerEmails
            .filter(email => !foundEmails.has(email))
            .map(email => ({
              id: '',
              email: email,
              name: email.split('@')[0],
              phone: null,
            }));

          users = [...users, ...emailOnlyUsers];
          break;
        }

        case 'bought_course': {
          // Users who have bought at least one course
          const { data: coursePurchases } = await supabase
            .from('product_purchases')
            .select('buyer_id, buyer_email')
            .eq('product_type', 'course')
            .eq('payment_status', 'success')
            .eq('access_granted', true);

          if (!coursePurchases || coursePurchases.length === 0) return [];

          const buyerIds = coursePurchases.map(p => p.buyer_id).filter(Boolean) as string[];
          const buyerEmails = coursePurchases.map(p => p.buyer_email?.toLowerCase().trim()).filter(Boolean) as string[];

          // Get profiles for users with IDs
          let profiles: User[] = [];
          if (buyerIds.length > 0) {
            const { data: profilesById } = await supabase
              .from('profiles')
              .select('id, email, name, phone')
              .in('id', buyerIds);
            profiles = (profilesById || []) as User[];
          }

          // Get profiles for users with emails (if not already found)
          if (buyerEmails.length > 0) {
            const foundEmails = new Set(profiles.map(p => p.email?.toLowerCase().trim()));
            const missingEmails = buyerEmails.filter(e => !foundEmails.has(e));
            
            if (missingEmails.length > 0) {
              const { data: profilesByEmail } = await supabase
                .from('profiles')
                .select('id, email, name, phone')
                .in('email', missingEmails);
              profiles = [...profiles, ...((profilesByEmail || []) as User[])];
            }
          }

          users = profiles;

          // Include email-only users
          const foundEmails = new Set(profiles.map(p => p.email?.toLowerCase().trim()));
          const emailOnlyUsers = buyerEmails
            .filter(email => !foundEmails.has(email))
            .map(email => ({
              id: '',
              email: email,
              name: email.split('@')[0],
              phone: null,
            }));

          users = [...users, ...emailOnlyUsers];
          break;
        }

        case 'hasnt_bought_course': {
          // Users who haven't bought any course
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, email, name, phone');

          if (!allProfiles) return [];

          // Get all users who HAVE bought a course
          const { data: coursePurchases } = await supabase
            .from('product_purchases')
            .select('buyer_id, buyer_email')
            .eq('product_type', 'course')
            .eq('payment_status', 'success')
            .eq('access_granted', true);

          const courseBuyerIds = new Set(
            coursePurchases?.map(p => p.buyer_id).filter(Boolean) || []
          );
          const courseBuyerEmails = new Set(
            coursePurchases?.map(p => p.buyer_email?.toLowerCase().trim()).filter(Boolean) || []
          );

          // Filter out users who have bought a course
          users = allProfiles.filter(profile => {
            const hasBought = courseBuyerIds.has(profile.id) || 
                             courseBuyerEmails.has(profile.email?.toLowerCase().trim());
            return !hasBought;
          }) as User[];

          break;
        }
      }

      // Remove duplicates
      const uniqueUsers = Array.from(
        new Map(users.map(u => [u.email?.toLowerCase().trim(), u])).values()
      );

      return uniqueUsers;
    } catch (err: any) {
      console.error('Error fetching users by group:', err);
      throw new Error('Failed to fetch users: ' + (err.message || 'Unknown error'));
    }
  }, [getUserBuildAccess]);

  // Count users in all groups
  const loadAllGroupCounts = useCallback(async () => {
    try {
      setLoadingCounts(true);

      const groups: UserGroup[] = ['hasnt_paid_build', 'paid_build', 'bought_course', 'hasnt_bought_course'];
      const counts: { [key in UserGroup]: number } = {
        hasnt_paid_build: 0,
        paid_build: 0,
        bought_course: 0,
        hasnt_bought_course: 0,
      };

      // Count users in each group
      for (const group of groups) {
        try {
          const users = await fetchUsersByGroup(group);
          counts[group] = users.length;
        } catch (err) {
          console.error(`Error counting users for group ${group}:`, err);
          counts[group] = 0;
        }
      }

      setGroupCounts(counts);
    } catch (err: any) {
      console.error('Error loading group counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  }, [fetchUsersByGroup]);

  // Load counts on mount
  useEffect(() => {
    loadAllGroupCounts();
  }, [loadAllGroupCounts]);

  // Generate inbox-safe email template
  const generateEmailHTML = useCallback((userName: string, userEmail: string): string => {
    const brandName = 'The King Ezekiel Academy';
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="padding: 0;">
    <p style="font-size: 16px; color: #333333; margin: 0 0 16px 0;">Hi ${userName},</p>
    
    ${emailFirstSentence ? `<p style="font-size: 16px; color: #333333; margin: 0 0 16px 0;">${emailFirstSentence}</p>` : ''}
    
    ${emailSecondSentence ? `<p style="font-size: 16px; color: #333333; margin: 0 0 16px 0;">${emailSecondSentence}</p>` : ''}
    
    ${emailSoftLink && emailSoftLinkText ? `<p style="font-size: 16px; color: #333333; margin: 0 0 16px 0;"><a href="${emailSoftLink}" style="color: #0066cc; text-decoration: underline;">${emailSoftLinkText}</a></p>` : ''}
    
    ${emailSupportLine ? `<p style="font-size: 16px; color: #333333; margin: 0 0 24px 0;">${emailSupportLine}</p>` : ''}
    
    ${emailButtonText && emailButtonLink ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${emailButtonLink}" style="background-color: #0066cc; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 16px; font-weight: 500;">${emailButtonText}</a>
    </div>
    ` : ''}
    
    <p style="font-size: 14px; color: #666666; margin: 24px 0 0 0; border-top: 1px solid #eeeeee; padding-top: 16px;">
      — ${brandName}
    </p>
  </div>
</body>
</html>
    `.trim();
    
    return html;
  }, [emailFirstSentence, emailSecondSentence, emailSoftLink, emailSoftLinkText, emailSupportLine, emailButtonText, emailButtonLink]);

  // Send email to a user
  const sendEmailToUser = useCallback(async (userEmail: string, userName: string): Promise<boolean> => {
    try {
      const apiUrl = `${window.location.origin}/api/send-email`;
      
      const html = generateEmailHTML(userName, userEmail);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: emailSubject,
          html: html,
        }),
      });

      const data = await response.json();
      return data.success === true;
    } catch (err) {
      console.error('Error sending email:', err);
      return false;
    }
  }, [emailSubject, generateEmailHTML]);

  // Send SMS to a user
  const sendSMSToUser = useCallback(async (userPhone: string, userName: string): Promise<boolean> => {
    if (!userPhone) return false;

    try {
      const apiUrl = `${window.location.origin}/api/send-sms`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userPhone,
          message: smsBody.replace(/\{name\}/g, userName),
        }),
      });

      const data = await response.json();
      return data.success === true;
    } catch (err) {
      console.error('Error sending SMS:', err);
      return false;
    }
  }, [smsBody]);

  // Send Telegram broadcast
  const sendTelegramBroadcast = useCallback(async (): Promise<boolean> => {
    try {
      const apiUrl = `${window.location.origin}/api/send-telegram`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: telegramTitle,
          description: telegramDescription,
          buttonText: telegramButtonText || undefined,
          buttonLink: telegramButtonLink || undefined,
        }),
      });

      const data = await response.json();
      return data.success === true;
    } catch (err) {
      console.error('Error sending Telegram:', err);
      return false;
    }
  }, [telegramTitle, telegramDescription, telegramButtonText, telegramButtonLink]);

  // Send Email Broadcast
  const handleSendEmailBroadcast = useCallback(async () => {
    // Validate selection
    if (!emailUseTimeBasedGrouping && !emailUseUploadedContacts && !emailSelectedGroup) {
      setEmailError('Please select a user group, upload contacts, or select leads by date');
      return;
    }

    if (!emailSubject || !emailFirstSentence || !emailSecondSentence) {
      setEmailError('Email subject, first sentence, and second sentence are required');
      return;
    }

    try {
      setEmailSending(true);
      setEmailError('');
      setEmailResults(null);
      setEmailProgress({ sent: 0, total: 0, failed: 0 });

      // Get users based on selection method
      let users: User[] = [];
      
      if (emailUseTimeBasedGrouping) {
        // Use selected leads from time-based grouping
        users = emailSelectedLeads.map(lead => ({
          id: lead.id || '',
          email: lead.email,
          name: lead.name || lead.email.split('@')[0],
          phone: lead.phone || null
        }));
      } else if (emailUseUploadedContacts) {
        // Use uploaded contacts (filtered by selected categories)
        if (emailSelectedCategories.length > 0) {
          // Fetch contacts from selected categories
          const { data: contacts, error } = await supabase
            .from('broadcast_contacts')
            .select('name, email, phone')
            .in('category', emailSelectedCategories);

          if (error) {
            throw new Error('Failed to fetch contacts: ' + error.message);
          }

          users = (contacts || []).map(contact => ({
            id: '',
            email: contact.email || '',
            name: contact.name || contact.email?.split('@')[0] || '',
            phone: contact.phone || null
          })).filter(u => u.email);
        } else {
          // Use in-memory uploaded contacts
          users = emailUploadedContacts.map(contact => ({
            id: '',
            email: contact.email || '',
            name: contact.name || contact.email?.split('@')[0] || '',
            phone: contact.phone || null
          })).filter(u => u.email);
        }
      } else {
        // Use predefined groups
        users = await fetchUsersByGroup(emailSelectedGroup as UserGroup);
      }
      
      if (users.length === 0) {
        setEmailError('No users found in the selected group');
        setEmailSending(false);
        return;
      }

      setEmailProgress({ sent: 0, total: users.length, failed: 0 });

      let sentCount = 0;
      let failedCount = 0;

      // Send to each user
      for (const user of users) {
        try {
          if (user.email) {
            const success = await sendEmailToUser(user.email, user.name || user.email.split('@')[0]);
            if (success) {
              sentCount++;
            } else {
              failedCount++;
            }
          } else {
            failedCount++;
          }

          setEmailProgress({ sent: sentCount, total: users.length, failed: failedCount });
        } catch (err) {
          console.error(`Error sending to ${user.email}:`, err);
          failedCount++;
          setEmailProgress({ sent: sentCount, total: users.length, failed: failedCount });
        }
      }

      setEmailResults({
        success: failedCount === 0,
        message: `Email broadcast completed! ${sentCount} sent, ${failedCount} failed out of ${users.length} users`,
      });
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email broadcast');
    } finally {
      setEmailSending(false);
    }
  }, [emailSelectedGroup, emailSubject, emailFirstSentence, emailSecondSentence, emailSoftLink, emailSoftLinkText, emailSupportLine, emailButtonText, emailButtonLink, fetchUsersByGroup, sendEmailToUser, emailUseTimeBasedGrouping, emailUseUploadedContacts, emailSelectedLeads, emailUploadedContacts, emailSelectedCategories]);

  // Send SMS Broadcast
  const handleSendSMSBroadcast = useCallback(async () => {
    // Validate selection
    if (!smsUseUploadedContacts && !smsSelectedGroup) {
      setSmsError('Please select a user group or upload contacts');
      return;
    }

    if (!smsBody) {
      setSmsError('SMS message is required');
      return;
    }

    try {
      setSmsSending(true);
      setSmsError('');
      setSmsResults(null);
      setSmsProgress({ sent: 0, total: 0, failed: 0 });

      // Get users based on selection method
      let users: User[] = [];
      
      if (smsUseUploadedContacts) {
        // Use uploaded contacts (filtered by selected categories)
        if (smsSelectedCategories.length > 0) {
          // Fetch contacts from selected categories
          const { data: contacts, error } = await supabase
            .from('broadcast_contacts')
            .select('name, email, phone')
            .in('category', smsSelectedCategories);

          if (error) {
            throw new Error('Failed to fetch contacts: ' + error.message);
          }

          users = (contacts || []).map(contact => ({
            id: '',
            email: contact.email || '',
            name: contact.name || contact.email?.split('@')[0] || '',
            phone: contact.phone || null
          })).filter(u => u.phone);
        } else {
          // Use in-memory uploaded contacts
          users = smsUploadedContacts.map(contact => ({
            id: '',
            email: contact.email || '',
            name: contact.name || contact.email?.split('@')[0] || '',
            phone: contact.phone || null
          })).filter(u => u.phone);
        }
      } else {
        // Use predefined groups
        users = await fetchUsersByGroup(smsSelectedGroup as UserGroup);
      }
      
      if (users.length === 0) {
        setSmsError('No users with phone numbers found in the selected group');
        setSmsSending(false);
        return;
      }

      setSmsProgress({ sent: 0, total: users.length, failed: 0 });

      let sentCount = 0;
      let failedCount = 0;

      // Send to each user
      for (const user of users) {
        try {
          if (user.phone) {
            const success = await sendSMSToUser(user.phone, user.name || user.email.split('@')[0]);
            if (success) {
              sentCount++;
            } else {
              failedCount++;
            }
          } else {
            failedCount++;
          }

          setSmsProgress({ sent: sentCount, total: users.length, failed: failedCount });
        } catch (err) {
          console.error(`Error sending to ${user.phone}:`, err);
          failedCount++;
          setSmsProgress({ sent: sentCount, total: users.length, failed: failedCount });
        }
      }

      setSmsResults({
        success: failedCount === 0,
        message: `SMS broadcast completed! ${sentCount} sent, ${failedCount} failed out of ${users.length} users`,
      });
    } catch (err: any) {
      setSmsError(err.message || 'Failed to send SMS broadcast');
    } finally {
      setSmsSending(false);
    }
  }, [smsSelectedGroup, smsBody, fetchUsersByGroup, sendSMSToUser, smsUseUploadedContacts, smsUploadedContacts, smsSelectedCategories]);

  // Send Telegram Broadcast
  const handleSendTelegramBroadcast = useCallback(async () => {
    if (!telegramTitle || !telegramDescription) {
      setTelegramError('Telegram title and description are required');
      return;
    }

    try {
      setTelegramSending(true);
      setTelegramError('');
      setTelegramResults(null);

      const success = await sendTelegramBroadcast();

      setTelegramResults({
        success: success,
        message: success ? '✅ Telegram broadcast sent successfully!' : '❌ Failed to send Telegram broadcast',
      });
    } catch (err: any) {
      setTelegramError(err.message || 'Failed to send Telegram broadcast');
    } finally {
      setTelegramSending(false);
    }
  }, [telegramTitle, telegramDescription, telegramButtonText, telegramButtonLink, sendTelegramBroadcast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Broadcast</h1>
            <p className="text-gray-600">Send emails, SMS, or Telegram messages to your audience</p>
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('email')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📧 Email Broadcast
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sms'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💬 SMS Broadcast
              </button>
              <button
                onClick={() => setActiveTab('telegram')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'telegram'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📱 Telegram Broadcast
              </button>
            </nav>
          </div>

          {/* Email Broadcast Tab */}
          {activeTab === 'email' && (
            <div>
              {/* Error Message */}
              {emailError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {emailError}
                </div>
              )}

              {/* Success Message */}
              {emailResults && (
                <div className={`mb-6 border px-4 py-3 rounded-lg ${emailResults.success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                  {emailResults.message}
                </div>
              )}

              {/* Contact Upload Section */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📤 Upload Contacts (Optional)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV or Excel file with contacts. They will be automatically categorized.
                </p>
                <ContactUploader
                  type="email"
                  onUploadComplete={async (contacts, category) => {
                    try {
                      const apiUrl = `${window.location.origin}/api/save-broadcast-contacts`;
                      const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contacts,
                          category: category || `Upload Batch - ${new Date().toLocaleDateString()}`,
                          source: 'upload'
                        })
                      });

                      const result = await response.json();
                      if (result.success) {
                        setEmailUploadedContacts(prev => [...prev, ...contacts]);
                        setEmailUseUploadedContacts(true);
                        setEmailError('');
                        alert(`✅ Successfully uploaded ${result.data.inserted} contacts!`);
                      } else {
                        setEmailError(result.error || 'Failed to save contacts');
                      }
                    } catch (err: any) {
                      setEmailError('Failed to save contacts: ' + err.message);
                    }
                  }}
                />
              </div>

              {/* Selection Method Toggle */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Choose Contact Source:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emailContactSource"
                      checked={emailUseTimeBasedGrouping}
                      onChange={() => {
                        setEmailUseTimeBasedGrouping(true);
                        setEmailUseUploadedContacts(false);
                        setEmailSelectedGroup('');
                      }}
                      className="mr-2"
                    />
                    <span>Use Leads from Database (Time-Based Grouping)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emailContactSource"
                      checked={emailUseUploadedContacts}
                      onChange={() => {
                        setEmailUseUploadedContacts(true);
                        setEmailUseTimeBasedGrouping(false);
                        setEmailSelectedGroup('');
                      }}
                      className="mr-2"
                    />
                    <span>Use Uploaded Contacts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emailContactSource"
                      checked={!emailUseTimeBasedGrouping && !emailUseUploadedContacts}
                      onChange={() => {
                        setEmailUseTimeBasedGrouping(false);
                        setEmailUseUploadedContacts(false);
                      }}
                      className="mr-2"
                    />
                    <span>Use Predefined User Groups</span>
                  </label>
                </div>
              </div>

              {/* Time-Based Grouping */}
              {emailUseTimeBasedGrouping && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📅 Select Leads by Date
                  </h2>
                  <TimeBasedGrouping
                    onSelectGroups={(leads) => {
                      setEmailSelectedLeads(leads);
                      setUserCount(leads.length);
                    }}
                    selectedLeads={emailSelectedLeads}
                  />
                </div>
              )}

              {/* User Group Selection */}
              {(!emailUseTimeBasedGrouping && !emailUseUploadedContacts) && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Select User Group</h2>
                    {loadingCounts && (
                      <span className="text-sm text-gray-500">Loading counts...</span>
                    )}
                    {!loadingCounts && (
                      <button
                        onClick={loadAllGroupCounts}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Refresh Counts
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="emailUserGroup"
                        value="hasnt_paid_build"
                        checked={emailSelectedGroup === 'hasnt_paid_build'}
                        onChange={(e) => {
                          setEmailSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Hasn't Paid for BUILD</p>
                          {groupCounts.hasnt_paid_build !== null && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                              {groupCounts.hasnt_paid_build.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who haven't purchased BUILD COMMUNITY</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="emailUserGroup"
                        value="paid_build"
                        checked={emailSelectedGroup === 'paid_build'}
                        onChange={(e) => {
                          setEmailSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Paid for BUILD</p>
                          {groupCounts.paid_build !== null && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              {groupCounts.paid_build.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who have purchased BUILD COMMUNITY</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="emailUserGroup"
                        value="bought_course"
                        checked={emailSelectedGroup === 'bought_course'}
                        onChange={(e) => {
                          setEmailSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Bought a Course</p>
                          {groupCounts.bought_course !== null && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                              {groupCounts.bought_course.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who have purchased at least one course</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="emailUserGroup"
                        value="hasnt_bought_course"
                        checked={emailSelectedGroup === 'hasnt_bought_course'}
                        onChange={(e) => {
                          setEmailSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Hasn't Bought a Course</p>
                          {groupCounts.hasnt_bought_course !== null && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                              {groupCounts.hasnt_bought_course.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who haven't purchased any course</p>
                      </div>
                    </label>
                  </div>

                  {emailSelectedGroup && (
                    <button
                      onClick={async () => {
                        if (!emailSelectedGroup) {
                          setEmailError('Please select a user group first');
                          return;
                        }
                        try {
                          setLoadingUsers(true);
                          setEmailError('');
                          const users = await fetchUsersByGroup(emailSelectedGroup as UserGroup);
                          setUserCount(users.length);
                        } catch (err: any) {
                          setEmailError(err.message || 'Failed to count users');
                          setUserCount(null);
                        } finally {
                          setLoadingUsers(false);
                        }
                      }}
                      disabled={loadingUsers}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingUsers ? 'Counting...' : 'Count Users'}
                    </button>
                  )}

                  {userCount !== null && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-indigo-900 font-semibold">
                        {userCount} {userCount === 1 ? 'user' : 'users'} found in this group
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selection (for uploaded contacts) */}
              {emailUseUploadedContacts && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📁 Select Categories
                  </h2>
                  <CategoryManager
                    type="email"
                    selectedCategories={emailSelectedCategories}
                    onSelectCategories={async (categoryNames) => {
                      setEmailSelectedCategories(categoryNames);
                      
                      if (categoryNames.length > 0) {
                        const { data: contacts, error } = await supabase
                          .from('broadcast_contacts')
                          .select('name, email, phone, category')
                          .in('category', categoryNames);

                        if (!error && contacts) {
                          const filteredContacts = contacts.filter(c => c.email);
                          setEmailUploadedContacts(filteredContacts);
                          setUserCount(filteredContacts.length);
                        }
                      } else {
                        setEmailUploadedContacts([]);
                        setUserCount(0);
                      }
                    }}
                  />
                </div>
              )}

              {/* Uploaded Contacts Summary */}
              {emailUseUploadedContacts && emailUploadedContacts.length > 0 && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ {emailUploadedContacts.length} contacts ready from {emailSelectedCategories.length} categor{emailSelectedCategories.length === 1 ? 'y' : 'ies'}
                  </h3>
                  <p className="text-sm text-green-700">
                    Ready to send emails to these contacts
                  </p>
                </div>
              )}

              {/* Email Composition */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose Email</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">(Short. Neutral. Informational.)</span>
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g., Important Update"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Sentence <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailFirstSentence}
                      onChange={(e) => setEmailFirstSentence(e.target.value)}
                      placeholder="One clear sentence."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Second Sentence <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailSecondSentence}
                      onChange={(e) => setEmailSecondSentence(e.target.value)}
                      placeholder="Another helpful sentence."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soft Link Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={emailSoftLinkText}
                        onChange={(e) => setEmailSoftLinkText(e.target.value)}
                        placeholder="e.g., Learn more"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soft Link URL (Optional - not payment)
                      </label>
                      <input
                        type="url"
                        value={emailSoftLink}
                        onChange={(e) => setEmailSoftLink(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support / Contact Line (Optional)
                    </label>
                    <input
                      type="text"
                      value={emailSupportLine}
                      onChange={(e) => setEmailSupportLine(e.target.value)}
                      placeholder="e.g., Need help? Contact us at support@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={emailButtonText}
                        onChange={(e) => setEmailButtonText(e.target.value)}
                        placeholder="e.g., Get Started"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={emailButtonLink}
                        onChange={(e) => setEmailButtonLink(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Template Format:</strong> Subject → Hi {`{name}`}, → First Sentence → Second Sentence → Optional Soft Link → Support Line → Button → — Brand
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {emailSending && emailProgress.total > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Sending emails...</p>
                    <p className="text-sm text-blue-700">
                      {emailProgress.sent + emailProgress.failed} / {emailProgress.total}
                    </p>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((emailProgress.sent + emailProgress.failed) / emailProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-blue-700">
                    Sent: {emailProgress.sent} | Failed: {emailProgress.failed}
                  </p>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendEmailBroadcast}
                disabled={emailSending || (!emailSelectedGroup && !emailUseTimeBasedGrouping && !emailUseUploadedContacts)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {emailSending ? 'Sending...' : 'Send Email Broadcast'}
              </button>
            </div>
          )}

          {/* SMS Broadcast Tab */}
          {activeTab === 'sms' && (
            <div>
              {/* Error Message */}
              {smsError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {smsError}
                </div>
              )}

              {/* Success Message */}
              {smsResults && (
                <div className={`mb-6 border px-4 py-3 rounded-lg ${smsResults.success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                  {smsResults.message}
                </div>
              )}

              {/* Contact Upload Section */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📤 Upload Contacts (Optional)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV or Excel file with contacts. They will be automatically categorized.
                </p>
                <ContactUploader
                  type="sms"
                  onUploadComplete={async (contacts, category) => {
                    try {
                      const apiUrl = `${window.location.origin}/api/save-broadcast-contacts`;
                      const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contacts,
                          category: category || `Upload Batch - ${new Date().toLocaleDateString()}`,
                          source: 'upload'
                        })
                      });

                      const result = await response.json();
                      if (result.success) {
                        setSmsUploadedContacts(prev => [...prev, ...contacts]);
                        setSmsUseUploadedContacts(true);
                        setSmsError('');
                        alert(`✅ Successfully uploaded ${result.data.inserted} contacts!`);
                      } else {
                        setSmsError(result.error || 'Failed to save contacts');
                      }
                    } catch (err: any) {
                      setSmsError('Failed to save contacts: ' + err.message);
                    }
                  }}
                />
              </div>

              {/* Selection Method Toggle */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Choose Contact Source:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="smsContactSource"
                      checked={smsUseUploadedContacts}
                      onChange={() => {
                        setSmsUseUploadedContacts(true);
                        setSmsSelectedGroup('');
                      }}
                      className="mr-2"
                    />
                    <span>Use Uploaded Contacts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="smsContactSource"
                      checked={!smsUseUploadedContacts}
                      onChange={() => {
                        setSmsUseUploadedContacts(false);
                      }}
                      className="mr-2"
                    />
                    <span>Use Predefined User Groups</span>
                  </label>
                </div>
              </div>

              {/* User Group Selection */}
              {!smsUseUploadedContacts && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Select User Group</h2>
                    {loadingCounts && (
                      <span className="text-sm text-gray-500">Loading counts...</span>
                    )}
                    {!loadingCounts && (
                      <button
                        onClick={loadAllGroupCounts}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Refresh Counts
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="smsUserGroup"
                        value="hasnt_paid_build"
                        checked={smsSelectedGroup === 'hasnt_paid_build'}
                        onChange={(e) => {
                          setSmsSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Hasn't Paid for BUILD</p>
                          {groupCounts.hasnt_paid_build !== null && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                              {groupCounts.hasnt_paid_build.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who haven't purchased BUILD COMMUNITY</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="smsUserGroup"
                        value="paid_build"
                        checked={smsSelectedGroup === 'paid_build'}
                        onChange={(e) => {
                          setSmsSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Paid for BUILD</p>
                          {groupCounts.paid_build !== null && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              {groupCounts.paid_build.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who have purchased BUILD COMMUNITY</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="smsUserGroup"
                        value="bought_course"
                        checked={smsSelectedGroup === 'bought_course'}
                        onChange={(e) => {
                          setSmsSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Bought a Course</p>
                          {groupCounts.bought_course !== null && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                              {groupCounts.bought_course.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who have purchased at least one course</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="smsUserGroup"
                        value="hasnt_bought_course"
                        checked={smsSelectedGroup === 'hasnt_bought_course'}
                        onChange={(e) => {
                          setSmsSelectedGroup(e.target.value as UserGroup);
                          setUserCount(null);
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Hasn't Bought a Course</p>
                          {groupCounts.hasnt_bought_course !== null && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                              {groupCounts.hasnt_bought_course.toLocaleString()} users
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Users who haven't purchased any course</p>
                      </div>
                    </label>
                  </div>

                  {smsSelectedGroup && (
                    <button
                      onClick={async () => {
                        if (!smsSelectedGroup) {
                          setSmsError('Please select a user group first');
                          return;
                        }
                        try {
                          setLoadingUsers(true);
                          setSmsError('');
                          const users = await fetchUsersByGroup(smsSelectedGroup as UserGroup);
                          setUserCount(users.filter(u => u.phone).length);
                        } catch (err: any) {
                          setSmsError(err.message || 'Failed to count users');
                          setUserCount(null);
                        } finally {
                          setLoadingUsers(false);
                        }
                      }}
                      disabled={loadingUsers}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingUsers ? 'Counting...' : 'Count Users'}
                    </button>
                  )}

                  {userCount !== null && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-indigo-900 font-semibold">
                        {userCount} {userCount === 1 ? 'user' : 'users'} with phone numbers found in this group
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selection (for uploaded contacts) */}
              {smsUseUploadedContacts && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📁 Select Categories
                  </h2>
                  <CategoryManager
                    type="sms"
                    selectedCategories={smsSelectedCategories}
                    onSelectCategories={async (categoryNames) => {
                      setSmsSelectedCategories(categoryNames);
                      
                      if (categoryNames.length > 0) {
                        const { data: contacts, error } = await supabase
                          .from('broadcast_contacts')
                          .select('name, email, phone, category')
                          .in('category', categoryNames);

                        if (!error && contacts) {
                          const filteredContacts = contacts.filter(c => c.phone);
                          setSmsUploadedContacts(filteredContacts);
                          setUserCount(filteredContacts.length);
                        }
                      } else {
                        setSmsUploadedContacts([]);
                        setUserCount(0);
                      }
                    }}
                  />
                </div>
              )}

              {/* Uploaded Contacts Summary */}
              {smsUseUploadedContacts && smsUploadedContacts.length > 0 && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ {smsUploadedContacts.length} contacts ready from {smsSelectedCategories.length} categor{smsSelectedCategories.length === 1 ? 'y' : 'ies'}
                  </h3>
                  <p className="text-sm text-green-700">
                    Ready to send SMS to these contacts
                  </p>
                </div>
              )}

              {/* SMS Composition */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose SMS</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Message (use {'{name}'} for user name)
                  </label>
                  <textarea
                    value={smsBody}
                    onChange={(e) => setSmsBody(e.target.value)}
                    placeholder="Enter SMS message..."
                    rows={4}
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {smsBody.length}/160 characters
                  </p>
                </div>
              </div>

              {/* Progress */}
              {smsSending && smsProgress.total > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Sending SMS...</p>
                    <p className="text-sm text-blue-700">
                      {smsProgress.sent + smsProgress.failed} / {smsProgress.total}
                    </p>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-blue-700">
                    Sent: {smsProgress.sent} | Failed: {smsProgress.failed}
                  </p>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendSMSBroadcast}
                disabled={smsSending || (!smsSelectedGroup && !smsUseUploadedContacts)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {smsSending ? 'Sending...' : 'Send SMS Broadcast'}
              </button>
            </div>
          )}

          {/* Telegram Broadcast Tab */}
          {activeTab === 'telegram' && (
            <div>
              {/* Error Message */}
              {telegramError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {telegramError}
                </div>
              )}

              {/* Success Message */}
              {telegramResults && (
                <div className={`mb-6 border px-4 py-3 rounded-lg ${telegramResults.success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                  {telegramResults.message}
                </div>
              )}

              {/* Info Box */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📱 Telegram Broadcast</h3>
                <p className="text-sm text-blue-700">
                  Send a message to all configured Telegram groups/channels. This does not require selecting user groups - it broadcasts directly to your Telegram groups.
                </p>
              </div>

              {/* Telegram Composition */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose Telegram Message</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={telegramTitle}
                      onChange={(e) => setTelegramTitle(e.target.value)}
                      placeholder="Enter message title (will be bold)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">This will appear as bold text at the top</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={telegramDescription}
                      onChange={(e) => setTelegramDescription(e.target.value)}
                      placeholder="Enter message description..."
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Supports Markdown formatting (bold, italic, links)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={telegramButtonText}
                        onChange={(e) => setTelegramButtonText(e.target.value)}
                        placeholder="e.g., Learn More"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={telegramButtonLink}
                        onChange={(e) => setTelegramButtonLink(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Telegram messages will be sent to all configured Telegram groups/channels (set via <code className="bg-blue-100 px-1 rounded">TELEGRAM_GROUP_ID</code> environment variable).
                    </p>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendTelegramBroadcast}
                disabled={telegramSending || !telegramTitle || !telegramDescription}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {telegramSending ? 'Sending...' : 'Send Telegram Broadcast'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkBroadcast;
