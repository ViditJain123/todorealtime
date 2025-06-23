import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { List, Todo } from '@/models';

// POST - Delete a list and all its todos
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // First, verify the list belongs to the user
    const list = await List.findOne({ _id: id, userId });
    
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    // Delete all todos in this list
    await Todo.deleteMany({ listId: id, userId });
    
    // Delete the list
    await List.deleteOne({ _id: id, userId });
    
    return NextResponse.json({ message: 'List and all associated todos deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
