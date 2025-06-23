import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for our models
export interface IList extends Document {
  _id: string;
  name: string;
  createdAt: Date;
  userId: string; // Clerk user ID
  taskCount: number;
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
