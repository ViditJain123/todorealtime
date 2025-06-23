import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { List } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, updates } = await request.json();

    if (!listId || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Check if the list exists and the user has permission to modify it
    const list = await List.findById(listId);
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Check if the user is the owner or already has access to the list
    const hasAccess = list.userId === userId || 
      list.sharedWith.some((shared: { userId: string }) => shared.userId === userId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update permissions for each user in the updates array
    for (const update of updates) {
      const { email, permission } = update;
      
      if (!email || !permission || !['Edit', 'View'].includes(permission)) {
        continue; // Skip invalid updates
      }

      // Update the permission for the user with this email
      await List.findOneAndUpdate(
        { 
          _id: listId,
          'sharedWith.email': email
        },
        { 
          $set: { 'sharedWith.$.permission': permission }
        }
      );
    }

    return NextResponse.json({ 
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
