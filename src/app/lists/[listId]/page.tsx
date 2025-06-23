'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Todo, List } from '@/types';
import { useListStore, useTodoStore, useUIStore } from '@/store';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import TodoModal from '@/components/TodoModal';
import ShareModal from '@/components/ShareModal';
import { listAPI } from '@/lib/api';

export default function TodosPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  
  // Modal states
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTodoData, setEditingTodoData] = useState<Todo | null>(null);

  // Zustand stores
  const { lists, updateListTaskCount } = useListStore();
  const { 
    todos, 
    loading, 
    fetchTodos, 
    createTodo, 
    updateTodo, 
    deleteTodo,
    toggleComplete,
    clearTodos,
    addTodoLocal,
    updateTodoLocal,
    deleteTodoLocal
  } = useTodoStore();
  
  const { 
    showCreateTodoForm, 
    creatingTodo, 
    setShowCreateTodoForm, 
    setCreatingTodo,
    setEditingTodo,
    resetUIState 
  } = useUIStore();

  // Socket for real-time functionality
  const {
    joinList,
    leaveList,
    emitTodoAdded,
    emitTodoUpdated,
    emitTodoDeleted,
    onTodoAdded,
    onTodoUpdated,
    onTodoDeleted
  } = useSocket();

  // Get current list from lists store
  const list = lists.find((l: List) => l._id === listId) || null;

  // Check user permission for this list
  const userPermission = useMemo(() => {
    if (!list || !isSignedIn) return null;
    
    // If user is owner, they have edit permission
    // For now, we'll assume all users have edit permission
    // This should be enhanced to check actual permissions from the API
    return 'Edit';
  }, [list, isSignedIn]);

  const canEdit = userPermission === 'Edit';

  const fetchData = useCallback(async () => {
    if (!listId) return;
    
    try {
      await fetchTodos(listId);
      
      // If we don't have this list in our store, redirect to dashboard
      const currentList = lists.find((l: List) => l._id === listId);
      if (lists.length > 0 && !currentList) {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [listId, fetchTodos, lists, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (isSignedIn && listId) {
      fetchData();
      
      // Join the socket room for this list
      joinList(listId);
      
      // Set up socket event listeners
      onTodoAdded((todo) => {
        addTodoLocal(todo);
        updateListTaskCount(listId, 1);
      });
      
      onTodoUpdated((todo) => {
        updateTodoLocal(todo);
      });
      
      onTodoDeleted(({ todoId }) => {
        deleteTodoLocal(todoId);
        updateListTaskCount(listId, -1);
      });
    }

    // Cleanup function
    return () => {
      if (listId) {
        leaveList(listId);
      }
    };
  }, [isSignedIn, isLoaded, listId, router, fetchData, joinList, leaveList, onTodoAdded, onTodoUpdated, onTodoDeleted, addTodoLocal, updateTodoLocal, deleteTodoLocal, updateListTaskCount]);

  useEffect(() => {
    // Clear todos when user signs out
    if (isLoaded && !isSignedIn) {
      clearTodos();
      resetUIState();
    }
  }, [isSignedIn, isLoaded, clearTodos, resetUIState]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    setCreatingTodo(true);
    try {
      const newTodo = await createTodo(listId, {
        taskName: newTaskName.trim(),
        priority: newTaskPriority,
      });
      setNewTaskName('');
      setNewTaskPriority('Medium');
      setShowCreateTodoForm(false);
      
      // Update list task count
      updateListTaskCount(listId, 1);
      
      // Emit socket event
      emitTodoAdded(newTodo);
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setCreatingTodo(false);
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingTodoData(null);
    setShowTodoModal(true);
  };

  const handleOpenEditModal = (todo: Todo) => {
    setModalMode('edit');
    setEditingTodoData(todo);
    setShowTodoModal(true);
  };

  const handleCloseModal = () => {
    setShowTodoModal(false);
    setEditingTodoData(null);
  };

  const handleModalSave = async (todoData: {
    taskName: string;
    status: 'ToDo' | 'InProgress' | 'Completed';
    priority: 'High' | 'Medium' | 'Low';
  }) => {
    if (modalMode === 'create') {
      const newTodo = await createTodo(listId, {
        taskName: todoData.taskName,
        priority: todoData.priority,
        status: todoData.status,
      });
      
      // Update list task count
      updateListTaskCount(listId, 1);
      
      // Emit socket event
      emitTodoAdded(newTodo);
    } else if (modalMode === 'edit' && editingTodoData) {
      await updateTodo(listId, editingTodoData._id, {
        taskName: todoData.taskName,
        status: todoData.status,
        priority: todoData.priority,
        type: todoData.status === 'Completed'
      });
      
      // Emit socket event
      const updatedTodo: Todo = { 
        ...editingTodoData, 
        taskName: todoData.taskName,
        status: todoData.status,
        priority: todoData.priority,
        type: todoData.status === 'Completed'
      };
      emitTodoUpdated(updatedTodo);
      
      // Clear editing state
      setEditingTodo(null);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await toggleComplete(listId, todo);
      
      // Get the updated todo and emit socket event
      const updatedTodo: Todo = { 
        ...todo, 
        type: !todo.type, 
        status: (!todo.type ? 'Completed' : 'ToDo') as 'ToDo' | 'InProgress' | 'Completed'
      };
      emitTodoUpdated(updatedTodo);
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      await deleteTodo(listId, todoId);
      
      // Update list task count
      updateListTaskCount(listId, -1);
      
      // Emit socket event
      emitTodoDeleted(todoId, listId);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Share handlers
  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const handleShareList = async (email: string, permission: 'Edit' | 'View') => {
    if (!list) return;
    await listAPI.share(list._id, email, permission);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ToDo': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'InProgress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Todo Logo"
                  width={120}
                  height={48}
                  className="w-auto h-12"
                  priority
                />
              </div>
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded max-w-[920px]"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Todo Logo"
                  width={120}
                  height={48}
                  className="w-auto h-12"
                  priority
                />
              </div>
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">List not found</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-[#D52121] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-[8px] font-medium transition-colors"
            >
              Back
            </button>
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
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Todo Logo"
                width={120}
                height={48}
                className="w-auto h-12"
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div>
            <div className="flex items-center justify-between mb-10">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 flex items-center font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Not Shared</span>
                <button
                  onClick={handleShareClick}
                  className="bg-[#D52121] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{list.name}</h1>
                <p className="text-gray-600 text-sm">
                  {list.taskCount} {list.taskCount === 1 ? 'task' : 'tasks'} • Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
                </p>
              </div>
              
              <button
                onClick={handleOpenCreateModal}
                disabled={!canEdit}
                className={`font-medium flex items-center transition-colors ${
                  canEdit 
                    ? 'text-[#D52121] hover:text-[#B91C1C]' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                + Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Create Todo Form */}
        {showCreateTodoForm && (
          <div className="mb-6 bg-[#FAFAFA] rounded-lg shadow p-6 max-w-[920px]">
            <form onSubmit={handleCreateTodo}>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121]"
                  autoFocus
                  disabled={creatingTodo}
                />
                <div className="flex items-center space-x-4">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121]"
                    disabled={creatingTodo}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <button
                    type="submit"
                    disabled={creatingTodo || !newTaskName.trim()}
                    className="bg-[#D52121] hover:bg-[#B91C1C] disabled:bg-gray-400 text-white px-4 py-2 rounded-[8px] font-medium transition-colors"
                  >
                    {creatingTodo ? 'Creating...' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTodoForm(false);
                      setNewTaskName('');
                      setNewTaskPriority('Medium');
                    }}
                    className="text-gray-400 hover:text-red-500 p-2 rounded transition-colors"
                    title="Cancel"
                  >
                    <Image
                      src="/dashboard/delete.svg"
                      alt="Cancel"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Todo Modal */}
        <TodoModal
          isOpen={showTodoModal}
          onClose={handleCloseModal}
          onSave={handleModalSave}
          todo={editingTodoData}
          mode={modalMode}
          loading={creatingTodo}
        />

        {/* Share Modal */}
        <ShareModal
          list={list}
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          onShare={handleShareList}
        />

        {/* Todos Table */}
        <div className="bg-white rounded-lg overflow-hidden max-w-[920px]">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-12 border-r border-gray-200">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 border-r border-gray-200">Task Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-32 border-r border-gray-200">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-48 border-r border-gray-200">Created on</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-32 border-r border-gray-200">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                    No tasks yet. Click &quot;Add Task&quot; to create your first task.
                  </td>
                </tr>
              ) : (
                todos.map((todo: Todo) => (
                  <tr
                    key={todo._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      todo.type ? 'opacity-75' : ''
                    }`}
                  >
                    {/* Type Column - Checkbox */}
                    <td className="py-4 px-4 border-r border-gray-100">
                      <input
                        type="checkbox"
                        checked={todo.type}
                        onChange={() => canEdit && handleToggleComplete(todo)}
                        disabled={!canEdit}
                        className={`w-4 h-4 border-gray-300 rounded focus:ring-2 ${
                          canEdit 
                            ? 'text-[#D52121] focus:ring-[#D52121] cursor-pointer' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      />
                    </td>

                    {/* Task Name Column */}
                    <td className="py-4 px-4 border-r border-gray-100">
                      <span
                        className={`font-medium ${
                          todo.type ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {todo.taskName}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-4 border-r border-gray-100">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(todo.status)}`}>
                        {todo.status === 'ToDo' ? 'To Do' : todo.status === 'InProgress' ? 'In Progress' : 'Completed'}
                      </span>
                    </td>

                    {/* Created on Column */}
                    <td className="py-4 px-4 text-sm text-gray-600 border-r border-gray-100">
                      {new Date(todo.createdAt).toLocaleString('en-GB', {
                        hour12: false,
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Priority Column */}
                    <td className="py-4 px-4 border-r border-gray-100">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                        {todo.priority}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-4">
                      {canEdit ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(todo)}
                            className="text-gray-400 hover:text-blue-500 p-1 rounded transition-colors"
                            title="Edit task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Delete task"
                          >
                            <Image
                              src="/dashboard/delete.svg"
                              alt="Delete"
                              width={16}
                              height={16}
                            />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-300 text-xs">View Only</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Todo Modal */}
      <TodoModal
        isOpen={showTodoModal}
        onClose={handleCloseModal}
        onSave={handleModalSave}
        todo={editingTodoData}
        mode={modalMode}
        loading={creatingTodo}
      />

      {/* Share Modal */}
      {list && (
        <ShareModal
          list={list}
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          onShare={handleShareList}
        />
      )}
    </div>
  );
}
