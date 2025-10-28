import { Box, Toolbar, Typography, Card, CardContent, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Map from './Map'
import { WorkflowDocumentation } from './WorkflowDocumentation'

interface MainContentProps {
  drawerOpen: boolean
  drawerWidth: number
  drawerWidthClosed: number
  selectedPage: string
}

interface ApiData {
  message: string
  timestamp: string
}

export default function MainContent({
  drawerOpen,
  drawerWidth,
  drawerWidthClosed,
  selectedPage,
}: MainContentProps) {
  const [apiData, setApiData] = useState<ApiData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => setApiData(data))
      .catch((err) => setError(err.message))
  }, [])

  // Render Dashboard with Map
  if (selectedPage === 'Dashboard') {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            sm: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthClosed}px)`,
          },
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          height: 'calc(100vh - 64px)',
        }}
      >
        <Toolbar />
        <Map />
      </Box>
    )
  }

  // Render Workflow Documentation page
  if (selectedPage === 'Workflow Documentation') {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            sm: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthClosed}px)`,
          },
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          overflowY: 'auto',
          height: 'calc(100vh - 64px)',
        }}
      >
        <Toolbar />
        <WorkflowDocumentation />
      </Box>
    )
  }

  // Render other pages
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: {
          sm: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthClosed}px)`,
        },
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      <Toolbar />
      <motion.div
        key={selectedPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Typography variant="h4" gutterBottom>
          {selectedPage}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Welcome
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  This is a React + FastAPI application template with Material-UI and Framer Motion.
                  Navigate using the drawer on the left.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Status
                </Typography>
                {error ? (
                  <Typography variant="body1" color="error">
                    Error: {error}
                  </Typography>
                ) : apiData ? (
                  <>
                    <Typography variant="body1" color="text.secondary">
                      {apiData.message}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Timestamp: {new Date(apiData.timestamp).toLocaleString()}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Loading...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedPage} Content
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  This is the main content area for the {selectedPage} page.
                  Add your custom components and functionality here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  )
}
