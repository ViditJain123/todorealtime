import { create } from 'zustand';
import { List } from '@/types';
import { listAPI } from '@/lib/api';

interface ListState {
  lists: List[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchLists: () => Promise<void>;
  createList: (data: { name: string }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  updateListTaskCount: (listId: string, increment: number) => void;
  clearLists: () => void;
  setError: (error: string | null) => void;
}

export const useListStore = create<ListState>((set) => ({
  lists: [],
  loading: false,
  error: null,

  fetchLists: async () => {
    set({ loading: true, error: null });
    try {
      const lists = await listAPI.getAll();
      set({ lists, loading: false });
    } catch (error) {
      console.error('Error fetching lists:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch lists',
        loading: false 
      });
    }
  },

  createList: async (data) => {
    set({ error: null });
    try {
      const newList = await listAPI.create(data);
      set(state => ({ 
        lists: [newList, ...state.lists] 
      }));
    } catch (error) {
      console.error('Error creating list:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create list' });
      throw error;
    }
  },

  deleteList: async (id) => {
    set({ error: null });
    try {
      await listAPI.delete(id);
      set(state => ({ 
        lists: state.lists.filter(list => list._id !== id) 
      }));
    } catch (error) {
      console.error('Error deleting list:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete list' });
      throw error;
    }
  },

  updateListTaskCount: (listId, increment) => {
    set(state => ({
      lists: state.lists.map(list =>
        list._id === listId
          ? { ...list, taskCount: Math.max(0, list.taskCount + increment) }
          : list
      )
    }));
  },

  clearLists: () => {
    set({ lists: [], error: null });
  },

  setError: (error) => {
    set({ error });
  },
}));
