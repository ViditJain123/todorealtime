import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { List } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, targetEmail, permission = 'Edit' } = await request.json();

    if (!listId || !targetEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['Edit', 'View'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission type' }, { status: 400 });
    }

    await connectDB();

    // First, check if the list exists and the user has permission to share it
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

    // Query Clerk to find the user by email
    try {
      const clerk = await clerkClient();
      const users = await clerk.users.getUserList({
        emailAddress: [targetEmail],
        limit: 1
      });

      if (users.data.length === 0) {
        return NextResponse.json({ 
          error: 'User with this email address not found' 
        }, { status: 404 });
      }

      const targetUser = users.data[0];
      const targetUserId = targetUser.id;

      // Check if the user is trying to share with themselves
      if (targetUserId === userId) {
        return NextResponse.json({ 
          error: 'Cannot share list with yourself' 
        }, { status: 400 });
      }

      // Check if the list is already shared with this user
      const alreadyShared = list.sharedWith.some((shared: { userId: string }) => shared.userId === targetUserId);
      if (alreadyShared) {
        return NextResponse.json({ 
          error: 'List is already shared with this user' 
        }, { status: 400 });
      }

      // Add the user to the sharedWith array with permission
      await List.findByIdAndUpdate(listId, {
        $addToSet: { 
          sharedWith: {
            email: targetEmail,
            userId: targetUserId,
            permission: permission,
            addedAt: new Date()
          }
        },
        $set: { isShared: true }
      });

      return NextResponse.json({ 
        message: 'List shared successfully',
        sharedWithEmail: targetEmail,
        sharedWithId: targetUserId
      });

    } catch (clerkError) {
      console.error('Clerk API error:', clerkError);
      return NextResponse.json({ 
        error: 'Failed to verify user email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Share list error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
