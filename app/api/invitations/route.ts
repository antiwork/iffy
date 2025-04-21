import { client } from '@/lib/auth-client';

export default async function handler(req, res) {
  const { action } = req.query;
  const { invitationId } = req.body;

  if (!invitationId) {
    return res.status(400).json({
      success: false,
      error: 'Invitation ID is required'
    });
  }

  try {
    let result;

    if (action === 'accept') {
      result = await client.organization.acceptInvitation({
        invitationId
      });
    } else if (action === 'decline') {
      result = await client.organization.rejectInvitation({
        invitationId
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "accept" or "decline"'
      });
    }

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    // Handle specific error types
    if (error.message?.includes('expired')) {
      return res.status(410).json({
        success: false,
        error: 'This invitation has expired',
        code: 'INVITATION_EXPIRED'
      });
    }
    else if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
      return res.status(410).json({
        success: false,
        error: 'This invitation has been canceled',
        code: 'INVITATION_CANCELED'
      });
    }
    else if (error.message?.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
        code: 'INVITATION_NOT_FOUND'
      });
    }
    else if (error.message?.includes('already accepted')) {
      return res.status(409).json({
        success: false,
        error: 'This invitation has already been accepted',
        code: 'INVITATION_ALREADY_ACCEPTED'
      });
    }

    // Generic error handling
    console.error('Invitation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
