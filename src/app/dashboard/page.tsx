'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { List } from '@/types';
import { useListStore, useUIStore } from '@/store';
import { format } from 'date-fns';
import DeleteListModal from '@/components/DeleteListModal';
import CircularProgress from '@/components/CircularProgress';
import SharedUserAvatars from '@/components/SharedUserAvatars';
import Image from 'next/image';

export default function ListsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [newListName, setNewListName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  
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

  const handleDeleteList = async (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setListToDelete(list);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!listToDelete) return;

    try {
      await deleteList(listToDelete._id);
      setDeleteModalOpen(false);
      setListToDelete(null);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setListToDelete(null);
  };

  const handleListClick = (listId: string) => {
    router.push(`/lists/${listId}`);
  };

  if (!isLoaded || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Todo Logo"
                width={120}
                height={48}
                className="w-auto h-8 sm:h-12"
                priority
              />
            </div>
            
            {/* Profile Component */}
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your To Do Lists</h1>
        </div>

        {/* Create List Form */}
        {showCreateListForm && (
          <div className="mb-6 bg-[#FAFAFA] rounded-lg shadow p-4 sm:p-6 w-full max-w-[920px] min-h-[94px] flex items-center">
            <form onSubmit={handleCreateList} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121]"
                autoFocus
                disabled={creatingList}
              />
              <button
                type="button"
                onClick={() => {
                  setShowCreateListForm(false);
                  setNewListName('');
                }}
                className="text-gray-400 hover:text-red-500 p-2 rounded transition-colors flex-shrink-0 self-center sm:self-auto"
                title="Cancel"
              >
                <Image
                  src="/dashboard/delete.svg"
                  alt="Cancel"
                  width={20}
                  height={20}
                />
              </button>
            </form>
          </div>
        )}

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="text-center">
            <div className="w-full max-w-[920px] h-auto sm:h-[557px] mx-auto bg-[#FAFAFA] rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center">
              <div className="mb-4 sm:mb-6">
                <Image
                  src="/dashboard/ftue.png"
                  alt="No lists illustration"
                  width={200}
                  height={150}
                  className="mx-auto w-auto h-32 sm:h-auto"
                />
              </div>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Create your first list and become more productive</p>
              <button
                onClick={() => setShowCreateListForm(true)}
                className="bg-[#D52121] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-[8px] font-medium transition-colors text-base sm:text-lg"
              >
                Add List
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list: List) => (
              <div
                key={list._id}
                className="bg-[#FAFAFA] rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 cursor-pointer w-full max-w-[920px] min-h-[94px] flex items-center"
                onClick={() => handleListClick(list._id)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1 w-full">
                  {/* Circular Progress and List Info */}
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex-shrink-0">
                      <CircularProgress 
                        completed={list.completedTaskCount || 0} 
                        total={list.taskCount || 0}
                        size={40}
                        strokeWidth={3}
                      />
                    </div>

                    {/* List Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate mb-1">
                        {list.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                        <span className="truncate">
                          {format(new Date(list.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          {list.taskCount === 0 
                            ? '0 tasks added' 
                            : `${list.taskCount} ${list.taskCount === 1 ? 'task' : 'tasks'} added`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shared User Avatars and Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 w-full sm:w-auto">
                    {/* Shared User Avatars */}
                    {list.sharedWith && list.sharedWith.length > 0 && (
                      <div className="flex-shrink-0">
                        <SharedUserAvatars sharedWith={list.sharedWith} maxAvatars={2} size="sm" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDeleteList(list, e)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded transition-colors"
                        title="Delete list"
                      >
                        <Image
                          src="/dashboard/delete.svg"
                          alt="Delete"
                          width={18}
                          height={18}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New List Button */}
            <button
              onClick={() => setShowCreateListForm(true)}
              className="w-full max-w-[920px] h-[40px] bg-[#FAFAFA] rounded-lg flex items-center justify-center text-gray-600 hover:text-[#D52121] transition-colors font-medium text-sm sm:text-base"
            >
              + Add another List
            </button>
          </div>
        )}

        {/* Delete List Modal */}
        {listToDelete && (
          <DeleteListModal
            isOpen={deleteModalOpen}
            listName={listToDelete.name}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}
