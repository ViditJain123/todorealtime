import { List, Todo, CreateListRequest, CreateTodoRequest, UpdateTodoRequest } from '@/types';

const API_BASE_URL = '/api';

// List API functions
export const listAPI = {
  // Get all lists
  getAll: async (): Promise<List[]> => {
    const response = await fetch(`${API_BASE_URL}/lists`);
    if (!response.ok) {
      throw new Error('Failed to fetch lists');
    }
    return response.json();
  },

  // Create a new list
  create: async (data: CreateListRequest): Promise<List> => {
    const response = await fetch(`${API_BASE_URL}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create list');
    }
    return response.json();
  },

  // Delete a list
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/lists/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete list');
    }
  },

  // Share a list with another user
  share: async (listId: string, targetEmail: string, permission: 'Edit' | 'View' = 'Edit'): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/share-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listId, targetEmail, permission }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share list');
    }
  },

  // Update permissions for shared users
  updatePermissions: async (listId: string, updates: { email: string; permission: 'Edit' | 'View' }[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update-permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listId, updates }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update permissions');
    }
  },
};

// Todo API functions
export const todoAPI = {
  // Get all todos for a list
  getByListId: async (listId: string): Promise<Todo[]> => {
    const response = await fetch(`${API_BASE_URL}/todos?listId=${listId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch todos');
    }
    return response.json();
  },

  // Create a new todo
  create: async (listId: string, data: CreateTodoRequest): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listId, ...data }),
    });
    if (!response.ok) {
      throw new Error('Failed to create todo');
    }
    return response.json();
  },

  // Update a todo
  update: async (listId: string, id: string, data: UpdateTodoRequest): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/todos/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todoId: id, listId, ...data }),
    });
    if (!response.ok) {
      throw new Error('Failed to update todo');
    }
    return response.json();
  },

  // Delete a todo
  delete: async (listId: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/todos/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todoId: id, listId }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete todo');
    }
  },
};
