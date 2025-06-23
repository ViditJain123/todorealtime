'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Todo, List } from '@/types';
import { useListStore, useTodoStore, useUIStore } from '@/store';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

export default function TodosPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editTaskName, setEditTaskName] = useState('');

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
    editingTodo,
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
    onTodoDeleted,
    isConnected
  } = useSocket();

  // Get current list from lists store
  const list = lists.find((l: List) => l._id === listId) || null;

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

  const handleStatusChange = async (todo: Todo, newStatus: 'ToDo' | 'InProgress' | 'Completed') => {
    try {
      await updateTodo(listId, todo._id, {
        status: newStatus,
        type: newStatus === 'Completed'
      });
      
      // Emit socket event
      const updatedTodo: Todo = { ...todo, status: newStatus, type: newStatus === 'Completed' };
      emitTodoUpdated(updatedTodo);
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handlePriorityChange = async (todo: Todo, newPriority: 'High' | 'Medium' | 'Low') => {
    try {
      await updateTodo(listId, todo._id, {
        priority: newPriority
      });
      
      // Emit socket event
      const updatedTodo: Todo = { ...todo, priority: newPriority };
      emitTodoUpdated(updatedTodo);
    } catch (error) {
      console.error('Error updating todo priority:', error);
    }
  };

  const handleEditTodo = async (todoId: string, newTaskName: string) => {
    if (!newTaskName.trim()) return;

    try {
      await updateTodo(listId, todoId, {
        taskName: newTaskName.trim()
      });
      
      // Find the todo and emit socket event
      const todo = todos.find(t => t._id === todoId);
      if (todo) {
        const updatedTodo: Todo = { ...todo, taskName: newTaskName.trim() };
        emitTodoUpdated(updatedTodo);
      }
      
      setEditingTodo(null);
      setEditTaskName('');
    } catch (error) {
      console.error('Error editing todo:', error);
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

  if (!list) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">List not found</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Lists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lists
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
            <p className="text-gray-600 mt-2">
              {list.taskCount} {list.taskCount === 1 ? 'task' : 'tasks'} • Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
            </p>
          </div>
          <button
            onClick={() => setShowCreateTodoForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add New Task
          </button>
        </div>
      </div>

      {/* Create Todo Form */}
      {showCreateTodoForm && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateTodo}>
            <div className="space-y-4">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter task name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center space-x-4">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingTodo || !newTaskName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Todos List */}
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">Add your first task to get started with this list.</p>
            <button
              onClick={() => setShowCreateTodoForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Task
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {todos.map((todo: Todo) => (
            <div
              key={todo._id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                todo.type ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Completion Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="radio"
                    checked={todo.type}
                    onChange={() => handleToggleComplete(todo)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-grow">
                  {/* Task Name */}
                  {editingTodo === todo._id ? (
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="text"
                        value={editTaskName}
                        onChange={(e) => setEditTaskName(e.target.value)}
                        className="flex-grow border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditTodo(todo._id, editTaskName)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTodo(null);
                          setEditTaskName('');
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3
                      className={`text-lg font-medium mb-3 ${
                        todo.type ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {todo.taskName}
                    </h3>
                  )}

                  {/* Status and Priority */}
                  <div className="flex items-center space-x-4 mb-3">
                    <select
                      value={todo.status}
                      onChange={(e) => handleStatusChange(todo, e.target.value as 'ToDo' | 'InProgress' | 'Completed')}
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(todo.status)}`}
                    >
                      <option value="ToDo">To Do</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <select
                      value={todo.priority}
                      onChange={(e) => handlePriorityChange(todo, e.target.value as 'High' | 'Medium' | 'Low')}
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Created At */}
                  <p className="text-sm text-gray-500">
                    Created {formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingTodo(todo._id);
                      setEditTaskName(todo.taskName);
                    }}
                    className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                    title="Edit task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo._id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
