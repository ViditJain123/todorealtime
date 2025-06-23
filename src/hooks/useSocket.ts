'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { Todo } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinList: (listId: string) => void;
  leaveList: (listId: string) => void;
  emitTodoAdded: (todo: Todo) => void;
  emitTodoUpdated: (todo: Todo) => void;
  emitTodoDeleted: (todoId: string, listId: string) => void;
  onTodoAdded: (callback: (todo: Todo) => void) => void;
  onTodoUpdated: (callback: (todo: Todo) => void) => void;
  onTodoDeleted: (callback: (data: { todoId: string; listId: string }) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinList = (listId: string) => {
    if (socket) {
      socket.emit('join-list', listId);
    }
  };

  const leaveList = (listId: string) => {
    if (socket) {
      socket.emit('leave-list', listId);
    }
  };

  const emitTodoAdded = (todo: Todo) => {
    if (socket) {
      socket.emit('todo-added', todo);
    }
  };

  const emitTodoUpdated = (todo: Todo) => {
    if (socket) {
      socket.emit('todo-updated', todo);
    }
  };

  const emitTodoDeleted = (todoId: string, listId: string) => {
    if (socket) {
      socket.emit('todo-deleted', { todoId, listId });
    }
  };

  const onTodoAdded = (callback: (todo: Todo) => void) => {
    if (socket) {
      socket.on('todo-added', callback);
    }
  };

  const onTodoUpdated = (callback: (todo: Todo) => void) => {
    if (socket) {
      socket.on('todo-updated', callback);
    }
  };

  const onTodoDeleted = (callback: (data: { todoId: string; listId: string }) => void) => {
    if (socket) {
      socket.on('todo-deleted', callback);
    }
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    joinList,
    leaveList,
    emitTodoAdded,
    emitTodoUpdated,
    emitTodoDeleted,
    onTodoAdded,
    onTodoUpdated,
    onTodoDeleted,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
