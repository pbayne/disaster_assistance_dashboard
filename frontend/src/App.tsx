import { useState } from 'react'
import { Box, CssBaseline } from '@mui/material'
import AppBarComponent from './components/AppBar'
import DrawerComponent from './components/Drawer'
import MainContent from './components/MainContent'

const drawerWidth = 240
const drawerWidthClosed = 65

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [selectedPage, setSelectedPage] = useState('Dashboard')

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handlePageSelect = (page: string) => {
    setSelectedPage(page)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarComponent
        drawerOpen={drawerOpen}
        drawerWidth={drawerWidth}
        drawerWidthClosed={drawerWidthClosed}
        onMenuClick={handleDrawerToggle}
      />
      <DrawerComponent
        open={drawerOpen}
        drawerWidth={drawerWidth}
        drawerWidthClosed={drawerWidthClosed}
        selectedPage={selectedPage}
        onPageSelect={handlePageSelect}
      />
      <MainContent
        drawerOpen={drawerOpen}
        drawerWidth={drawerWidth}
        drawerWidthClosed={drawerWidthClosed}
        selectedPage={selectedPage}
      />
    </Box>
  )
}

export default App
