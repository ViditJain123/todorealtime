import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Todo, List } from '@/models';

// Helper function to check user permissions on a list
async function checkListPermission(listId: string, userId: string, requiredPermission: 'View' | 'Edit' = 'View') {
  const list = await List.findById(listId);
  if (!list) {
    return { hasAccess: false, permission: null, list: null };
  }

  // Owner has all permissions
  if (list.userId === userId) {
    return { hasAccess: true, permission: 'Edit', list };
  }

  // Check shared permissions
  const sharedUser = list.sharedWith.find((shared: { userId: string, permission: string }) => shared.userId === userId);
  if (!sharedUser) {
    return { hasAccess: false, permission: null, list };
  }

  // Check if user has required permission
  if (requiredPermission === 'Edit' && sharedUser.permission === 'View') {
    return { hasAccess: false, permission: sharedUser.permission, list };
  }

  return { hasAccess: true, permission: sharedUser.permission, list };
}

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
    
    // Check if user has access to the list
    const { hasAccess } = await checkListPermission(listId, userId, 'View');
    if (!hasAccess) {
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
    
    // Check if user has edit permission on the list
    const { hasAccess, permission } = await checkListPermission(listId, userId, 'Edit');
    if (!hasAccess) {
      if (permission === 'View') {
        return NextResponse.json({ error: 'You only have view permission for this list' }, { status: 403 });
      }
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
