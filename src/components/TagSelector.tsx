// ============================================================================
// LESSON TAG SELECTOR COMPONENT
// ============================================================================
// Tag management with autocomplete, creation, and visual pills
// File: src/components/TagSelector.tsx
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Tag, X, Plus, Search, Check } from 'lucide-react';
import type { LessonTag, CreateTagData } from '../types/lesson.types';

interface TagSelectorProps {
  availableTags: LessonTag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (tagData: CreateTagData) => Promise<LessonTag>;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
}

export function TagSelector({
  availableTags,
  selectedTagIds,
  onChange,
  onCreateTag,
  disabled = false,
  label = 'Tags',
  placeholder = 'Search or create tags...',
  maxTags = 10,
  allowCreate = true,
  className = ''
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
  const canAddMore = selectedTagIds.length < maxTags;

  // Filter tags based on search query
  const filteredTags = availableTags.filter(tag => 
    !selectedTagIds.includes(tag.id) &&
    (tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tag.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if search query could be a new tag
  const canCreateNewTag = allowCreate && 
                          searchQuery.trim().length >= 2 && 
                          !availableTags.some(tag => 
                            tag.name.toLowerCase() === searchQuery.trim().toLowerCase()
                          );

  const handleAddTag = (tagId: string) => {
    if (canAddMore && !selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
      setSearchQuery('');
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !canCreateNewTag || isCreating) return;

    setIsCreating(true);
    try {
      const slug = searchQuery.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newTag = await onCreateTag({
        name: searchQuery.trim(),
        slug,
        color: '#6366f1' // Default purple
      });

      handleAddTag(newTag.id);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCreateNewTag && !isCreating) {
      e.preventDefault();
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>{label}</span>
          </div>
        </label>
      )}

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <TagPill
              key={tag.id}
              tag={tag}
              onRemove={!disabled ? () => handleRemoveTag(tag.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Search Input */}
      {canAddMore && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                          rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {/* Create new tag option */}
              {canCreateNewTag && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={isCreating}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 
                           flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {isCreating ? 'Creating...' : `Create "${searchQuery.trim()}"`}
                  </span>
                </button>
              )}

              {/* Available tags */}
              {filteredTags.length > 0 ? (
                <div className="py-1">
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleAddTag(tag.id)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                               flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {tag.name}
                        </span>
                        {tag.is_system_tag && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                                        px-2 py-0.5 rounded-full">
                            System
                          </span>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              ) : searchQuery && !canCreateNewTag ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tags found
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Max tags reached message */}
      {!canAddMore && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Maximum {maxTags} tags reached
        </p>
      )}

      {/* Helper text */}
      {canAddMore && !isOpen && selectedTags.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Add tags to categorize this lesson
        </p>
      )}
    </div>
  );
}

// ============================================================================
// TAG PILL COMPONENT
// ============================================================================

interface TagPillProps {
  tag: LessonTag;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function TagPill({
  tag,
  onRemove,
  size = 'md',
  showIcon = false,
  className = ''
}: TagPillProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <span 
      className={`
        inline-flex items-center space-x-1.5 rounded-full font-medium
        ${sizeClasses[size]} ${className}
      `}
      style={{ 
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        border: `1px solid ${tag.color}40`
      }}
    >
      {showIcon && tag.icon && (
        <span className="text-sm">{tag.icon}</span>
      )}
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ============================================================================
// TAG FILTER COMPONENT
// ============================================================================

interface TagFilterProps {
  availableTags: LessonTag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  label?: string;
  allowMultiple?: boolean;
}

export function TagFilter({
  availableTags,
  selectedTagIds,
  onChange,
  label = 'Filter by Tags',
  allowMultiple = true
}: TagFilterProps) {
  const handleToggle = (tagId: string) => {
    if (!allowMultiple) {
      onChange([tagId]);
      return;
    }

    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Label and Clear Button */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {selectedTagIds.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.id)}
              className={`
                inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200
                ${isSelected ? 'ring-2 ring-offset-1 dark:ring-offset-gray-900' : ''}
              `}
              style={{
                backgroundColor: isSelected ? `${tag.color}30` : '#f3f4f6',
                color: isSelected ? tag.color : '#6b7280',
                borderColor: isSelected ? tag.color : 'transparent',
                borderWidth: '1px',
                ringColor: isSelected ? tag.color : 'transparent'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAG MANAGEMENT COMPONENT (for admin/settings)
// ============================================================================

interface TagManagementProps {
  tags: LessonTag[];
  onCreateTag: (tagData: CreateTagData) => Promise<void>;
  onUpdateTag: (tagId: string, tagData: Partial<CreateTagData>) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
}

export function TagManagement({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag
}: TagManagementProps) {
  // Implementation for tag CRUD operations
  // This would be a more complex component for managing all tags
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Manage Tags
      </h3>
      {/* Tag management UI would go here */}
    </div>
  );
}