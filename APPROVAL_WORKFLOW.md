# Disaster Assistance Application - Approval Workflow Documentation

## Overview

The Disaster Assistance Dashboard includes a comprehensive approval workflow system that manages the lifecycle of homeowner assistance applications from initial submission through final approval or rejection.

## Workflow State Machine

```
PENDING
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
                                          └─→ [Reject Button] ───→ REJECTED (final)
```

## Application States

### 1. PENDING
**Description:** Initial state when an application is first submitted.

**Available Actions (Reviewer/Admin):**
- ✅ **Approve** - Immediately approve the application → Goes to APPROVED
- ❌ **Reject** - Immediately reject the application → Goes to REJECTED
- ⚠️ **Request More Info** - Request additional information from applicant → Goes to UNDER REVIEW

**UI Components:**
- Three action buttons displayed horizontally
- Each button with appropriate icon and color coding
- All actions require no additional input at this stage

---

### 2. UNDER REVIEW
**Description:** Application is awaiting additional information from the applicant.

**Available Actions (Applicant):**
- 📝 Fill out response form with:
  - **Applicant/Respondent Name** - Name of person providing the information
  - **Applicant Response** - Detailed response to all requested information
- 📤 **Submit Applicant Response for Review** - Submit the completed form → Goes to READY FOR REVIEW

**UI Components:**
- Warning alert explaining the status
- Form with two required text fields:
  - Name field (single line)
  - Response field (multi-line, 5 rows)
- Helper text for each field
- Submit button (disabled until both fields are filled)

**Validation:**
- Both name and response fields must be non-empty
- Whitespace-only input is not accepted

---

### 3. READY FOR REVIEW
**Description:** Applicant has provided additional information and the application is ready for final review.

**Available Actions (Reviewer/Admin):**
- ✅ **Approve** - Approve the application → Goes to APPROVED
- ❌ **Reject** - Reject the application → Goes to REJECTED

**UI Components:**
- Success alert confirming applicant submission
- Display box showing applicant's response:
  - Submitted by (applicant name)
  - Submission date (formatted timestamp)
  - Full response text
- Two action buttons (Approve/Reject)

**Data Displayed:**
- All information submitted by the applicant
- Timestamp of submission
- Name of person who provided the information

---

### 4. APPROVED (Final State)
**Description:** Application has been approved. This is a terminal state.

**Available Actions:** None (read-only)

**UI Components:**
- Green success chip with checkmark icon
- "Final Status: APPROVED" header
- If review information exists:
  - Display box with applicant response details
  - Submitted by name
  - Submission date
  - Response text

---

### 5. REJECTED (Final State)
**Description:** Application has been rejected. This is a terminal state.

**Available Actions:** None (read-only)

**UI Components:**
- Red error chip with cancel icon
- "Final Status: REJECTED" header
- If review information exists:
  - Display box with applicant response details
  - Submitted by name
  - Submission date
  - Response text

---

## Technical Implementation

### Frontend Components

**Location:** `frontend/src/components/ApprovalWorkflow.tsx`

**Key Features:**
- React functional component with hooks
- State management for form fields (reviewerName, reviewNotes)
- Async status update handling
- Material-UI components for consistent styling
- Loading states during API calls

**Props:**
```typescript
interface ApprovalWorkflowProps {
  applicant: {
    id: string
    status: string
    review_notes?: string
    reviewer_name?: string
    review_date?: string
  }
  onStatusUpdate: (
    id: string,
    newStatus: string,
    notes?: string,
    reviewerName?: string
  ) => Promise<void>
}
```

### Backend API

**Endpoint:** `PUT /api/homeowners/{homeowner_id}/status`

**Location:** `backend/main.py:282`

**Request Body:**
```json
{
  "status": "string",
  "review_notes": "string (optional)",
  "reviewer_name": "string (optional)",
  "review_date": "ISO 8601 timestamp (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "id": "string",
  "status": "string",
  "review_notes": "string",
  "reviewer_name": "string",
  "review_date": "ISO 8601 timestamp",
  "message": "Status updated to {status}"
}
```

### Data Model

**Extended HomeownerApplicant Interface:**
```typescript
interface HomeownerApplicant {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  damage_type: string
  assistance_requested: string
  status: string
  application_date: string
  family_size: number
  estimated_damage: number
  estimated_property_value: number
  damage_percentage: number
  fraud_indicators: string[]
  has_fraud_flag: boolean
  missing_documents: string[]
  next_steps: string[]
  risk_score: number
  inspector_assigned: boolean
  inspector_name: string | null
  // Approval workflow fields
  review_notes?: string
  reviewer_name?: string
  review_date?: string
}
```

## User Roles and Permissions

### Reviewer/Admin Role
**Capabilities:**
- View all applications
- Approve applications directly from PENDING state
- Reject applications directly from PENDING state
- Request more information (move to UNDER REVIEW)
- Make final approval/rejection decision from READY FOR REVIEW state

