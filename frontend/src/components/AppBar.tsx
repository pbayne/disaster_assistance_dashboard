import { useContext } from 'react'
import { AppBar, Toolbar, Typography, IconButton, Button, useTheme } from '@mui/material'
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
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Disaster Assistance
        </Typography>
        <IconButton
          sx={{ mr: 1 }}
          onClick={colorMode.toggleColorMode}
          color="inherit"
          aria-label="toggle theme"
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Button
          color="inherit"
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
