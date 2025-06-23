// Hook for managing lists with optimistic updates
import { useListStore } from '@/store/listStore';
import { useTodoStore } from '@/store/todoStore';
import { useUIStore } from '@/store/uiStore';
import { CreateTodoRequest, UpdateTodoRequest } from '@/types';

export const useListActions = () => {
  const { createList, deleteList, fetchLists } = useListStore();
  const { clearTodos } = useTodoStore();
  const { setShowCreateListForm, setCreatingList } = useUIStore();

  const createListWithUI = async (name: string) => {
    setCreatingList(true);
    try {
      await createList({ name });
      setShowCreateListForm(false);
    } finally {
      setCreatingList(false);
    }
  };

  const deleteListWithCleanup = async (id: string) => {
    await deleteList(id);
    clearTodos(); // Clear todos when list is deleted
  };

  return {
    createListWithUI,
    deleteListWithCleanup,
    fetchLists,
  };
};

export const useTodoActions = () => {
  const { createTodo, updateTodo, deleteTodo, toggleComplete } = useTodoStore();
  const { updateListTaskCount } = useListStore();
  const { setShowCreateTodoForm, setCreatingTodo, setEditingTodo } = useUIStore();

  const createTodoWithUI = async (listId: string, data: CreateTodoRequest) => {
    setCreatingTodo(true);
    try {
      await createTodo(listId, data);
      updateListTaskCount(listId, 1);
      setShowCreateTodoForm(false);
    } finally {
      setCreatingTodo(false);
    }
  };

  const deleteTodoWithUI = async (listId: string, todoId: string) => {
    await deleteTodo(listId, todoId);
    updateListTaskCount(listId, -1);
  };

  const editTodoWithUI = async (listId: string, todoId: string, data: UpdateTodoRequest) => {
    await updateTodo(listId, todoId, data);
    setEditingTodo(null);
  };

  return {
    createTodoWithUI,
    deleteTodoWithUI,
    editTodoWithUI,
    updateTodo,
    toggleComplete,
  };
};