### Applicant Role
**Capabilities:**
- View their application status
- When status is UNDER REVIEW:
  - Provide additional information
  - Submit responses for review
- Cannot directly approve/reject applications

## Workflow Examples

### Example 1: Direct Approval
1. Application submitted → Status: PENDING
2. Reviewer reviews application
3. Reviewer clicks "Approve" → Status: APPROVED (final)

### Example 2: Request More Information
1. Application submitted → Status: PENDING
2. Reviewer identifies missing information
3. Reviewer clicks "Request More Info" → Status: UNDER REVIEW
4. Applicant receives notification (not implemented)
5. Applicant provides:
   - Name: "John Smith"
   - Response: "Here are the requested documents: [details]"
6. Applicant clicks "Submit Applicant Response for Review" → Status: READY FOR REVIEW
7. Reviewer reviews the additional information
8. Reviewer clicks "Approve" or "Reject" → Status: APPROVED or REJECTED (final)

### Example 3: Direct Rejection
1. Application submitted → Status: PENDING
2. Reviewer identifies disqualifying factors
3. Reviewer clicks "Reject" → Status: REJECTED (final)

## Integration Points

### Map Component Integration
**Location:** `frontend/src/components/Map.tsx:1116-1119`

The ApprovalWorkflow component is integrated into the homeowner details dialog:

```typescript
<Grid item xs={12}>
  <ApprovalWorkflow
    applicant={detailsHomeowner}
    onStatusUpdate={handleStatusUpdate}
  />
</Grid>
```

### Status Update Handler
**Location:** `frontend/src/components/Map.tsx:256-289`

```typescript
const handleStatusUpdate = async (
  id: string,
  newStatus: string,
  notes?: string,
  reviewerName?: string
) => {
  const apiBase = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBase}/api/homeowners/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        review_notes: notes,
        reviewer_name: reviewerName,
        review_date: new Date().toISOString()
      })
    })
    if (!response.ok) throw new Error('Failed to update status')

    // Update local state
    setHomeowners(prev => prev.map(h =>
      h.id === id ? { ...h, ...updatedHomeowner } : h
    ))
    setDetailsHomeowner(prev =>
      prev ? { ...prev, ...updatedHomeowner } : null
    )
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Failed to update status')
  }
}
```

## Future Enhancements

### Potential Improvements
1. **Email Notifications**
   - Notify applicants when more information is requested
   - Notify reviewers when applicant submits response
   - Send confirmation emails for final decisions

2. **Audit Trail**
   - Track all status changes with timestamps
   - Record which user made each change
   - Maintain history of all state transitions

3. **Comments/Notes System**
   - Allow multiple rounds of back-and-forth communication
   - Thread-based discussion for each application
   - Attach documents to specific comments

4. **Deadlines and Reminders**
   - Set response deadlines for applicants
   - Send reminder notifications
   - Automatic escalation for overdue items

5. **Batch Operations**
   - Approve/reject multiple applications at once
   - Bulk request for information
   - Export reports of applications by status

6. **Advanced Permissions**
   - Role-based access control
   - Different reviewer levels (junior, senior, manager)
   - Approval thresholds based on application value

## Testing

### Local Development Testing
1. Start the backend server: `cd backend && uvicorn main:app --reload --port 8000`
2. Start the frontend: `cd frontend && npm run dev`
3. Access the application at http://localhost:5173
4. Click on a homeowner ID in the table to open the details dialog
5. Test the approval workflow with different state transitions

### Test Scenarios
- ✅ Approve from PENDING → Verify status changes to APPROVED
- ❌ Reject from PENDING → Verify status changes to REJECTED
- ⚠️ Request Info from PENDING → Verify status changes to UNDER REVIEW
- 📝 Submit response from UNDER REVIEW → Verify status changes to READY FOR REVIEW
- ✅ Approve from READY FOR REVIEW → Verify status changes to APPROVED
- ❌ Reject from READY FOR REVIEW → Verify status changes to REJECTED
- 🔒 Verify final states (APPROVED/REJECTED) are read-only

## Deployment Notes

**Important:** The current implementation is configured for local development only.

### Local Development
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- No database persistence (in-memory only)
- All Databricks connection code has been removed from localhost version

### Production Deployment (Databricks)
**Note:** As of the last update, the production version on Databricks is stable and should not be modified before the demo. The approval workflow exists only in the local development environment.

When ready to deploy to production:
1. Re-enable database persistence (db.py)
2. Update the status update endpoint to save to Databricks Unity Catalog
3. Test thoroughly in development workspace first
4. Deploy using: `databricks apps deploy disaster-assistance`

## Support and Maintenance

### Key Files
- Frontend Component: `frontend/src/components/ApprovalWorkflow.tsx`
- Integration Point: `frontend/src/components/Map.tsx`
- Backend API: `backend/main.py`
- Documentation: `APPROVAL_WORKFLOW.md` (this file)

### Contact
For questions or issues related to the approval workflow, refer to the project repository or contact the development team.

---

*Last Updated: 2025-10-28*
*Version: 1.0*
