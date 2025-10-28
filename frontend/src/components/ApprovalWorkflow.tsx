import { useState } from 'react'
import { Box, Button, TextField, Typography, Stack, Alert, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'

interface ApprovalWorkflowProps {
  applicant: {
    id: string
    status: string
    review_notes?: string
    reviewer_name?: string
    review_date?: string
  }
  onStatusUpdate: (id: string, newStatus: string, notes?: string, reviewerName?: string) => Promise<void>
}

export function ApprovalWorkflow({ applicant, onStatusUpdate }: ApprovalWorkflowProps) {
  const [reviewNotes, setReviewNotes] = useState(applicant.review_notes || '')
  const [reviewerName, setReviewerName] = useState(applicant.reviewer_name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true)
    try {
      await onStatusUpdate(applicant.id, newStatus, reviewNotes, reviewerName)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Status: Pending → can Approve, Reject, or Request More Info (→ Under Review)
  if (applicant.status === 'Pending') {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          Approval Actions
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleStatusChange('Approved')}
            disabled={isSubmitting}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleStatusChange('Rejected')}
            disabled={isSubmitting}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<InfoIcon />}
            onClick={() => handleStatusChange('Under Review')}
            disabled={isSubmitting}
          >
            Request More Info
          </Button>
        </Stack>
      </Box>
    )
  }

  // Status: Under Review → form for applicant to add their response, then Submit (→ Ready for Review)
  if (applicant.status === 'Under Review') {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          Additional Information Requested
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This application is awaiting additional information from the applicant.
          The applicant should provide the requested information below and submit for final review.
        </Alert>
        <Stack spacing={2}>
          <TextField
            label="Applicant/Respondent Name"
            fullWidth
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Enter your name"
            required
            helperText="Who is providing this additional information?"
          />
          <TextField
            label="Applicant Response / Additional Information"
            fullWidth
            multiline
            rows={5}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Please provide the requested documents, clarifications, or additional information here..."
            required
            helperText="Provide detailed responses to all requested information"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleStatusChange('Ready for Review')}
            disabled={isSubmitting || !reviewNotes.trim() || !reviewerName.trim()}
            sx={{ alignSelf: 'flex-start' }}
          >
            Submit Applicant Response for Review
          </Button>
        </Stack>
      </Box>
    )
  }

  // Status: Ready for Review → can Approve or Reject
  if (applicant.status === 'Ready for Review') {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          Final Approval Decision
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          The applicant has provided additional information and submitted the application for final review.
        </Alert>
        {applicant.review_notes && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Applicant Response:
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Submitted by:</strong> {applicant.reviewer_name || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Submission Date:</strong> {applicant.review_date ? new Date(applicant.review_date).toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Response:</strong> {applicant.review_notes}
            </Typography>
          </Box>
        )}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleStatusChange('Approved')}
            disabled={isSubmitting}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleStatusChange('Rejected')}
            disabled={isSubmitting}
          >
            Reject
          </Button>
        </Stack>
      </Box>
    )
  }

  // Status: Approved or Rejected → show final status
  if (applicant.status === 'Approved' || applicant.status === 'Rejected') {
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">Final Status:</Typography>
          <Chip
            label={applicant.status}
            color={applicant.status === 'Approved' ? 'success' : 'error'}
            icon={applicant.status === 'Approved' ? <CheckCircleIcon /> : <CancelIcon />}
          />
        </Stack>
        {applicant.review_notes && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Review Information:
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Reviewed by:</strong> {applicant.reviewer_name || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Date:</strong> {applicant.review_date ? new Date(applicant.review_date).toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="body2">
              <strong>Notes:</strong> {applicant.review_notes}
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  // Status: Processing or other
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
      <Typography variant="body2" color="text.secondary">
        Status: <Chip label={applicant.status} size="small" />
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        No approval actions available for this status.
      </Typography>
    </Box>
  )
}
