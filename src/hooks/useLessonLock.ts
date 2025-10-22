// src/hooks/useLessonLock.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  checkLessonLockStatus, 
  getLessonEditPermissions 
} from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface LessonLockStatus {
  /** Whether the lesson is locked from editing */
  isLocked: boolean;
  
  /** Reason for the lock */
  lockReason?: 'all_students_completed' | 'other';
  
  /** Whether the user can edit this lesson */
  canEdit: boolean;
  
  /** Whether the user can delete this lesson */
  canDelete: boolean;
  
  /** Whether the user can assign new students */
  canAssignStudents: boolean;
  
  /** Whether the user can unassign students */
  canUnassignStudents: boolean;
  
  /** Total number of assigned students */
  totalAssigned: number;
  
  /** Total number of completed students */
  totalCompleted: number;
  
  /** Completion rate percentage (0-100) */
  completionRate: number;
  
  /** Human-readable reason for denied permission */
  permissionDeniedReason?: string;
}

export interface UseLessonLockOptions {
  /** Whether to automatically fetch on mount */
  autoFetch?: boolean;
  
  /** Polling interval in milliseconds (0 = disabled) */
  pollInterval?: number;
  
  /** Callback when lock status changes */
  onLockStatusChange?: (status: LessonLockStatus) => void;
  
  /** Whether to cache results */
  enableCache?: boolean;
  
  /** Cache duration in milliseconds */
  cacheDuration?: number;
}

export interface UseLessonLockReturn {
  /** Current lock status */
  status: LessonLockStatus | null;
  
  /** Whether data is currently loading */
  isLoading: boolean;
  
  /** Error if fetch failed */
  error: string | null;
  
  /** Manually refresh the lock status */
  refresh: () => Promise<void>;
  
  /** Check if a specific action is allowed */
  checkPermission: (action: 'edit' | 'delete' | 'assign' | 'unassign') => boolean;
  
  /** Get human-readable message for denied action */
  getDeniedMessage: (action: 'edit' | 'delete' | 'assign' | 'unassign') => string;
  
  /** Helper: Is lesson completely locked? */
  isFullyLocked: boolean;
  
  /** Helper: Is lesson partially completed? */
  isPartiallyCompleted: boolean;
  
  /** Helper: Lock status for badge component */
  lockStatusForBadge: 'locked' | 'unlocked' | 'partial';
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry {
  status: LessonLockStatus;
  timestamp: number;
}

const lockStatusCache = new Map<string, CacheEntry>();

function getCachedStatus(lessonId: string, cacheDuration: number): LessonLockStatus | null {
  const cached = lockStatusCache.get(lessonId);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cacheDuration) {
    lockStatusCache.delete(lessonId);
    return null;
  }
  
  return cached.status;
}

