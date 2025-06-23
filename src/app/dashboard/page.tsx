'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { List } from '@/types';
import { useListStore, useUIStore } from '@/store';
import { listAPI } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import ShareModal from '@/components/ShareModal';

export default function ListsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [newListName, setNewListName] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  
  // Zustand stores
  const { 
    lists, 
    loading, 
    fetchLists, 
    createList, 
    deleteList,
    clearLists 
  } = useListStore();
  
  const { 
    showCreateListForm, 
    creatingList, 
    setShowCreateListForm, 
    setCreatingList,
    resetUIState 
  } = useUIStore();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (isSignedIn) {
      fetchLists();
    }
  }, [isSignedIn, isLoaded, router, fetchLists]);

  useEffect(() => {
    // Clear lists when user signs out
    if (isLoaded && !isSignedIn) {
      clearLists();
      resetUIState();
    }
  }, [isSignedIn, isLoaded, clearLists, resetUIState]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreatingList(true);
    try {
      await createList({ name: newListName.trim() });
      setNewListName('');
      setShowCreateListForm(false);
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list? All todos in this list will be deleted.')) {
      return;
    }

    try {
      await deleteList(id);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleListClick = (listId: string) => {
    router.push(`/lists/${listId}`);
  };

  const handleShareClick = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedList(list);
    setShareModalOpen(true);
  };

  const handleShareList = async (email: string) => {
    if (!selectedList) return;
    await listAPI.share(selectedList._id, email);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedList(null);
  };

  if (!isLoaded || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
            <p className="text-gray-600 mt-2">
              Organize your tasks into lists
            </p>
          </div>
          <button
            onClick={() => setShowCreateListForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create New List
          </button>
        </div>
      </div>

      {/* Create List Form */}
      {showCreateListForm && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateList}>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={creatingList || !newListName.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {creatingList ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateListForm(false);
                  setNewListName('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first list to organize your tasks.</p>
            <button
              onClick={() => setShowCreateListForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First List
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list: List) => (
            <div
              key={list._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() => handleListClick(list._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                  {list.name}
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => handleShareClick(list, e)}
                    className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                    title="Share list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list._id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    title="Delete list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{list.taskCount} {list.taskCount === 1 ? 'task' : 'tasks'}</span>
                <span>Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}</span>
              </div>
              
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                <span>Open list</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )          )}
        </div>
      )}

      {/* Share Modal */}
      {selectedList && (
        <ShareModal
          list={selectedList}
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          onShare={handleShareList}
        />
      )}
    </div>
  );
}
