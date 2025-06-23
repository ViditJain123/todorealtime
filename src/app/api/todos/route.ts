import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Todo, List } from '@/models';

// GET - Fetch all todos for a specific list
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // Verify the list belongs to the user
    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    const todos = await Todo.find({ listId, userId }).sort({ createdAt: -1 });
    
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new todo in a specific list
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, taskName, priority = 'Medium', status = 'ToDo' } = await request.json();
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }
    
    if (!taskName || typeof taskName !== 'string' || taskName.trim().length === 0) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Verify the list belongs to the user
    const list = await List.findOne({ _id: listId, userId });
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
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
