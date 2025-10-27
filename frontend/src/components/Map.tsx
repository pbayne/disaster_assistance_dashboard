import { useEffect, useState, useRef } from 'react'
import Map, { Marker, Popup, NavigationControl, Layer, Source } from 'react-map-gl/maplibre'
import { Box, Card, CardContent, Typography, Stack, Chip, ToggleButtonGroup, ToggleButton, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Grid, FormControl, InputLabel, Select, MenuItem, TableSortLabel, TextField, IconButton, Alert, Snackbar, ButtonGroup } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import CloseIcon from '@mui/icons-material/Close'
import ClearIcon from '@mui/icons-material/Clear'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'
import { motion } from 'framer-motion'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../map-popup.css'

interface EarthquakeData {
  id: string
  magnitude: number
  place: string
  time: number
  longitude: number
  latitude: number
  depth: number
  url: string
  tsunami: number
  type: string
}

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
  approval_action?: string
  approval_comment?: string
  approver_name?: string
  approval_date?: string
  applicant_response?: string
  applicant_response_date?: string
}

// Get API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use localhost:8000
  // In production (Databricks), use relative paths
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  return ''
}

// Helper function to create a circle polygon around a point
const createCircle = (longitude: number, latitude: number, radiusMiles: number): [number, number][] => {
  const points = 64 // Number of points to make the circle smooth
  const coords: [number, number][] = []

  // Convert miles to degrees (approximate)
  // 1 degree latitude ≈ 69 miles
  // 1 degree longitude varies by latitude
  const radiusLat = radiusMiles / 69
  const radiusLng = radiusMiles / (69 * Math.cos(latitude * Math.PI / 180))

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = radiusLng * Math.cos(angle)
    const dy = radiusLat * Math.sin(angle)
    coords.push([longitude + dx, latitude + dy])
  }

  return coords
}

