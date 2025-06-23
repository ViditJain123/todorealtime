'use client';

import { useState } from 'react';
import { List, SharedUser } from '@/types';

interface ShareModalProps {
  list: List;
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, permission: 'Edit' | 'View') => Promise<void>;
}

export default function ShareModal({ list, isOpen, onClose, onShare }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'Edit' | 'View'>('Edit');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSharing(true);
    setError(null);
    setSuccess(false);

    try {
      await onShare(email.trim(), permission);
      setSuccess(true);
      setEmail('');
      setPermission('Edit');
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to share list');
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPermission('Edit');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  // Get current user email (owner)
  const ownerEmail = 'rupam_s@gmail.com'; // This should come from auth context

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Share List
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 text-green-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">List shared successfully!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value as 'Edit' | 'View')}
                      className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-transparent bg-white min-w-[120px]"
                    >
                      <option value="Edit">Edit</option>
                      <option value="View">View</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSharing || !email.trim()}
                    className="bg-[#D52121] hover:bg-[#B91C1C] disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isSharing ? 'Sharing...' : 'Share'}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </form>

              {/* People with Access Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">People with Access</h4>
                
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {/* Owner */}
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#D52121] rounded-full flex items-center justify-center text-white font-medium">
                        RG
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Rupam Gumber (you)</p>
                        <p className="text-sm text-gray-600">{ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value="Edit"
                        disabled
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 text-sm"
                      >
                        <option value="Edit">Edit</option>
                      </select>
                    </div>
                  </div>

                  {/* Shared Users */}
                  {list.sharedWith && list.sharedWith.length > 0 && list.sharedWith.map((sharedUser: SharedUser, index: number) => {
                    // Safety check for sharedUser and email
                    if (!sharedUser || !sharedUser.email) {
                      return null;
                    }
                    
                    return (
                      <div key={index} className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                            {sharedUser.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sharedUser.email}</p>
                            <p className="text-sm text-gray-600">
                              Shared {sharedUser.addedAt ? new Date(sharedUser.addedAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={sharedUser.permission || 'Edit'}
                            onChange={(e) => {
                              // Handle permission change
                              console.log('Change permission for', sharedUser.email, 'to', e.target.value);
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-transparent"
                          >
                            <option value="Edit">Edit</option>
                            <option value="View">View</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {/* No shared users message */}
                  {(!list.sharedWith || list.sharedWith.length === 0) && (
                    <div className="py-4 text-center text-gray-500 text-sm">
                      No one else has access to this list yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
