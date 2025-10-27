// ============================================================================
// EXERCISE IMAGE UPLOADER COMPONENT
// ============================================================================
// Upload and manage images for individual exercises
// File: src/components/ExerciseImageUploader.tsx
// ============================================================================

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ExerciseImage, PendingExerciseImage } from '../types/lesson.types';

interface ExerciseImageUploaderProps {
  exerciseId?: string; // Optional for new exercises (will be set after creation)
  tutorId: string;
  existingImages?: ExerciseImage[];
  onImagesChange: (images: PendingExerciseImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  className?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export function ExerciseImageUploader({
  exerciseId,
  tutorId,
  existingImages = [],
  onImagesChange,
  disabled = false,
  maxImages = 3,
  maxFileSize = MAX_FILE_SIZE,
  className = ''
}: ExerciseImageUploaderProps) {
  const [pendingImages, setPendingImages] = useState<PendingExerciseImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + pendingImages.length;
  const canAddMore = totalImages < maxImages;

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'
      };
    }

    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`
      };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || !canAddMore) return;

    setUploadError('');
    const newPendingImages: PendingExerciseImage[] = [];

    Array.from(files).forEach((file, index) => {
      if (totalImages + newPendingImages.length >= maxImages) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      newPendingImages.push({
        id: `temp-${Date.now()}-${index}`,
        file,
        preview,
        uploading: false,
        uploaded: false
      });
    });

    if (newPendingImages.length > 0) {
      const updated = [...pendingImages, ...newPendingImages];
      setPendingImages(updated);
      onImagesChange(updated);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || !canAddMore) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Remove pending image
  const handleRemovePending = (imageId: string) => {
    const updated = pendingImages.filter(img => img.id !== imageId);
    
    // Revoke object URL to prevent memory leaks
    const removedImage = pendingImages.find(img => img.id === imageId);
    if (removedImage?.preview) {
      URL.revokeObjectURL(removedImage.preview);
    }

    setPendingImages(updated);
    onImagesChange(updated);
  };

  // Upload image to Supabase
  const uploadImage = async (pendingImage: PendingExerciseImage): Promise<ExerciseImage | null> => {
    if (!exerciseId) {
      console.error('Cannot upload image: exerciseId is required');
      return null;
    }

    try {
      const fileExt = pendingImage.file.name.split('.').pop();
      const fileName = `${tutorId}/${exerciseId}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(filePath, pendingImage.file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(filePath);

      // Create database record
      const { data: imageRecord, error: dbError } = await supabase
        .from('exercise_images')
        .insert({
          exercise_id: exerciseId,
          tutor_id: tutorId,
          file_name: pendingImage.file.name,
          file_size: pendingImage.file.size,
          mime_type: pendingImage.file.type,
          storage_path: publicUrl,
          alt_text: pendingImage.alt_text || '',
          caption: pendingImage.caption || '',
          display_order: existingImages.length + pendingImages.indexOf(pendingImage)
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return imageRecord;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Upload all pending images
  const uploadAllImages = async (): Promise<ExerciseImage[]> => {
    const uploadPromises = pendingImages.map(img => uploadImage(img));
    const results = await Promise.all(uploadPromises);
    return results.filter((img): img is ExerciseImage => img !== null);
  };

  // Update alt text
  const updateAltText = (imageId: string, altText: string) => {
    const updated = pendingImages.map(img =>
      img.id === imageId ? { ...img, alt_text: altText } : img
    );
    setPendingImages(updated);
    onImagesChange(updated);
  };

  // Update caption
  const updateCaption = (imageId: string, caption: string) => {
    const updated = pendingImages.map(img =>
      img.id === imageId ? { ...img, caption: caption } : img
    );
    setPendingImages(updated);
    onImagesChange(updated);
  };

  return (
    <div className={className}>
      {/* Label and Info */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Exercise Images (Optional)</span>
          </div>
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {totalImages} / {maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />

          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Drag & Drop images here or click to browse
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPG, PNG, GIF, WEBP • Max {Math.round(maxFileSize / 1024 / 1024)}MB per image
          </p>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Images
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {existingImages.map((image) => (
              <ExistingImageCard key={image.id} image={image} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Images */}
      {pendingImages.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pending Upload {!exerciseId && '(will upload after saving exercise)'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingImages.map((image) => (
              <PendingImageCard
                key={image.id}
                image={image}
                onRemove={() => handleRemovePending(image.id)}
                onUpdateAltText={(alt) => updateAltText(image.id, alt)}
                onUpdateCaption={(caption) => updateCaption(image.id, caption)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Add images to help students better understand the exercise
      </p>
    </div>
  );
}

// ============================================================================
// EXISTING IMAGE CARD
// ============================================================================

interface ExistingImageCardProps {
  image: ExerciseImage;
}

function ExistingImageCard({ image }: ExistingImageCardProps) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <img
        src={image.storage_path}
        alt={image.alt_text || image.file_name}
        className="w-full h-32 object-cover"
      />
      <div className="p-2 bg-white dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {image.file_name}
        </p>
        {image.caption && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {image.caption}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {(image.file_size / 1024).toFixed(1)} KB
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PENDING IMAGE CARD
// ============================================================================

interface PendingImageCardProps {
  image: PendingExerciseImage;
  onRemove: () => void;
  onUpdateAltText: (alt: string) => void;
  onUpdateCaption: (caption: string) => void;
}

function PendingImageCard({ image, onRemove, onUpdateAltText, onUpdateCaption }: PendingImageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative group rounded-lg overflow-hidden border-2 border-dashed border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10">
      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full 
                 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Uploading Overlay */}
      {image.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <Loader className="h-6 w-6 text-white animate-spin" />
        </div>
      )}

      {/* Image Preview */}
      <img
        src={image.preview}
        alt={image.alt_text || 'Preview'}
        className="w-full h-32 object-cover"
      />

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {image.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {(image.file.size / 1024).toFixed(1)} KB
        </p>

        {/* Expand for metadata */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 mt-1"
        >
          {isExpanded ? 'Hide details' : 'Add details'}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Alt text (for accessibility)"
              value={image.alt_text || ''}
              onChange={(e) => onUpdateAltText(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={image.caption || ''}
              onChange={(e) => onUpdateCaption(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function uploadExerciseImages(
  exerciseId: string,
  tutorId: string,
  pendingImages: PendingExerciseImage[]
): Promise<ExerciseImage[]> {
  const uploader = new ExerciseImageUploader({
    exerciseId,
    tutorId,
    existingImages: [],
    onImagesChange: () => {}
  });

  // This would need to be refactored to make uploadAllImages accessible
  // For now, this is a placeholder showing the pattern
  return [];
}