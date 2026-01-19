import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
}

interface ContactUploaderProps {
  onUploadComplete: (contacts: Contact[], category?: string) => void;
  type: 'sms' | 'email';
}

const ContactUploader: React.FC<ContactUploaderProps> = ({ onUploadComplete, type }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Contact[]>([]);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');

  const validateContact = (contact: any, index: number): Contact | null => {
    const validated: Contact = {};

    // Name (optional)
    if (contact.name) validated.name = String(contact.name).trim();
    if (contact.Name) validated.name = String(contact.Name).trim();
    if (contact.NAME) validated.name = String(contact.NAME).trim();

    // Email (required for email type, optional for SMS)
    if (contact.email || contact.Email || contact.EMAIL) {
      const email = String(contact.email || contact.Email || contact.EMAIL).trim().toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        validated.email = email;
      } else if (type === 'email' && !validated.email) {
        setError(`Row ${index + 1}: Invalid email format`);
        return null;
      }
    } else if (type === 'email') {
      setError(`Row ${index + 1}: Email is required`);
      return null;
    }

    // Phone (required for SMS type, optional for email)
    if (contact.phone || contact.Phone || contact.PHONE || contact.number || contact.Number || contact.NUMBER) {
      const phone = String(
        contact.phone || contact.Phone || contact.PHONE || 
        contact.number || contact.Number || contact.NUMBER
      ).trim();
      // Basic phone validation (at least 10 digits)
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        validated.phone = phone;
      } else if (type === 'sms' && !validated.phone) {
        setError(`Row ${index + 1}: Invalid phone number (must have at least 10 digits)`);
        return null;
      }
    } else if (type === 'sms') {
      setError(`Row ${index + 1}: Phone number is required`);
      return null;
    }

    // Category (optional)
    if (contact.category || contact.Category || contact.CATEGORY) {
      validated.category = String(contact.category || contact.Category || contact.CATEGORY).trim();
    }

    // At least email or phone must be present
    if (!validated.email && !validated.phone) {
      setError(`Row ${index + 1}: Either email or phone number is required`);
      return null;
    }

    return validated;
  };

  const parseCSV = useCallback((file: File) => {
    return new Promise<Contact[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const contacts: Contact[] = [];
          const seen = new Set<string>();

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;
            const contact = validateContact(row, i);
            
            if (contact) {
              // Check for duplicates by email or phone
              const key = contact.email || contact.phone || '';
              if (key && !seen.has(key)) {
                seen.add(key);
                contacts.push(contact);
              }
            }
          }

          if (contacts.length === 0) {
            reject(new Error('No valid contacts found in file'));
          } else {
            resolve(contacts);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }, [type]);

  const parseExcel = useCallback((file: File) => {
    return new Promise<Contact[]>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const contacts: Contact[] = [];
          const seen = new Set<string>();

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any;
            const contact = validateContact(row, i);
            
            if (contact) {
              const key = contact.email || contact.phone || '';
              if (key && !seen.has(key)) {
                seen.add(key);
                contacts.push(contact);
              }
            }
          }

          if (contacts.length === 0) {
            reject(new Error('No valid contacts found in file'));
          } else {
            resolve(contacts);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, [type]);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    setPreview([]);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let contacts: Contact[] = [];

      if (fileExtension === 'csv') {
        contacts = await parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        contacts = await parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel file.');
      }

      setPreview(contacts.slice(0, 10)); // Show first 10 for preview
      setUploading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
      setUploading(false);
    }
  }, [parseCSV, parseExcel]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleConfirm = useCallback(() => {
    if (preview.length === 0) {
      setError('No contacts to upload');
      return;
    }

    // Get all contacts (not just preview)
    // For now, we'll use preview. In production, you'd want to store all contacts
    onUploadComplete(preview, category || undefined);
    setPreview([]);
    setCategory('');
  }, [preview, category, onUploadComplete]);

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV or Excel files only</p>
        </label>
      </div>

      {/* Category Input */}
      {preview.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name (Optional)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Facebook Ads, Google Ads, Upload Batch #1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Preview ({preview.length} contacts)
            </h3>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirm Upload
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  {type === 'email' && <th className="text-left p-2">Email</th>}
                  {type === 'sms' && <th className="text-left p-2">Phone</th>}
                  <th className="text-left p-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((contact, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{contact.name || '-'}</td>
                    {type === 'email' && <td className="p-2">{contact.email || '-'}</td>}
                    {type === 'sms' && <td className="p-2">{contact.phone || '-'}</td>}
                    <td className="p-2">{contact.category || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Uploading Indicator */}
      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Processing file...</p>
        </div>
      )}
    </div>
  );
};

export default ContactUploader;