export default function MapComponent() {
  const theme = useTheme()
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([])
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeData | null>(null)
  const [radiusCircle, setRadiusCircle] = useState<[number, number][] | null>(null)
  const [homeowners, setHomeowners] = useState<HomeownerApplicant[]>([])
  const [selectedHomeowner, setSelectedHomeowner] = useState<HomeownerApplicant | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsHomeowner, setDetailsHomeowner] = useState<HomeownerApplicant | null>(null)
  const [timeframe, setTimeframe] = useState<string>('day')
  const [minMagnitude, setMinMagnitude] = useState<number>(2.5)
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5
  })

  // Sorting and filtering state
  const [sortColumn, setSortColumn] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDamageType, setFilterDamageType] = useState<string>('all')
  const [filterAssistanceType, setFilterAssistanceType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const tableRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({})
  const mapRef = useRef<any>(null)

  // Approval workflow state
  const [approvalComment, setApprovalComment] = useState<string>('')
  const [approverName, setApproverName] = useState<string>('')
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false)
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  // Applicant response state
  const [applicantResponse, setApplicantResponse] = useState<string>('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false)

  // Fetch earthquake data
  useEffect(() => {
    const fetchEarthquakes = async () => {
      try {
        const apiBase = getApiBaseUrl()
        const response = await fetch(
          `${apiBase}/api/earthquakes?timeframe=${timeframe}&min_magnitude=${minMagnitude}`
        )
        const data = await response.json()
        setEarthquakes(data.earthquakes || [])
      } catch (error) {
        console.error('Error fetching earthquake data:', error)
      }
    }

    fetchEarthquakes()
    // Refresh earthquake data every 5 minutes
    const interval = setInterval(fetchEarthquakes, 300000)
    return () => clearInterval(interval)
  }, [timeframe, minMagnitude])

  // Scroll to selected homeowner row in table
  useEffect(() => {
    if (selectedHomeowner && tableRowRefs.current[selectedHomeowner.id]) {
      tableRowRefs.current[selectedHomeowner.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [selectedHomeowner])

  const getEarthquakeColor = (magnitude: number) => {
    if (magnitude >= 6.0) return '#d32f2f' // Major
    if (magnitude >= 5.0) return '#f57c00' // Strong
    if (magnitude >= 4.0) return '#fbc02d' // Moderate
    if (magnitude >= 3.0) return '#ffeb3b' // Light
    return '#8bc34a' // Minor
  }

  const getEarthquakeSize = (magnitude: number) => {
    return Math.max(10, magnitude * 6)
  }

  const getHomeownerStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#4caf50' // Green
      case 'Under Review':
        return '#ff9800' // Orange
      case 'Ready for Review':
        return '#2196f3' // Blue
      case 'Pending':
        return '#9e9e9e' // Gray
      case 'Processing':
        return '#2196f3' // Blue
      case 'Rejected':
        return '#f44336' // Red
      default:
        return '#2196f3' // Default blue
    }
  }

  const getHomeownerIconSize = (estimatedDamage: number, isSelected: boolean) => {
    // Scale based on damage: $5k-$150k range
    // Base size: 16-32, Selected adds 8px, Hover adds more
    const minDamage = 5000
    const maxDamage = 150000
    const minSize = 16
    const maxSize = 32

    const normalizedDamage = Math.min(Math.max(estimatedDamage, minDamage), maxDamage)
    const scale = (normalizedDamage - minDamage) / (maxDamage - minDamage)
    const baseSize = minSize + (scale * (maxSize - minSize))

    return isSelected ? baseSize + 8 : baseSize
  }

  const handleEarthquakeClick = async (earthquake: EarthquakeData) => {
    setSelectedEarthquake(earthquake)
    setSelectedHomeowner(null)

    // Create 25-mile radius circle around the earthquake
    const circle = createCircle(earthquake.longitude, earthquake.latitude, 25)
    setRadiusCircle(circle)

    // Fetch homeowner applicants within the radius
    try {
      const apiBase = getApiBaseUrl()
      const response = await fetch(
        `${apiBase}/api/homeowners?latitude=${earthquake.latitude}&longitude=${earthquake.longitude}&radius_miles=25`
      )
      const data = await response.json()
      setHomeowners(data.applicants || [])
    } catch (error) {
      console.error('Error fetching homeowner data:', error)
      setHomeowners([])
    }

    // Zoom to earthquake location
    setViewState({
      ...viewState,
      longitude: earthquake.longitude,
      latitude: earthquake.latitude,
      zoom: 8
    })
  }

  const handleHomeownerRowClick = (homeowner: HomeownerApplicant) => {
    setSelectedHomeowner(homeowner)
    // Zoom to homeowner location
    setViewState({
      ...viewState,
      longitude: homeowner.longitude,
      latitude: homeowner.latitude,
      zoom: 12
    })
  }

  const handleOpenDetails = (homeowner: HomeownerApplicant, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click
    setDetailsHomeowner(homeowner)
    setDetailsDialogOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false)
    // Reset forms
    setApprovalComment('')
    setApproverName('')
    setApplicantResponse('')
  }

  const handleApprovalAction = async (action: 'approve' | 'reject' | 'request_more_info') => {
    if (!detailsHomeowner) return

    if (!approvalComment.trim()) {
      setSnackbarMessage('Please enter a comment')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    if (!approverName.trim()) {
      setSnackbarMessage('Please enter your name')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    setIsSubmittingApproval(true)

    try {
      const apiBase = getApiBaseUrl()
      const response = await fetch(
        `${apiBase}/api/applications/${detailsHomeowner.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            comment: approvalComment,
            approver_name: approverName,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setSnackbarMessage(`Application ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for more information'}`)
        setSnackbarSeverity('success')
        setSnackbarOpen(true)

        // Update the details homeowner with new data
        if (data.application) {
          // Merge the approval data with existing homeowner data
          const updatedHomeowner = {
            ...detailsHomeowner,
            ...data.application
          }
          setDetailsHomeowner(updatedHomeowner)

          // Update homeowners list - merge approval data with existing data
          setHomeowners(prevHomeowners =>
            prevHomeowners.map(h =>
              h.id === detailsHomeowner.id ? { ...h, ...data.application } : h
            )
          )
        }

        // Reset form
        setApprovalComment('')
        setApproverName('')
      } else {
        setSnackbarMessage(data.detail || 'Failed to submit approval')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Error submitting approval:', error)
      setSnackbarMessage('Error submitting approval')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const handleSubmitApplicantResponse = async () => {
    if (!detailsHomeowner) return

    if (!applicantResponse.trim()) {
      setSnackbarMessage('Please enter a response')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    setIsSubmittingResponse(true)

    try {
      const apiBase = getApiBaseUrl()
      const response = await fetch(
        `${apiBase}/api/applications/${detailsHomeowner.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            response: applicantResponse,
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setSnackbarMessage('Response submitted successfully! Status changed to Ready for Review.')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)

        // Update the details homeowner with new data
        if (data.application) {
          const updatedHomeowner = {
            ...detailsHomeowner,
            ...data.application
          }
          setDetailsHomeowner(updatedHomeowner)

          // Update homeowners list
          setHomeowners(prevHomeowners =>
            prevHomeowners.map(h =>
              h.id === detailsHomeowner.id ? { ...h, ...data.application } : h
            )
          )
        }

        // Reset form
        setApplicantResponse('')
      } else {
        setSnackbarMessage(data.detail || 'Failed to submit response')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      setSnackbarMessage('Error submitting response')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const handleMapLoad = () => {
    if (!mapRef.current) return

    const map = mapRef.current.getMap()

    // Increase font sizes for street labels
    map.on('styledata', () => {
      const layers = map.getStyle().layers

      layers.forEach((layer: any) => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          // Increase text size for all text labels
          if (layer.layout['text-size']) {
            const currentSize = layer.layout['text-size']
            if (typeof currentSize === 'number') {
              map.setLayoutProperty(layer.id, 'text-size', currentSize * 1.5)
            } else if (currentSize.stops) {
              // Handle zoom-based sizing
              const newStops = currentSize.stops.map((stop: any) => [stop[0], stop[1] * 1.5])
              map.setLayoutProperty(layer.id, 'text-size', { ...currentSize, stops: newStops })
            }
          }
        }
      })
    })
  }

  // Sorting and filtering logic
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterDamageType('all')
    setFilterAssistanceType('all')
    setSearchQuery('')
  }

  // Get filtered and sorted homeowners
  const getFilteredAndSortedHomeowners = () => {
    let filtered = [...homeowners]

    // Apply filters
    if (filterStatus !== 'all') {
      filtered = filtered.filter(h => h.status === filterStatus)
    }
    if (filterDamageType !== 'all') {
      filtered = filtered.filter(h => h.damage_type === filterDamageType)
    }
    if (filterAssistanceType !== 'all') {
      filtered = filtered.filter(h => h.assistance_requested === filterAssistanceType)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(h =>
        h.id.toLowerCase().includes(query) ||
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.phone.includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof HomeownerApplicant]
      let bValue: any = b[sortColumn as keyof HomeownerApplicant]

      // Handle numeric sorting
      if (sortColumn === 'estimated_damage' || sortColumn === 'family_size') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }

  const filteredHomeowners = getFilteredAndSortedHomeowners()

  // Get unique values for filters
  const uniqueStatuses = Array.from(new Set(homeowners.map(h => h.status)))
  const uniqueDamageTypes = Array.from(new Set(homeowners.map(h => h.damage_type)))
  const uniqueAssistanceTypes = Array.from(new Set(homeowners.map(h => h.assistance_requested)))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #006699 0%, #003366 100%)'
              : 'linear-gradient(135deg, #003366 0%, #006699 100%)',
            borderRadius: 3,
            p: 3,
            mb: 2,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            🌍 Global Earthquake Monitor
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Real-time earthquake data with homeowner assistance tracking
          </Typography>
        </Box>
      </motion.div>

      {/* Earthquake Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom right, #1e293b, #0f172a)'
            : 'linear-gradient(to bottom right, #ffffff, #f0f9ff)',
          border: '2px solid',
          borderColor: 'primary.light',
        }}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #006699, #89d1d6)'
                    : 'linear-gradient(135deg, #003366, #006699)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}>
                  ⚡ Earthquake Data ({earthquakes.length} events)
                </Typography>
              </Box>

              <Box>
                <Typography gutterBottom>Timeframe</Typography>
                <ToggleButtonGroup
                  value={timeframe}
                  exclusive
                  onChange={(_, value) => value && setTimeframe(value)}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="hour">Past Hour</ToggleButton>
                  <ToggleButton value="day">Past Day</ToggleButton>
                  <ToggleButton value="week">Past Week</ToggleButton>
                  <ToggleButton value="month">Past Month</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography gutterBottom>
                  Minimum Magnitude: {minMagnitude}
                </Typography>
                <Slider
                  value={minMagnitude}
                  onChange={(_, value) => setMinMagnitude(value as number)}
                  min={1.0}
                  max={6.0}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                  color="primary"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ flex: 1, minHeight: '500px' }}
      >
        <Card sx={{ height: '100%' }}>
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onLoad={handleMapLoad}
            style={{ width: '100%', height: '100%' }}
            mapStyle={
              theme.palette.mode === 'dark'
                ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
            }
          >
            <NavigationControl position="top-right" />

            {/* 25-Mile Radius Circle */}
            {radiusCircle && (
              <Source
                id="radius-circle"
                type="geojson"
                data={{
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [radiusCircle]
                  },
                  properties: {}
                }}
              >
                <Layer
                  id="circle-fill"
                  type="fill"
                  paint={{
                    'fill-color': '#ff6b6b',
                    'fill-opacity': 0.15
                  }}
                />
                <Layer
                  id="circle-outline"
                  type="line"
                  paint={{
                    'line-color': '#ff6b6b',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                  }}
                />
              </Source>
            )}

            {/* Homeowner Markers */}
            {homeowners.map((homeowner) => (
              <Marker
                key={homeowner.id}
                longitude={homeowner.longitude}
                latitude={homeowner.latitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  handleHomeownerRowClick(homeowner)
                }}
              >
                <HomeIcon
                  sx={{
                    fontSize: getHomeownerIconSize(homeowner.estimated_damage, selectedHomeowner?.id === homeowner.id),
                    color: getHomeownerStatusColor(homeowner.status),
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      fontSize: 48,
                    },
                  }}
                />
              </Marker>
            ))}

            {/* Earthquake Markers */}
            {earthquakes.map((earthquake) => (
              <Marker
                key={earthquake.id}
                longitude={earthquake.longitude}
                latitude={earthquake.latitude}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation()
                  handleEarthquakeClick(earthquake)
                }}
              >
                <Box
                  sx={{
                    width: getEarthquakeSize(earthquake.magnitude),
                    height: getEarthquakeSize(earthquake.magnitude),
                    borderRadius: '50%',
                    backgroundColor: getEarthquakeColor(earthquake.magnitude),
                    border: '2px solid white',
                    boxShadow: 3,
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.3)',
                      opacity: 1,
                    },
                  }}
                />
              </Marker>
            ))}

            {/* Earthquake Popup */}
            {selectedEarthquake && (
              <Popup
                anchor="top"
                longitude={selectedEarthquake.longitude}
                latitude={selectedEarthquake.latitude}
                onClose={() => {
                  setSelectedEarthquake(null)
                  setRadiusCircle(null)
                }}
                closeOnClick={false}
              >
                <Box sx={{
                  p: 2,
                  minWidth: 250,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)'
                    : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}>
                  <Typography variant="h6" sx={{ color: getEarthquakeColor(selectedEarthquake.magnitude) }}>
                    M {selectedEarthquake.magnitude.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedEarthquake.place}
                  </Typography>
                  <Chip
                    label="25-mile radius"
                    size="small"
                    sx={{
                      mb: 1,
                      backgroundColor: 'rgba(255, 107, 107, 0.2)',
                      border: '1px solid #ff6b6b',
                      color: '#ff6b6b'
                    }}
                  />
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.primary">
                      <strong>Depth:</strong> {selectedEarthquake.depth.toFixed(1)} km
                    </Typography>
                    <Typography variant="caption" color="text.primary">
                      <strong>Time:</strong> {new Date(selectedEarthquake.time).toLocaleString()}
                    </Typography>
                    {selectedEarthquake.tsunami === 1 && (
                      <Chip label="TSUNAMI WARNING" color="error" size="small" sx={{ mt: 0.5 }} />
                    )}
                  </Stack>
                </Box>
              </Popup>
            )}
          </Map>
        </Card>
      </motion.div>

      {/* Homeowner Assistance Applicants Table */}
      {homeowners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Homeowner Assistance Applicants ({filteredHomeowners.length} of {homeowners.length})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click column headers to sort • Click a row to highlight on the map
                  </Typography>
                </Box>
                <IconButton onClick={clearFilters} size="small" title="Clear all filters">
                  <ClearIcon />
                </IconButton>
              </Box>

              {/* Filter Controls */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, Name, Address, Phone..."
                  sx={{ minWidth: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {uniqueStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Damage Type</InputLabel>
                  <Select
                    value={filterDamageType}
                    label="Damage Type"
                    onChange={(e) => setFilterDamageType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {uniqueDamageTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Assistance Type</InputLabel>
                  <Select
                    value={filterAssistanceType}
                    label="Assistance Type"
                    onChange={(e) => setFilterAssistanceType(e.target.value)}
                  >
                    <MenuItem value="all">All Assistance</MenuItem>
                    {uniqueAssistanceTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'id'}
                          direction={sortColumn === 'id' ? sortDirection : 'asc'}
                          onClick={() => handleSort('id')}
                        >
                          <strong>ID</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'name'}
                          direction={sortColumn === 'name' ? sortDirection : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          <strong>Name</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'address'}
                          direction={sortColumn === 'address' ? sortDirection : 'asc'}
                          onClick={() => handleSort('address')}
                        >
                          <strong>Address</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'damage_type'}
                          direction={sortColumn === 'damage_type' ? sortDirection : 'asc'}
                          onClick={() => handleSort('damage_type')}
                        >
                          <strong>Damage Type</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'assistance_requested'}
                          direction={sortColumn === 'assistance_requested' ? sortDirection : 'asc'}
                          onClick={() => handleSort('assistance_requested')}
                        >
                          <strong>Assistance Needed</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'status'}
                          direction={sortColumn === 'status' ? sortDirection : 'asc'}
                          onClick={() => handleSort('status')}
                        >
                          <strong>Status</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'family_size'}
                          direction={sortColumn === 'family_size' ? sortDirection : 'asc'}
                          onClick={() => handleSort('family_size')}
                        >
                          <strong>Family Size</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'estimated_damage'}
                          direction={sortColumn === 'estimated_damage' ? sortDirection : 'asc'}
                          onClick={() => handleSort('estimated_damage')}
                        >
                          <strong>Est. Damage</strong>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHomeowners.map((homeowner) => (
                      <TableRow
                        key={homeowner.id}
                        ref={(el) => (tableRowRefs.current[homeowner.id] = el)}
                        hover
                        onClick={() => handleHomeownerRowClick(homeowner)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: selectedHomeowner?.id === homeowner.id ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
                          '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.08)',
                          },
                        }}
                      >
                        <TableCell
                          onClick={(e) => handleOpenDetails(homeowner, e)}
                          sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {homeowner.id}
                            {homeowner.has_fraud_flag && (
                              <ErrorIcon sx={{ fontSize: 16, color: '#cc1f36' }} titleAccess="Fraud indicators detected" />
                            )}
                            {homeowner.risk_score >= 70 && !homeowner.has_fraud_flag && (
                              <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} titleAccess="High risk score" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{homeowner.name}</TableCell>
                        <TableCell>{homeowner.address}</TableCell>
                        <TableCell>{homeowner.phone}</TableCell>
                        <TableCell>{homeowner.damage_type}</TableCell>
                        <TableCell>{homeowner.assistance_requested}</TableCell>
                        <TableCell>
                          <Chip
                            label={homeowner.status}
                            size="small"
                            color={
                              homeowner.status === 'Approved' ? 'success' :
                              homeowner.status === 'Under Review' ? 'warning' :
                              homeowner.status === 'Ready for Review' ? 'info' :
                              homeowner.status === 'Pending' ? 'default' :
                              homeowner.status === 'Rejected' ? 'error' : 'info'
                            }
                          />
                        </TableCell>
                        <TableCell>{homeowner.family_size || 'N/A'}</TableCell>
                        <TableCell>{homeowner.estimated_damage ? `$${homeowner.estimated_damage.toLocaleString()}` : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Homeowner Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to bottom right, #1e293b, #0f172a)'
              : 'linear-gradient(to bottom right, #ffffff, #f0f9ff)',
          }
        }}
      >
        {detailsHomeowner && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Assistance Case Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Application ID: {detailsHomeowner.id}
                  </Typography>
                </Box>
                <Button
                  onClick={handleCloseDetails}
                  sx={{ minWidth: 'auto', p: 1 }}
                  color="inherit"
                >
                  <CloseIcon />
                </Button>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${getHomeownerStatusColor(detailsHomeowner.status)}22, ${getHomeownerStatusColor(detailsHomeowner.status)}11)`,
                    border: `2px solid ${getHomeownerStatusColor(detailsHomeowner.status)}`,
                    borderRadius: 2,
                    p: 2,
                    mb: 2
                  }}>
                    <Typography variant="overline" color="text.secondary">
                      Application Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={detailsHomeowner.status}
                        sx={{
                          backgroundColor: getHomeownerStatusColor(detailsHomeowner.status),
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Applied: {new Date(detailsHomeowner.application_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="text.secondary">
                    Applicant Information
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {detailsHomeowner.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{detailsHomeowner.phone}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body1">{detailsHomeowner.address}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Family Size</Typography>
                      <Typography variant="body1">{detailsHomeowner.family_size} members</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="text.secondary">
                    Damage Assessment
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Damage Type</Typography>
                      <Chip
                        label={detailsHomeowner.damage_type}
                        size="small"
                        color="warning"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Estimated Damage</Typography>
                      <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 700 }}>
                        ${detailsHomeowner.estimated_damage.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Property Value</Typography>
                      <Typography variant="body1">${detailsHomeowner.estimated_property_value.toLocaleString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Damage Percentage</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: detailsHomeowner.damage_percentage > 60 ? 'error.main' : 'text.primary' }}>
                        {detailsHomeowner.damage_percentage}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assistance Requested</Typography>
                      <Typography variant="body1">{detailsHomeowner.assistance_requested}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Risk Assessment */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="overline" color="text.secondary">
                    Risk Assessment
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                      <Chip
                        label={`${detailsHomeowner.risk_score}/100`}
                        size="small"
                        sx={{
                          backgroundColor:
                            detailsHomeowner.risk_score >= 70 ? '#cc1f36' :
                            detailsHomeowner.risk_score >= 40 ? '#f59e0b' : '#10b981',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                      {detailsHomeowner.inspector_assigned && (
                        <Chip
                          label={`Inspector: ${detailsHomeowner.inspector_name || 'Assigned'}`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Fraud Indicators */}
                {detailsHomeowner.has_fraud_flag && detailsHomeowner.fraud_indicators.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{
                      backgroundColor: 'rgba(204, 31, 54, 0.1)',
                      border: '2px solid #cc1f36',
                      borderRadius: 2,
                      p: 2
                    }}>
                      <Typography variant="overline" sx={{ color: '#cc1f36', fontWeight: 700 }}>
                        ⚠️ Fraud Indicators Detected
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {detailsHomeowner.fraud_indicators.map((indicator, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#cc1f36' }}>
                            • {indicator}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Missing Documents */}
                {detailsHomeowner.missing_documents.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                      border: '2px solid #f59e0b',
                      borderRadius: 2,
                      p: 2
                    }}>
                      <Typography variant="overline" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                        📄 Missing Documents ({detailsHomeowner.missing_documents.length})
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {detailsHomeowner.missing_documents.map((doc, idx) => (
                          <Typography key={idx} variant="body2">
                            • {doc}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Next Steps */}
                {detailsHomeowner.next_steps.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 102, 153, 0.1)' : 'rgba(0, 102, 153, 0.05)',
                      border: '2px solid #006699',
                      borderRadius: 2,
                      p: 2
                    }}>
                      <Typography variant="overline" sx={{ color: '#006699', fontWeight: 700 }}>
                        📋 Next Steps
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {detailsHomeowner.next_steps.map((step, idx) => (
                          <Typography key={idx} variant="body2">
                            {idx + 1}. {step}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Approval Workflow Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.875rem' }}>
                    📝 Approval Workflow
                  </Typography>

                  {/* Display existing approval info if any */}
                  {detailsHomeowner.approval_action && (
                    <Box sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      p: 2,
                      mt: 2,
                      mb: 2
                    }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Action:</Typography>
                          <Chip
                            label={detailsHomeowner.approval_action.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={
                              detailsHomeowner.approval_action === 'approve' ? 'success' :
                              detailsHomeowner.approval_action === 'reject' ? 'error' : 'warning'
                            }
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Comment:</Typography>
                          <Typography variant="body2">{detailsHomeowner.approval_comment}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Approver:</Typography>
                          <Typography variant="body2">{detailsHomeowner.approver_name}</Typography>
                        </Box>
                        {detailsHomeowner.approval_date && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Date:</Typography>
                            <Typography variant="body2">
                              {new Date(detailsHomeowner.approval_date).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Approval action form */}
                  <Box sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2,
                    p: 2,
                    mt: 2
                  }}>
                    <Stack spacing={2}>
                      <TextField
                        label="Your Name (Approver)"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        fullWidth
                        size="small"
                        required
                      />
                      <TextField
                        label="Comment"
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        required
                        placeholder="Enter your approval/rejection comment or request for additional information..."
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Select Action:
                        </Typography>
                        <ButtonGroup fullWidth variant="outlined">
                          <Button
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApprovalAction('approve')}
                            disabled={isSubmittingApproval}
                          >
                            Approve
                          </Button>
                          <Button
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleApprovalAction('reject')}
                            disabled={isSubmittingApproval}
                          >
                            Reject
                          </Button>
                          <Button
                            color="warning"
                            startIcon={<InfoIcon />}
                            onClick={() => handleApprovalAction('request_more_info')}
                            disabled={isSubmittingApproval}
                          >
                            Request More Info
                          </Button>
                        </ButtonGroup>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Note: Approve sets status to "Approved", Reject to "Rejected", Request More Info to "Under Review"
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>

                {/* Applicant Response Section - Only show if status is "Under Review" */}
                {detailsHomeowner.status === 'Under Review' && detailsHomeowner.approval_action === 'request_more_info' && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="overline" sx={{ color: 'warning.main', fontWeight: 700, fontSize: '0.875rem' }}>
                      📩 Response Required
                    </Typography>

                    {/* Display existing response if any */}
                    {detailsHomeowner.applicant_response && (
                      <Box sx={{
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                        border: '2px solid',
                        borderColor: 'success.main',
                        borderRadius: 2,
                        p: 2,
                        mt: 2,
                        mb: 2
                      }}>
                        <Stack spacing={1}>
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                            ✅ Response Submitted
                          </Typography>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Your Response:</Typography>
                            <Typography variant="body2">{detailsHomeowner.applicant_response}</Typography>
                          </Box>
                          {detailsHomeowner.applicant_response_date && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Submitted:</Typography>
                              <Typography variant="body2">
                                {new Date(detailsHomeowner.applicant_response_date).toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Applicant response form */}
                    <Box sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                      border: '2px solid',
                      borderColor: 'warning.main',
                      borderRadius: 2,
                      p: 2,
                      mt: 2
                    }}>
                      <Stack spacing={2}>
                        <Alert severity="warning" icon={<InfoIcon />}>
                          <strong>Additional Information Required</strong>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            The reviewer has requested more information:
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                            "{detailsHomeowner.approval_comment}"
                          </Typography>
                        </Alert>

                        <TextField
                          label="Your Response"
                          value={applicantResponse}
                          onChange={(e) => setApplicantResponse(e.target.value)}
                          multiline
                          rows={4}
                          fullWidth
                          required
                          placeholder="Provide the requested information or clarification..."
                        />

                        <Button
                          variant="contained"
                          color="warning"
                          onClick={handleSubmitApplicantResponse}
                          disabled={isSubmittingResponse}
                          fullWidth
                          size="large"
                        >
                          {isSubmittingResponse ? 'Submitting...' : 'Submit Response'}
                        </Button>

                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                          Submitting your response will change the status to "Ready for Review"
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {/* Display applicant response for reviewers (when status is "Ready for Review") */}
                {detailsHomeowner.status === 'Ready for Review' && detailsHomeowner.applicant_response && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="overline" sx={{ color: 'info.main', fontWeight: 700, fontSize: '0.875rem' }}>
                      📬 Applicant Response Received
                    </Typography>

                    <Box sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                      border: '2px solid',
                      borderColor: 'info.main',
                      borderRadius: 2,
                      p: 2,
                      mt: 2,
                      mb: 2
                    }}>
                      <Stack spacing={1}>
                        <Alert severity="info" icon={<InfoIcon />}>
                          The applicant has responded to your request for more information
                        </Alert>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Original Request:</Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{detailsHomeowner.approval_comment}"
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Applicant's Response:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                            {detailsHomeowner.applicant_response}
                          </Typography>
                        </Box>
                        {detailsHomeowner.applicant_response_date && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Response Date:</Typography>
                            <Typography variant="body2">
                              {new Date(detailsHomeowner.applicant_response_date).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="overline" color="text.secondary">
                    Location Details
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Latitude</Typography>
                        <Typography variant="body2">{detailsHomeowner.latitude.toFixed(6)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Longitude</Typography>
                        <Typography variant="body2">{detailsHomeowner.longitude.toFixed(6)}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDetails} variant="outlined">
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleHomeownerRowClick(detailsHomeowner)
                  handleCloseDetails()
                }}
              >
                View on Map
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
