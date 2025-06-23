export interface List {
  _id: string;
  name: string;
  createdAt: string;
  userId: string;
  taskCount: number;
  completedTaskCount: number;
  sharedWith: string[];
}

export interface Todo {
  _id: string;
  type: boolean;
  taskName: string;
  status: 'ToDo' | 'InProgress' | 'Completed';
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
  listId: string;
  userId: string;
}

export interface CreateListRequest {
  name: string;
}

export interface CreateTodoRequest {
  taskName: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'ToDo' | 'InProgress' | 'Completed';
}

export interface UpdateTodoRequest {
  type?: boolean;
  taskName?: string;
  status?: 'ToDo' | 'InProgress' | 'Completed';
  priority?: 'High' | 'Medium' | 'Low';
}

export interface ShareListRequest {
  listId: string;
  targetEmail: string;
}

export interface SocketEvents {
  'todo-added': Todo;
  'todo-updated': Todo;
  'todo-deleted': { todoId: string; listId: string };
  'list-updated': List;
}
