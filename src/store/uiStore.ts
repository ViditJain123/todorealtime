import { create } from 'zustand';

interface UIState {
  // List UI state
  showCreateListForm: boolean;
  creatingList: boolean;
  
  // Todo UI state
  showCreateTodoForm: boolean;
  creatingTodo: boolean;
  editingTodo: string | null;
  
  // Global UI state
  sidebarOpen: boolean;
  
  // Actions
  setShowCreateListForm: (show: boolean) => void;
  setCreatingList: (creating: boolean) => void;
  setShowCreateTodoForm: (show: boolean) => void;
  setCreatingTodo: (creating: boolean) => void;
  setEditingTodo: (todoId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  resetUIState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // List UI state
  showCreateListForm: false,
  creatingList: false,
  
  // Todo UI state
  showCreateTodoForm: false,
  creatingTodo: false,
  editingTodo: null,
  
  // Global UI state
  sidebarOpen: false,

  // Actions
  setShowCreateListForm: (show) => set({ showCreateListForm: show }),
  setCreatingList: (creating) => set({ creatingList: creating }),
  setShowCreateTodoForm: (show) => set({ showCreateTodoForm: show }),
  setCreatingTodo: (creating) => set({ creatingTodo: creating }),
  setEditingTodo: (todoId) => set({ editingTodo: todoId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  resetUIState: () => set({
    showCreateListForm: false,
    creatingList: false,
    showCreateTodoForm: false,
    creatingTodo: false,
    editingTodo: null,
  }),
}));
