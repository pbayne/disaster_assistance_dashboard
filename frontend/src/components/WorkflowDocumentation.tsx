import { Box, Typography, Paper, Divider, Chip, Stack, Alert } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export function WorkflowDocumentation() {
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" sx={{ mb: 1, fontWeight: 700, color: '#003d7a' }}>
        Approval Workflow Documentation
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Complete guide to the homeowner assistance application approval process
      </Typography>

      {/* Workflow Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Workflow Overview
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          The Disaster Assistance Dashboard includes a comprehensive approval workflow system that manages
          the lifecycle of homeowner assistance applications from initial submission through final approval or rejection.
        </Typography>

        {/* Visual Workflow Diagram */}
        <Box sx={{
          bgcolor: '#f5f5f5',
          p: 3,
          borderRadius: 2,
          border: '2px solid #e0e0e0',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          overflowX: 'auto'
        }}>
          <pre style={{ margin: 0 }}>
{`PENDING
├─→ [Approve Button] ──────────────→ APPROVED (final)
├─→ [Reject Button] ───────────────→ REJECTED (final)
└─→ [Request More Info Button] ────→ UNDER REVIEW
                                          │
                                          │ (Applicant fills form)
                                          │ (Submits response)
                                          ↓
                                     READY FOR REVIEW
                                          │
                                          ├─→ [Approve Button] ──→ APPROVED (final)
                                          └─→ [Reject Button] ───→ REJECTED (final)`}
          </pre>
        </Box>
      </Paper>

      {/* State 1: PENDING */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip label="PENDING" color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Pending Status
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Initial state when an application is first submitted.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Available Actions (Reviewer/Admin):
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            <Typography variant="body2">
              <strong>Approve</strong> - Immediately approve the application → APPROVED
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CancelIcon sx={{ color: 'error.main' }} />
            <Typography variant="body2">
              <strong>Reject</strong> - Immediately reject the application → REJECTED
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon sx={{ color: 'warning.main' }} />
            <Typography variant="body2">
              <strong>Request More Info</strong> - Request additional information from applicant → UNDER REVIEW
            </Typography>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mt: 2 }}>
          Three action buttons displayed horizontally. Each button with appropriate icon and color coding.
          All actions require no additional input at this stage.
        </Alert>
      </Paper>

      {/* State 2: UNDER REVIEW */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip label="UNDER REVIEW" color="warning" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Under Review Status
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Application is awaiting additional information from the applicant.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Available Actions (Applicant):
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          This application is awaiting additional information from the applicant.
          The applicant should provide the requested information below and submit for final review.
        </Alert>

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Form Fields:
        </Typography>
        <Stack spacing={1} sx={{ ml: 2, mb: 2 }}>
          <Typography variant="body2">
            • <strong>Applicant/Respondent Name</strong> - Name of person providing the information
          </Typography>
          <Typography variant="body2">
            • <strong>Applicant Response</strong> - Detailed response to all requested information (5 rows)
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Action Button:
          </Typography>
          <Chip
            label="Submit Applicant Response for Review"
            color="primary"
            size="small"
          />
          <ArrowForwardIcon fontSize="small" />
          <Chip label="READY FOR REVIEW" color="success" size="small" />
        </Stack>

        <Alert severity="info">
          <strong>Validation:</strong> Both name and response fields must be non-empty.
          Whitespace-only input is not accepted.
        </Alert>
      </Paper>

      {/* State 3: READY FOR REVIEW */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip label="READY FOR REVIEW" color="success" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Ready for Review Status
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Applicant has provided additional information and the application is ready for final review.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Alert severity="success" sx={{ mb: 2 }}>
          The applicant has provided additional information and submitted the application for final review.
        </Alert>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Information Displayed:
        </Typography>
        <Stack spacing={1} sx={{ ml: 2, mb: 2 }}>
          <Typography variant="body2">
            • <strong>Submitted by:</strong> Applicant name
          </Typography>
          <Typography variant="body2">
            • <strong>Submission Date:</strong> Formatted timestamp
          </Typography>
          <Typography variant="body2">
            • <strong>Response:</strong> Full response text
          </Typography>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Available Actions (Reviewer/Admin):
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            icon={<CheckCircleIcon />}
            label="Approve → APPROVED"
            color="success"
          />
          <Chip
            icon={<CancelIcon />}
            label="Reject → REJECTED"
            color="error"
          />
        </Stack>
      </Paper>

      {/* State 4: APPROVED */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label="APPROVED"
            color="success"
            icon={<CheckCircleIcon />}
          />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Approved Status (Final)
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Application has been approved. This is a terminal state.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Alert severity="success">
          <strong>Read-Only State:</strong> No further actions available.
          Displays final status with review information if applicable.
        </Alert>
      </Paper>

      {/* State 5: REJECTED */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label="REJECTED"
            color="error"
            icon={<CancelIcon />}
          />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Rejected Status (Final)
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Application has been rejected. This is a terminal state.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Alert severity="error">
          <strong>Read-Only State:</strong> No further actions available.
          Displays final status with review information if applicable.
        </Alert>
      </Paper>

      {/* Workflow Examples */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Workflow Examples
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Example 1: Direct Approval
          </Typography>
          <Stack spacing={1} sx={{ ml: 2 }}>
            <Typography variant="body2">1. Application submitted → Status: <Chip label="PENDING" size="small" /></Typography>
            <Typography variant="body2">2. Reviewer reviews application</Typography>
            <Typography variant="body2">3. Reviewer clicks "Approve" → Status: <Chip label="APPROVED" color="success" size="small" icon={<CheckCircleIcon />} /></Typography>
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Example 2: Request More Information
          </Typography>
          <Stack spacing={1} sx={{ ml: 2 }}>
            <Typography variant="body2">1. Application submitted → Status: <Chip label="PENDING" size="small" /></Typography>
            <Typography variant="body2">2. Reviewer identifies missing information</Typography>
            <Typography variant="body2">3. Reviewer clicks "Request More Info" → Status: <Chip label="UNDER REVIEW" color="warning" size="small" /></Typography>
            <Typography variant="body2">4. Applicant receives notification</Typography>
            <Typography variant="body2">5. Applicant provides additional information and submits</Typography>
            <Typography variant="body2">6. → Status: <Chip label="READY FOR REVIEW" color="success" size="small" /></Typography>
            <Typography variant="body2">7. Reviewer reviews the additional information</Typography>
            <Typography variant="body2">8. Reviewer clicks "Approve" or "Reject" → Status: <Chip label="APPROVED/REJECTED" size="small" /></Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Example 3: Direct Rejection
          </Typography>
          <Stack spacing={1} sx={{ ml: 2 }}>
            <Typography variant="body2">1. Application submitted → Status: <Chip label="PENDING" size="small" /></Typography>
            <Typography variant="body2">2. Reviewer identifies disqualifying factors</Typography>
            <Typography variant="body2">3. Reviewer clicks "Reject" → Status: <Chip label="REJECTED" color="error" size="small" icon={<CancelIcon />} /></Typography>
          </Stack>
        </Box>
      </Paper>

      {/* User Roles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          User Roles and Permissions
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
            Reviewer/Admin Role
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Capabilities:</strong>
          </Typography>
          <Stack spacing={0.5} sx={{ ml: 2 }}>
            <Typography variant="body2">• View all applications</Typography>
            <Typography variant="body2">• Approve applications directly from PENDING state</Typography>
            <Typography variant="body2">• Reject applications directly from PENDING state</Typography>
            <Typography variant="body2">• Request more information (move to UNDER REVIEW)</Typography>
            <Typography variant="body2">• Make final approval/rejection decision from READY FOR REVIEW state</Typography>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'secondary.main' }}>
            Applicant Role
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Capabilities:</strong>
          </Typography>
          <Stack spacing={0.5} sx={{ ml: 2 }}>
            <Typography variant="body2">• View their application status</Typography>
            <Typography variant="body2">• When status is UNDER REVIEW:</Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>- Provide additional information</Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>- Submit responses for review</Typography>
            <Typography variant="body2">• Cannot directly approve/reject applications</Typography>
          </Stack>
        </Box>
      </Paper>

      {/* How to Access */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f9ff' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          How to Use the Workflow
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          To access the approval workflow:
        </Typography>
        <Stack spacing={1} sx={{ ml: 2 }}>
          <Typography variant="body2">1. Navigate to the main dashboard map view</Typography>
          <Typography variant="body2">2. Click on any <strong>homeowner ID</strong> in the Homeowner Applicants table</Typography>
          <Typography variant="body2">3. The details dialog will open, showing all application information</Typography>
          <Typography variant="body2">4. Scroll to the bottom to see the <strong>Approval Workflow</strong> section</Typography>
          <Typography variant="body2">5. Take appropriate actions based on the current status</Typography>
        </Stack>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last Updated: October 2025 • Version 1.0
        </Typography>
      </Box>
    </Box>
  )
}
