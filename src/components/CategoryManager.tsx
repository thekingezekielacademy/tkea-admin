import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  type: 'custom' | 'time_based' | 'upload_batch';
  description?: string;
  color?: string;
  count?: number;
}

interface CategoryManagerProps {
  onSelectCategories: (categoryNames: string[]) => void;
  selectedCategories: string[];
  type: 'sms' | 'email';
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onSelectCategories, selectedCategories, type }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch categories and counts
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch custom categories
      const { data: customCategories, error: catError } = await supabase
        .from('broadcast_categories')
        .select('id, name, type, description, color')
        .eq('type', 'custom')
        .order('name');

      if (catError) {
        console.error('Error fetching categories:', catError);
        setLoading(false);
        return;
      }

      // Fetch upload batch categories (from broadcast_contacts)
      const { data: uploadBatches, error: batchError } = await supabase
        .from('broadcast_contacts')
        .select('category, upload_batch_id')
        .not('category', 'is', null)
        .not('category', 'eq', '');

      if (batchError) {
        console.error('Error fetching upload batches:', batchError);
      }

      // Count contacts per category
      const categoryCounts = new Map<string, number>();
      uploadBatches?.forEach(contact => {
        if (contact.category) {
          const count = categoryCounts.get(contact.category) || 0;
          categoryCounts.set(contact.category, count + 1);
        }
      });

      // Combine categories with counts
      const allCategories: Category[] = [
        ...(customCategories || []).map(cat => ({
          ...cat,
          count: categoryCounts.get(cat.name) || 0
        })),
        // Add upload batch categories
        ...Array.from(categoryCounts.entries())
          .filter(([name]) => !customCategories?.some(c => c.name === name))
          .map(([name, count]) => ({
            id: name, // Use name as ID for upload batches
            name,
            type: 'upload_batch' as const,
            count
          }))
      ];

      setCategories(allCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('broadcast_categories')
        .insert({
          name: newCategoryName.trim(),
          type: 'custom',
          description: `Custom category for ${type} broadcasts`
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('Category with this name already exists');
        } else {
          throw error;
        }
      } else {
        setNewCategoryName('');
        fetchCategories(); // Refresh list
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      alert('Failed to create category: ' + err.message);
    } finally {
      setCreating(false);
    }
  }, [newCategoryName, type, fetchCategories]);

  const deleteCategory = useCallback(async (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete category "${categoryName}"? This will not delete the contacts, only the category.`)) {
      return;
    }

    try {
      // Only delete if it's a custom category (not upload_batch)
      const category = categories.find(c => c.id === categoryId);
      if (category?.type === 'custom') {
        const { error } = await supabase
          .from('broadcast_categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
        fetchCategories(); // Refresh list
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  }, [categories, fetchCategories]);

  const handleCategoryToggle = (categoryName: string) => {
    const newSelected = selectedCategories.includes(categoryName)
      ? selectedCategories.filter(c => c !== categoryName)
      : [...selectedCategories, categoryName];
    onSelectCategories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      onSelectCategories([]);
    } else {
      onSelectCategories(categories.map(c => c.name));
    }
  };

  return (
    <div className="space-y-4">
      {/* Create New Category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createCategory()}
          placeholder="Create new category..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={createCategory}
          disabled={creating || !newCategoryName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-4 text-center text-gray-500 border rounded-lg">
          No categories yet. Create one above or upload contacts to auto-generate categories.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Categories</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {categories.map(category => (
              <label
                key={category.id}
                className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedCategories.includes(category.name) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryToggle(category.name)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {category.type === 'upload_batch' && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Upload Batch
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {category.count !== undefined && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">
                      {category.count}
                    </span>
                  )}
                  {category.type === 'custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category.id, category.name);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Selected Summary */}
      {selectedCategories.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
