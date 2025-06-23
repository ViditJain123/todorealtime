import { create } from 'zustand';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '@/types';
import { todoAPI } from '@/lib/api';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  currentListId: string | null;
  
  // Actions
  fetchTodos: (listId: string) => Promise<void>;
  createTodo: (listId: string, data: CreateTodoRequest) => Promise<Todo>;
  updateTodo: (listId: string, todoId: string, data: UpdateTodoRequest) => Promise<void>;
  deleteTodo: (listId: string, todoId: string) => Promise<void>;
  toggleComplete: (listId: string, todo: Todo) => Promise<void>;
  clearTodos: () => void;
  setError: (error: string | null) => void;
  
  // Local updates for real-time sync (without API calls)
  addTodoLocal: (todo: Todo) => void;
  updateTodoLocal: (todo: Todo) => void;
  deleteTodoLocal: (todoId: string) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  currentListId: null,

  fetchTodos: async (listId) => {
    set({ loading: true, error: null, currentListId: listId });
    try {
      const todos = await todoAPI.getByListId(listId);
      set({ todos, loading: false });
    } catch (error) {
      console.error('Error fetching todos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch todos',
        loading: false 
      });
    }
  },

  createTodo: async (listId, data) => {
    set({ error: null });
    try {
      const newTodo = await todoAPI.create(listId, data);
      set(state => ({ 
        todos: [newTodo, ...state.todos] 
      }));
      return newTodo;
    } catch (error) {
      console.error('Error creating todo:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create todo' });
      throw error;
    }
  },

  updateTodo: async (listId, todoId, data) => {
    set({ error: null });
    try {
      const updatedTodo = await todoAPI.update(listId, todoId, data);
      set(state => ({
        todos: state.todos.map(todo =>
          todo._id === todoId ? updatedTodo : todo
        )
      }));
    } catch (error) {
      console.error('Error updating todo:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update todo' });
      throw error;
    }
  },

  deleteTodo: async (listId, todoId) => {
    set({ error: null });
    try {
      await todoAPI.delete(listId, todoId);
      set(state => ({ 
        todos: state.todos.filter(todo => todo._id !== todoId) 
      }));
    } catch (error) {
      console.error('Error deleting todo:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete todo' });
      throw error;
    }
  },

  toggleComplete: async (listId, todo) => {
    const newType = !todo.type;
    const newStatus = newType ? 'Completed' : 'ToDo';
    
    try {
      await get().updateTodo(listId, todo._id, {
        type: newType,
        status: newStatus
      });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      throw error;
    }
  },

  clearTodos: () => {
    set({ todos: [], error: null, currentListId: null });
  },

  setError: (error) => {
    set({ error });
  },

  // Local updates for real-time sync
  addTodoLocal: (todo) => {
    set(state => ({ 
      todos: [todo, ...state.todos] 
    }));
  },

  updateTodoLocal: (updatedTodo) => {
    set(state => ({
      todos: state.todos.map(todo =>
        todo._id === updatedTodo._id ? updatedTodo : todo
      )
    }));
  },

  deleteTodoLocal: (todoId) => {
    set(state => ({ 
      todos: state.todos.filter(todo => todo._id !== todoId) 
    }));
  },
}));
