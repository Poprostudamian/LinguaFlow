// DODAJ TO DO src/components/DebugInvitations.tsx

import React, { useState } from 'react';
import { Bug, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { debugGetAllInvitations, generateInvitationLink, RelationshipInvitation } from '../lib/supabase';

export function DebugInvitations() {
  const [invitations, setInvitations] = useState<RelationshipInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await debugGetAllInvitations();
      setInvitations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openInvitationLink = (invitation: RelationshipInvitation) => {
    const link = generateInvitationLink(invitation);
    window.open(link, '_blank');
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bug className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
          Debug: Check Database Invitations
        </h3>
      </div>
      
      <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
        Since email sending is not configured, use this to check if invitations were saved to database.
      </p>

      <button
        onClick={handleCheck}
        disabled={isLoading}
        className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Checking...' : 'Check Database'}</span>
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Found {invitations.length} invitation(s):
          </h4>
          
          {invitations.map((invitation, index) => (
            <div key={invitation.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  #{index + 1}: {invitation.student_email}
                </h5>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invitation.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Created:</strong> {new Date(invitation.invited_at).toLocaleString()}</p>
                <p><strong>Expires:</strong> {new Date(invitation.expires_at).toLocaleString()}</p>
                {invitation.message && <p><strong>Message:</strong> {invitation.message}</p>}
              </div>

              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => copyToClipboard(invitation.invitation_token)}
                  className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy Token</span>
                </button>
                
                <button
                  onClick={() => openInvitationLink(invitation)}
                  className="flex items-center space-x-1 text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Mock Link</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && invitations.length === 0 && !error && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No invitations found. Try sending one first.
          </p>
        </div>
      )}
    </div>
  );
}