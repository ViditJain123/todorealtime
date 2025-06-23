import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Todo, List } from '@/models';

// GET - Fetch all todos for a specific list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: listId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Verify the user has access to the list (owner or shared with)
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
    
    const todos = await Todo.find({ listId }).sort({ createdAt: -1 });
    
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new todo in a specific list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: listId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskName, priority = 'Medium', status = 'ToDo' } = await request.json();
    
    if (!taskName || typeof taskName !== 'string' || taskName.trim().length === 0) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Verify the user has access to the list (owner or shared with)
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
    
    const newTodo = new Todo({
      taskName: taskName.trim(),
      priority,
      status,
      listId,
      userId,
      type: false
    });
    
    await newTodo.save();
    
    // Update list task count
    await List.findByIdAndUpdate(listId, { 
      $inc: { taskCount: 1 } 
    });
    
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
