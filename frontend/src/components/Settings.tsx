import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import StorageIcon from '@mui/icons-material/Storage'
import TableChartIcon from '@mui/icons-material/TableChart'

interface DatabaseHealth {
  status: string
  database: string
  host: string
  response_time_ms: number
  tables: {
    [key: string]: number
  }
}

const tableSchemas = [
  {
    name: 'earthquakes',
    description: 'Earthquake event data from USGS API',
    columns: [
      { name: 'id', type: 'VARCHAR', description: 'USGS event ID (Primary Key)' },
      { name: 'magnitude', type: 'FLOAT', description: 'Earthquake magnitude' },
      { name: 'place', type: 'VARCHAR', description: 'Location description' },
      { name: 'time', type: 'BIGINT', description: 'Event time (Unix timestamp ms)' },
      { name: 'latitude', type: 'FLOAT', description: 'Latitude coordinate' },
      { name: 'longitude', type: 'FLOAT', description: 'Longitude coordinate' },
      { name: 'depth', type: 'FLOAT', description: 'Depth in kilometers' },
    ]
  },
  {
    name: 'homeowners',
    description: 'Homeowner assistance applications with approval workflow',
    columns: [
      { name: 'id', type: 'VARCHAR', description: 'Application ID (Primary Key)' },
      { name: 'name', type: 'VARCHAR', description: 'Applicant name' },
      { name: 'address', type: 'VARCHAR', description: 'Property address' },
      { name: 'latitude', type: 'FLOAT', description: 'Property latitude' },
      { name: 'longitude', type: 'FLOAT', description: 'Property longitude' },
      { name: 'damage_level', type: 'VARCHAR', description: 'severe, moderate, or minor' },
      { name: 'estimated_cost', type: 'FLOAT', description: 'Estimated damage cost' },
      { name: 'status', type: 'VARCHAR', description: 'Workflow status' },
      { name: 'review_notes', type: 'TEXT', description: 'Admin/applicant notes' },
    ]
  },
  {
    name: 'inspectors',
    description: 'Building inspector information',
    columns: [
      { name: 'id', type: 'VARCHAR', description: 'Inspector ID (Primary Key)' },
      { name: 'name', type: 'VARCHAR', description: 'Inspector name' },
      { name: 'contact', type: 'VARCHAR', description: 'Contact information' },
      { name: 'specialty', type: 'VARCHAR', description: 'Inspection specialty' },
      { name: 'availability', type: 'VARCHAR', description: 'Availability status' },
    ]
  },
  {
    name: 'sync_metadata',
    description: 'Synchronization status tracking for data imports',
    columns: [
      { name: 'id', type: 'SERIAL', description: 'Metadata ID (Primary Key)' },
      { name: 'sync_type', type: 'VARCHAR', description: 'Type of sync (earthquake, etc.)' },
      { name: 'last_sync_time', type: 'BIGINT', description: 'Last sync timestamp (Unix ms)' },
      { name: 'records_synced', type: 'INTEGER', description: 'Number of records synced' },
      { name: 'status', type: 'VARCHAR', description: 'success, failed, or pending' },
    ]
  }
]

export function Settings() {
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDatabaseHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDatabaseHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDatabaseHealth = async () => {
    try {
      const response = await fetch('/api/database/health')
      const data = await response.json()

      if (response.ok) {
        setDbHealth(data)
        setError(null)
      } else {
        setError(data.detail || 'Failed to fetch database health')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to database')
    } finally {
      setLoading(false)
    }
  }

  const isConnected = dbHealth?.status === 'connected'

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Settings & Data Source Information
      </Typography>

      {/* Database Connection Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">
                  Database Connection
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Checking connection...
                  </Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Connection Failed:</strong> {error}
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Chip
                    icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={isConnected ? 'Connected' : 'Disconnected'}
                    color={isConnected ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  />

                  {dbHealth && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Database:</strong> {dbHealth.database}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Host:</strong> {dbHealth.host}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Response Time:</strong> {dbHealth.response_time_ms.toFixed(1)}ms
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TableChartIcon sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">
                  Data Statistics
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Loading statistics...
                  </Typography>
                </Box>
              ) : dbHealth?.tables ? (
                <Box>
                  {Object.entries(dbHealth.tables).map(([table, count]) => (
                    <Box key={table} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {table}:
                      </Typography>
                      <Typography variant="body2" color="text.primary" fontWeight="bold">
                        {count.toLocaleString()} records
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Database Schema Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Database Schema
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This application uses <strong>PostgreSQL</strong> (via Neon serverless) for persistent data storage.
            All data is stored in the following tables:
          </Typography>

          {tableSchemas.map((table) => (
            <Box key={table.name} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                {table.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {table.description}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell><strong>Column</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {table.columns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {column.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={column.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {column.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Data Sources
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Earthquake Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sourced from the <strong>USGS Earthquake API</strong> (earthquake.usgs.gov).
              Data is synchronized periodically and stored in the <code>earthquakes</code> table.
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Homeowner Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manually created and managed in the database. Each application goes through an approval
              workflow tracked in the <code>homeowners</code> table with statuses: Pending, Under Review,
              Ready for Review, Approved, or Rejected.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
