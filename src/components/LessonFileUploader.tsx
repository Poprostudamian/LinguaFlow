// src/components/LessonFileUploader.tsx
// Component for uploading images and PDFs to lessons

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf';
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  storageUrl?: string;
}

interface LessonFileUploaderProps {
  lessonId?: string; // Optional for new lessons (will be set after creation)
  tutorId: string;
  existingAttachments?: AttachmentFile[];
  onFilesChange: (files: AttachmentFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_PDF_TYPE = 'application/pdf';
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPE];

// ============================================================================
// COMPONENT
// ============================================================================

export function LessonFileUploader({
  lessonId,
  tutorId,
  existingAttachments = [],
  onFilesChange,
  disabled = false,
  maxFiles = 5
}: LessonFileUploaderProps) {
  const [files, setFiles] = useState<AttachmentFile[]>(existingAttachments);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Only JPG, PNG, GIF, WEBP, and PDF are allowed.' 
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` 
      };
    }

    // Check max files
    if (files.length >= maxFiles) {
      return { 
        valid: false, 
        error: `Maximum ${maxFiles} files allowed.` 
      };
    }

    return { valid: true };
  };

  // Create preview for images
  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Handle file selection
  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: AttachmentFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      const preview = await createPreview(file);
      const fileType = ACCEPTED_IMAGE_TYPES.includes(file.type) ? 'image' : 'pdf';

      newFiles.push({
        id: `temp-${Date.now()}-${i}`,
        file,
        preview,
        type: fileType,
        uploading: false,
        uploaded: false
      });
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  // Upload file to Supabase Storage
  const uploadFile = async (attachmentFile: AttachmentFile): Promise<AttachmentFile> => {
    if (!lessonId) {
      return {
        ...attachmentFile,
        error: 'Lesson ID not available. Save lesson first.'
      };
    }

    try {
      const fileExt = attachmentFile.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${tutorId}/${lessonId}/${fileName}`;

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from('lesson-attachments')
        .upload(filePath, attachmentFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lesson-attachments')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from('lesson_attachments')
        .insert({
          lesson_id: lessonId,
          tutor_id: tutorId,
          file_name: attachmentFile.file.name,
          file_type: attachmentFile.type,
          file_size: attachmentFile.file.size,
          mime_type: attachmentFile.file.type,
          storage_path: filePath
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        ...attachmentFile,
        id: dbData.id,
        uploading: false,
        uploaded: true,
        storageUrl: publicUrl
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        ...attachmentFile,
        uploading: false,
        uploaded: false,
        error: error.message || 'Upload failed'
      };
    }
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (!lessonId) {
      alert('Please save the lesson first before uploading attachments.');
      return;
    }

    const updatedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.uploaded || file.uploading) return file;
        
        const uploadingFile = { ...file, uploading: true };
        setFiles(prev => prev.map(f => f.id === file.id ? uploadingFile : f));
        
        return await uploadFile(uploadingFile);
      })
    );

    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  // Remove file
  const removeFile = async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (!fileToRemove) return;

    // If already uploaded, delete from storage and database
    if (fileToRemove.uploaded && lessonId) {
      try {
        // Delete from database
        const { error: dbError } = await supabase
          .from('lesson_attachments')
          .delete()
          .eq('id', fileId);

        if (dbError) throw dbError;

        // Delete from storage
        const storagePath = fileToRemove.storageUrl?.split('/lesson-attachments/')[1];
        if (storagePath) {
          const { error: storageError } = await supabase.storage
            .from('lesson-attachments')
            .remove([storagePath]);

          if (storageError) throw storageError;
        }
      } catch (error) {
        console.error('Error removing file:', error);
        alert('Failed to remove file');
        return;
      }
    }

    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Click to select files
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Drag & Drop files here or click to browse
        </p>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Supported: JPG, PNG, GIF, WEBP, PDF (max {MAX_FILE_SIZE / 1024 / 1024}MB each)
        </p>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maximum {maxFiles} files
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({files.length}/{maxFiles})
            </h4>
            
            {lessonId && files.some(f => !f.uploaded && !f.uploading) && (
              <button
                onClick={uploadAllFiles}
                disabled={disabled}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                Upload All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {!lessonId && files.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Files will be uploaded after you save the lesson.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILE PREVIEW COMPONENT
// ============================================================================

interface FilePreviewProps {
  file: AttachmentFile;
  onRemove: () => void;
  disabled: boolean;
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const getFileIcon = () => {
    if (file.type === 'image') {
      return <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
    return <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  const getStatusIcon = () => {
    if (file.uploading) {
      return <Loader className="h-4 w-4 text-gray-400 animate-spin" />;
    }
    if (file.uploaded) {
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    if (file.error) {
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Preview/Icon */}
      {file.preview ? (
        <img
          src={file.preview}
          alt={file.file.name}
          className="h-12 w-12 object-cover rounded"
        />
      ) : (
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          {getFileIcon()}
        </div>
      )}

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {(file.file.size / 1024).toFixed(1)} KB
          {file.error && (
            <span className="text-red-600 dark:text-red-400 ml-2">
              • {file.error}
            </span>
          )}
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        
        {!file.uploading && (
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
            title="Remove"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}