function setCachedStatus(lessonId: string, status: LessonLockStatus): void {
  lockStatusCache.set(lessonId, {
    status,
    timestamp: Date.now()
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useLessonLock(
  lessonId: string | undefined,
  options: UseLessonLockOptions = {}
): UseLessonLockReturn {
  const {
    autoFetch = true,
    pollInterval = 0,
    onLockStatusChange,
    enableCache = true,
    cacheDuration = 30000 // 30 seconds default cache
  } = options;

  const { session } = useAuth();
  const [status, setStatus] = useState<LessonLockStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<LessonLockStatus | null>(null);

  // ============================================================================
  // FETCH LOCK STATUS
  // ============================================================================

  const fetchLockStatus = useCallback(async () => {
    if (!lessonId) {
      setStatus(null);
      setError(null);
      return;
    }

    // Check cache first
    if (enableCache) {
      const cached = getCachedStatus(lessonId, cacheDuration);
      if (cached) {
        setStatus(cached);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch lock status
      const lockStatus = await checkLessonLockStatus(lessonId);

      // Fetch permissions if user is authenticated
      let permissions = {
        canEdit: lockStatus.canEdit,
        canDelete: lockStatus.canDelete,
        canAssignStudents: !lockStatus.isLocked,
        canUnassignStudents: true,
        permissionDeniedReason: undefined as string | undefined
      };

      if (session?.user?.id) {
        const perms = await getLessonEditPermissions(lessonId, session.user.id);
        permissions = {
          canEdit: perms.canEdit,
          canDelete: perms.canDelete,
          canAssignStudents: perms.canAssignStudents ?? !lockStatus.isLocked,
          canUnassignStudents: perms.canUnassignStudents ?? true,
          permissionDeniedReason: perms.reason
        };
      }

      const newStatus: LessonLockStatus = {
        isLocked: lockStatus.isLocked,
        lockReason: lockStatus.lockReason,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
        canAssignStudents: permissions.canAssignStudents,
        canUnassignStudents: permissions.canUnassignStudents,
        totalAssigned: lockStatus.totalAssigned,
        totalCompleted: lockStatus.totalCompleted,
        completionRate: lockStatus.completionRate,
        permissionDeniedReason: permissions.permissionDeniedReason
      };

      // Cache the result
      if (enableCache) {
        setCachedStatus(lessonId, newStatus);
      }

      // Check if status changed
      if (
        previousStatusRef.current &&
        previousStatusRef.current.isLocked !== newStatus.isLocked
      ) {
        onLockStatusChange?.(newStatus);
      }

      previousStatusRef.current = newStatus;
      setStatus(newStatus);
    } catch (err: any) {
      console.error('Error fetching lesson lock status:', err);
      setError(err.message || 'Failed to fetch lesson lock status');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, session?.user?.id, enableCache, cacheDuration, onLockStatusChange]);

  // ============================================================================
  // AUTO-FETCH ON MOUNT
  // ============================================================================

  useEffect(() => {
    if (autoFetch && lessonId) {
      fetchLockStatus();
    }
  }, [autoFetch, lessonId, fetchLockStatus]);

  // ============================================================================
  // POLLING
  // ============================================================================

  useEffect(() => {
    if (pollInterval > 0 && lessonId) {
      pollIntervalRef.current = setInterval(() => {
        fetchLockStatus();
      }, pollInterval);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [pollInterval, lessonId, fetchLockStatus]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const checkPermission = useCallback(
    (action: 'edit' | 'delete' | 'assign' | 'unassign'): boolean => {
      if (!status) return false;

      switch (action) {
        case 'edit':
          return status.canEdit;
        case 'delete':
          return status.canDelete;
        case 'assign':
          return status.canAssignStudents;
        case 'unassign':
          return status.canUnassignStudents;
        default:
          return false;
      }
    },
    [status]
  );

  const getDeniedMessage = useCallback(
    (action: 'edit' | 'delete' | 'assign' | 'unassign'): string => {
      if (!status) return 'Unable to check permissions';

      if (checkPermission(action)) {
        return ''; // Action is allowed
      }

      // Custom denied reason from API
      if (status.permissionDeniedReason) {
        return status.permissionDeniedReason;
      }

      // Default messages based on lock status
      if (status.isLocked) {
        switch (action) {
          case 'edit':
            return `Cannot edit: All ${status.totalAssigned} students have completed this lesson. Unassign a student to unlock.`;
          case 'delete':
            return `Cannot delete: Lesson has completed assignments. Unassign students first.`;
          case 'assign':
            return `Cannot assign new students: Lesson is locked. Unassign a student to unlock.`;
          case 'unassign':
            return 'You can unassign students to unlock the lesson.';
          default:
            return 'Action not allowed';
        }
      }

      return 'Action not allowed';
    },
    [status, checkPermission]
  );

  // Computed properties
  const isFullyLocked = status?.isLocked === true;
  const isPartiallyCompleted =
    status !== null &&
    status.totalAssigned > 0 &&
    status.totalCompleted > 0 &&
    status.totalCompleted < status.totalAssigned;

  const lockStatusForBadge: 'locked' | 'unlocked' | 'partial' =
    status === null
      ? 'unlocked'
      : status.isLocked
        ? 'locked'
        : isPartiallyCompleted
          ? 'partial'
          : 'unlocked';

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    status,
    isLoading,
    error,
    refresh: fetchLockStatus,
    checkPermission,
    getDeniedMessage,
    isFullyLocked,
    isPartiallyCompleted,
    lockStatusForBadge
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Simplified hook that only returns lock status (no permissions)
 */
export function useLessonLockStatus(lessonId: string | undefined) {
  const { status, isLoading, error, refresh } = useLessonLock(lessonId, {
    autoFetch: true,
    enableCache: true
  });

  return {
    isLocked: status?.isLocked ?? false,
    totalAssigned: status?.totalAssigned ?? 0,
    totalCompleted: status?.totalCompleted ?? 0,
    completionRate: status?.completionRate ?? 0,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook for checking if specific actions are allowed
 */
export function useLessonPermissions(lessonId: string | undefined) {
  const { checkPermission, getDeniedMessage, status, isLoading } = useLessonLock(lessonId);

  return {
    canEdit: checkPermission('edit'),
    canDelete: checkPermission('delete'),
    canAssign: checkPermission('assign'),
    canUnassign: checkPermission('unassign'),
    getDeniedMessage,
    isLoading,
    status
  };
}