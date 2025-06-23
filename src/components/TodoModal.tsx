'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/types';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todoData: {
    taskName: string;
    status: 'ToDo' | 'InProgress' | 'Completed';
    priority: 'High' | 'Medium' | 'Low';
  }) => Promise<void>;
  todo?: Todo | null;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export default function TodoModal({ 
  isOpen, 
  onClose, 
  onSave, 
  todo, 
  mode, 
  loading = false 
}: TodoModalProps) {
  const [taskName, setTaskName] = useState('');
  const [status, setStatus] = useState<'ToDo' | 'InProgress' | 'Completed'>('ToDo');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Initialize form with todo data when editing
  useEffect(() => {
    if (mode === 'edit' && todo) {
      setTaskName(todo.taskName);
      setStatus(todo.status);
      setPriority(todo.priority);
    } else if (mode === 'create') {
      setTaskName('');
      setStatus('ToDo');
      setPriority('Medium');
    }
  }, [mode, todo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      await onSave({
        taskName: taskName.trim(),
        status,
        priority,
      });
      
      // Reset form for create mode
      if (mode === 'create') {
        setTaskName('');
        setStatus('ToDo');
        setPriority('Medium');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setTaskName('');
      setStatus('ToDo');
      setPriority('Medium');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#D52121]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Task Details' : 'Edit Task'}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Task Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121] text-gray-900 placeholder-gray-400"
              autoFocus
              disabled={loading}
              required
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ToDo' | 'InProgress' | 'Completed')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121] text-gray-900 appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="ToDo">To Do</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D52121] focus:border-[#D52121] text-gray-900 appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !taskName.trim()}
              className="bg-[#D52121] hover:bg-[#B91C1C] disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
