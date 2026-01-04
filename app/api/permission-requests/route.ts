import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import PermissionRequest from '@/models/PermissionRequest';
import PrivateOrg from '@/models/PrivateOrg';
import User from '@/models/User';

// GET - Fetch permission requests (for owner to review)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const privateOrgId = searchParams.get('privateOrgId');
    const status = searchParams.get('status') || 'pending';

    if (!privateOrgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    await connectDB();

    // Verify user is owner
    const org = await PrivateOrg.findById(privateOrgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is owner by comparing user ID
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (String(org.ownerId) !== String(currentUser._id)) {
      return NextResponse.json({ error: 'Only owner can view requests' }, { status: 403 });
    }

    const requests = await PermissionRequest.find({
      privateOrgId,
      status,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching permission requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST - Create a permission request (for members)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { privateOrgId, requestType, eventData } = body;

    if (!privateOrgId || !requestType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify user is a member
    const org = await PrivateOrg.findById(privateOrgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is owner or in allowedUsers
    // Note: Need to get the user ID first
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = String(org.ownerId) === String(currentUser._id);

    const isMember = org.allowedUsers.some(
      (userId: any) => String(userId) === String(currentUser._id)
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Create permission request
    const permissionRequest = await PermissionRequest.create({
      privateOrgId,
      requestedBy: session.user.email,
      requestType,
      eventData,
      status: 'pending',
    });

    return NextResponse.json({ 
      success: true,
      request: permissionRequest,
      message: 'Permission request submitted. Waiting for owner approval.'
    });
  } catch (error) {
    console.error('Error creating permission request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

// PATCH - Update request status (approve/deny)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status, privateOrgId } = body;

    if (!requestId || !status || !['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await connectDB();

    // Verify user is owner
    const org = await PrivateOrg.findById(privateOrgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is owner by comparing user ID
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (String(org.ownerId) !== String(currentUser._id)) {
      return NextResponse.json({ error: 'Only owner can review requests' }, { status: 403 });
    }

    const permissionRequest = await PermissionRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        reviewedBy: session.user.email,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!permissionRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      request: permissionRequest 
    });
  } catch (error) {
    console.error('Error updating permission request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
