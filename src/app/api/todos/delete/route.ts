import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Todo, List } from '@/models';

// POST - Delete a todo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todoId, listId } = await request.json();
    
    if (!todoId) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // First verify the user has access to the list
    const list = await List.findOne({ 
      _id: listId, 
      $or: [
        { userId },
        { sharedWith: userId }
      ]
    });
    if (!list) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }
    
    // Verify the todo exists in the list
    const todo = await Todo.findOne({ _id: todoId, listId });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Delete the todo
    await Todo.deleteOne({ _id: todoId, listId });
    
    // Update list task count
    await List.findByIdAndUpdate(listId, { 
      $inc: { taskCount: -1 } 
    });
    
    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
