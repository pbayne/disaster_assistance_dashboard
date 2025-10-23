import { AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ApiIcon from '@mui/icons-material/Api'

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
          Databricks Application
        </Typography>
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
