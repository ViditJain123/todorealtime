import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { List, Todo } from '@/models';

// GET - Fetch all lists for the authenticated user (owned and shared)
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find lists where user is either the owner or in the sharedWith array
    const lists = await List.find({
      $or: [
        { userId },
        { 'sharedWith.userId': userId }
      ]
    }).sort({ createdAt: -1 });
    
    // Get completion data for each list
    const listsWithCompletion = await Promise.all(
      lists.map(async (list) => {
        const completedTaskCount = await Todo.countDocuments({
          listId: list._id,
          status: 'Completed'
        });
        
        return {
          ...list.toObject(),
          completedTaskCount
        };
      })
    );
    
    return NextResponse.json(listsWithCompletion);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new list
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    await connectDB();
    
    const newList = new List({
      name: name.trim(),
      userId,
      taskCount: 0
    });
    
    await newList.save();
    
    // Return the list with completedTaskCount
    const listWithCompletion = {
      ...newList.toObject(),
      completedTaskCount: 0
    };
    
    return NextResponse.json(listWithCompletion, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
