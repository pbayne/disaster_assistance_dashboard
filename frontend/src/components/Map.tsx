import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface LocationData {
  id: number
  name: string
  lat: number
  lng: number
  value: number
  status: 'active' | 'warning' | 'inactive'
  description: string
}

// Sample location data
const sampleLocations: LocationData[] = [
  {
    id: 1,
    name: 'San Francisco',
    lat: 37.7749,
    lng: -122.4194,
    value: 1250,
    status: 'active',
    description: 'Primary data center with high traffic',
  },
  {
    id: 2,
    name: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    value: 980,
    status: 'active',
    description: 'East coast operations hub',
  },
  {
    id: 3,
    name: 'London',
    lat: 51.5074,
    lng: -0.1278,
    value: 750,
    status: 'warning',
    description: 'European regional center',
  },
  {
    id: 4,
    name: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    value: 890,
    status: 'active',
    description: 'Asia-Pacific headquarters',
  },
  {
    id: 5,
    name: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    value: 450,
    status: 'inactive',
    description: 'Oceania satellite office',
  },
]

// Component to handle map updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function Map() {
  const [locations, setLocations] = useState<LocationData[]>(sampleLocations)
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0])

  // Simulate reactive data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          value: Math.floor(Math.random() * 1000) + 400,
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50'
      case 'warning':
        return '#ff9800'
      case 'inactive':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'warning':
        return 'warning'
      case 'inactive':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleLocationClick = (location: LocationData) => {
    setSelectedLocation(location)
    setMapCenter([location.lat, location.lng])
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Typography variant="h5" gutterBottom>
          Global Operations Dashboard
        </Typography>
      </motion.div>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {locations.map((location, index) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              sx={{
                minWidth: 180,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                border: selectedLocation?.id === location.id ? 2 : 0,
                borderColor: 'primary.main',
              }}
              onClick={() => handleLocationClick(location)}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" component="div">
                    {location.name}
                  </Typography>
                  <Chip
                    label={location.status.toUpperCase()}
                    color={getStatusChipColor(location.status) as any}
                    size="small"
                  />
                  <Typography variant="h4" color="primary">
                    {location.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Users
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ flex: 1, minHeight: '500px' }}
      >
        <Card sx={{ height: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapUpdater center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => (
              <div key={location.id}>
                <Circle
                  center={[location.lat, location.lng]}
                  radius={location.value * 100}
                  pathOptions={{
                    fillColor: getStatusColor(location.status),
                    fillOpacity: 0.3,
                    color: getStatusColor(location.status),
                    weight: 2,
                  }}
                />
                <Marker
                  position={[location.lat, location.lng]}
                  eventHandlers={{
                    click: () => handleLocationClick(location),
                  }}
                >
                  <Popup>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="h6">{location.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.description}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                        {location.value}
                      </Typography>
                      <Typography variant="caption">Active Users</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={location.status.toUpperCase()}
                          color={getStatusChipColor(location.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        </Card>
      </motion.div>

      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Location: {selectedLocation.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedLocation.description}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">
                  <strong>Status:</strong>
                </Typography>
                <Chip
                  label={selectedLocation.status.toUpperCase()}
                  color={getStatusChipColor(selectedLocation.status) as any}
                  size="small"
                />
                <Typography variant="body2">
                  <strong>Active Users:</strong> {selectedLocation.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  )
}
