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

// POST - Update a todo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todoId, listId, ...updates } = await request.json();
    
    if (!todoId) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
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
    
    // Verify the todo exists in the list
    const todo = await Todo.findOne({ _id: todoId, listId });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Update the todo
    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      { ...updates },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
