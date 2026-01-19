import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface TimeGroup {
  date: string;
  displayDate: string;
  count: number;
  leads: Lead[];
}

interface TimeBasedGroupingProps {
  onSelectGroups: (leads: Lead[]) => void;
  selectedLeads: Lead[];
}

const TimeBasedGrouping: React.FC<TimeBasedGroupingProps> = ({ onSelectGroups, selectedLeads }) => {
  const [groups, setGroups] = useState<TimeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const groupLeadsByDate = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false });

      // Apply date range filter if set
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: leads, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      // Group by date
      const groupsMap = new Map<string, Lead[]>();
      
      leads?.forEach(lead => {
        const date = new Date(lead.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!groupsMap.has(date)) {
          groupsMap.set(date, []);
        }
        groupsMap.get(date)?.push(lead);
      });

      // Convert to array and format
      const grouped: TimeGroup[] = Array.from(groupsMap.entries())
        .map(([date, leads]) => ({
          date,
          displayDate: formatDate(date),
          count: leads.length,
          leads
        }))
        .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

      setGroups(grouped);
    } catch (err) {
      console.error('Error grouping leads:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    groupLeadsByDate();
  }, [groupLeadsByDate]);

  const handleDateToggle = (date: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(date)) {
      newSelected.delete(date);
    } else {
      newSelected.add(date);
    }
    setSelectedDates(newSelected);

    // Update selected leads
    const selectedLeadsList: Lead[] = [];
    groups.forEach(group => {
      if (newSelected.has(group.date)) {
        selectedLeadsList.push(...group.leads);
      }
    });
    onSelectGroups(selectedLeadsList);
  };

  const handleSelectAll = () => {
    if (selectedDates.size === groups.length) {
      // Deselect all
      setSelectedDates(new Set());
      onSelectGroups([]);
    } else {
      // Select all
      const allDates = new Set(groups.map(g => g.date));
      setSelectedDates(allDates);
      const allLeads: Lead[] = groups.flatMap(g => g.leads);
      onSelectGroups(allLeads);
    }
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
    setSelectedDates(new Set()); // Clear selection when range changes
    onSelectGroups([]);
  };

  const getQuickRanges = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 14);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return [
      { label: 'Today', start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      { label: 'Yesterday', start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] },
      { label: 'This Week', start: thisWeek.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      { label: 'Last Week', start: lastWeek.toISOString().split('T')[0], end: thisWeek.toISOString().split('T')[0] },
      { label: 'This Month', start: thisMonth.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      { label: 'Last Month', start: lastMonth.toISOString().split('T')[0], end: lastMonthEnd.toISOString().split('T')[0] },
    ];
  };

  const totalSelected = groups
    .filter(g => selectedDates.has(g.date))
    .reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="space-y-4">
      {/* Quick Date Range Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          {getQuickRanges().map(range => (
            <button
              key={range.label}
              onClick={() => handleDateRangeChange(range.start, range.end)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => {
              setDateRange(null);
              setSelectedDates(new Set());
              onSelectGroups([]);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange?.start || ''}
            onChange={(e) => {
              const start = e.target.value;
              const end = dateRange?.end || start;
              handleDateRangeChange(start, end);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={dateRange?.end || ''}
            onChange={(e) => {
              const start = dateRange?.start || e.target.value;
              const end = e.target.value;
              handleDateRangeChange(start, end);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Selection Summary */}
      {totalSelected > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {totalSelected.toLocaleString()} leads selected from {selectedDates.size} date(s)
          </p>
        </div>
      )}

      {/* Date Groups */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading leads...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Leads by Date</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedDates.size === groups.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {groups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No leads found for the selected date range
              </div>
            ) : (
              groups.map(group => (
                <label
                  key={group.date}
                  className={`flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedDates.has(group.date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDates.has(group.date)}
                    onChange={() => handleDateToggle(group.date)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📅</span>
                        <span className="font-medium text-gray-900">{group.displayDate}</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                        {group.count.toLocaleString()} leads
                      </span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeBasedGrouping;
