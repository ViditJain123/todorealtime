import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for our models
export interface ISharedUser {
  email: string;
  userId: string;
  permission: 'Edit' | 'View';
  addedAt: Date;
  username?: string;
  fullName?: string;
}

export interface IList extends Document {
  _id: string;
  name: string;
  createdAt: Date;
  userId: string; // Clerk user ID (owner)
  taskCount: number;
  completedTaskCount: number;
  sharedWith: ISharedUser[]; // Array of users with permissions
  isShared: boolean;
}

export interface ITodo extends Document {
  _id: string;
  type: boolean; // completion status
  taskName: string;
  status: 'ToDo' | 'InProgress' | 'Completed';
  createdAt: Date;
  priority: 'High' | 'Medium' | 'Low';
  listId: string; // Reference to the List
  userId: string; // Clerk user ID
}

// List Schema
const SharedUserSchema = new Schema<ISharedUser>({
  email: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  permission: {
    type: String,
    enum: ['Edit', 'View'],
    default: 'Edit'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  username: {
    type: String,
    required: false
  },
  fullName: {
    type: String,
    required: false
  }
});

const ListSchema = new Schema<IList>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  taskCount: {
    type: Number,
    default: 0
  },
  completedTaskCount: {
    type: Number,
    default: 0
  },
  sharedWith: {
    type: [SharedUserSchema],
    default: []
  },
  isShared: {
    type: Boolean,
    default: false
  }
});

// Todo Schema
const TodoSchema = new Schema<ITodo>({
  type: {
    type: Boolean,
    default: false
  },
  taskName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  status: {
    type: String,
    enum: ['ToDo', 'InProgress', 'Completed'],
    default: 'ToDo'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  listId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  }
});

// Create indexes for better query performance
ListSchema.index({ userId: 1, createdAt: -1 });
TodoSchema.index({ listId: 1, createdAt: -1 });
TodoSchema.index({ userId: 1, status: 1 });

// Export models
export const List = mongoose.models.List || mongoose.model<IList>('List', ListSchema);
export const Todo = mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);
