import { useContext } from 'react'
import { AppBar, Toolbar, Typography, IconButton, Button, useTheme, Box } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ApiIcon from '@mui/icons-material/Api'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { ColorModeContext } from '../main'

interface AppBarProps {
  drawerOpen: boolean
  drawerWidth: number
  drawerWidthClosed: number
  onMenuClick: () => void
}

export default function AppBarComponent({
  drawerOpen,
  drawerWidth,
  drawerWidthClosed,
  onMenuClick,
}: AppBarProps) {
  const theme = useTheme()
  const colorMode = useContext(ColorModeContext)

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        width: {
          sm: `calc(100% - ${drawerOpen ? drawerWidth : drawerWidthClosed}px)`,
        },
        ml: {
          sm: `${drawerOpen ? drawerWidth : drawerWidthClosed}px`,
        },
        transition: (theme) =>
          theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#003366',
        borderBottom: theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <img
            src="/fema-logo.svg"
            alt="FEMA Logo"
            style={{
              height: '50px',
              marginRight: '16px'
            }}
          />
        </Box>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Disaster Assistance
        </Typography>
        <IconButton
          sx={{
            mr: 1,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#003366'
          }}
          onClick={colorMode.toggleColorMode}
          aria-label="toggle theme"
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Button
          sx={{
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#003366',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 51, 102, 0.04)'
            }
          }}
          startIcon={<ApiIcon />}
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          API Docs
        </Button>
      </Toolbar>
    </AppBar>
  )
}
