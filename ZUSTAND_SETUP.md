# Zustand State Management Setup

This project now uses [Zustand](https://github.com/pmndrs/zustand) for state management. Zustand provides a lightweight, simple state management solution for React applications.

## Store Structure

### 1. List Store (`src/store/listStore.ts`)
Manages all list-related state and operations:
- `lists`: Array of all lists
- `loading`: Loading state for list operations
- `error`: Error messages for list operations
- Actions: `fetchLists`, `createList`, `deleteList`, `updateListTaskCount`

### 2. Todo Store (`src/store/todoStore.ts`)
Manages todo-related state and operations:
- `todos`: Array of todos for the current list
- `loading`: Loading state for todo operations
- `error`: Error messages for todo operations
- `currentListId`: ID of the currently active list
- Actions: `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `toggleComplete`

### 3. UI Store (`src/store/uiStore.ts`)
Manages UI state like form visibility and loading states:
- Form visibility states
- Loading states for create/edit operations
- Editing states
- Actions to control UI state

## Usage Examples

### Basic Store Usage
```tsx
import { useListStore, useTodoStore, useUIStore } from '@/store';

function Component() {
  // Get state and actions from stores
  const { lists, loading, fetchLists, createList } = useListStore();
  const { todos, createTodo } = useTodoStore();
  const { showCreateListForm, setShowCreateListForm } = useUIStore();

  // Use the state and actions
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreateList = async (name: string) => {
    await createList({ name });
  };

  return (
    <div>
      {loading ? 'Loading...' : lists.map(list => (
        <div key={list._id}>{list.name}</div>
      ))}
    </div>
  );
}
```

### Using Custom Hooks (Recommended)
```tsx
import { useListActions, useTodoActions } from '@/hooks/useStoreActions';

function Component() {
  const { createListWithUI, deleteListWithCleanup } = useListActions();
  const { createTodoWithUI, editTodoWithUI } = useTodoActions();

  // These hooks handle UI state automatically
  const handleCreateList = async (name: string) => {
    await createListWithUI(name); // Handles loading states and form visibility
  };
}
```

## Key Benefits

1. **Simplified State Management**: No more prop drilling or complex state logic
2. **Automatic Optimistic Updates**: State updates immediately, then syncs with server
3. **Error Handling**: Built-in error states for all operations
4. **TypeScript Support**: Full type safety with your existing types
5. **Persistence**: State persists across route changes
6. **Performance**: Only re-renders components that use changed state

## Migration from useState

Before (with useState):
```tsx
const [lists, setLists] = useState([]);
const [loading, setLoading] = useState(false);

const fetchLists = async () => {
  setLoading(true);
  try {
    const data = await listAPI.getAll();
    setLists(data);
  } finally {
    setLoading(false);
  }
};
```

After (with Zustand):
```tsx
const { lists, loading, fetchLists } = useListStore();

// fetchLists is already implemented in the store
useEffect(() => {
  fetchLists();
}, [fetchLists]);
```

## Advanced Features

### Cross-Store Updates
```tsx
// When creating a todo, automatically update the list's task count
const createTodo = async (listId, data) => {
  await createTodo(listId, data);
  updateListTaskCount(listId, 1); // Update from different store
};
```

### State Persistence
To add persistence, you can use Zustand's persist middleware:
```tsx
import { persist } from 'zustand/middleware';

export const useListStore = create(
  persist(
    (set) => ({
      // store implementation
    }),
    {
      name: 'list-storage', // unique name for localStorage key
    }
  )
);
```

This setup provides a robust, scalable state management solution for your todo application!
