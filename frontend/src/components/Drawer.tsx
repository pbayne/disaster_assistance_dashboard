import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material'
import { motion } from 'framer-motion'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import AssessmentIcon from '@mui/icons-material/Assessment'
import DescriptionIcon from '@mui/icons-material/Description'
import SettingsIcon from '@mui/icons-material/Settings'

interface DrawerProps {
  open: boolean
  drawerWidth: number
  drawerWidthClosed: number
  selectedPage: string
  onPageSelect: (page: string) => void
}

interface NavItem {
  text: string
  icon: React.ReactElement
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon /> },
  { text: 'Analytics', icon: <AnalyticsIcon /> },
  { text: 'Reports', icon: <AssessmentIcon /> },
  { text: 'Workflow Documentation', icon: <DescriptionIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> },
]

export default function DrawerComponent({
  open,
  drawerWidth,
  drawerWidthClosed,
  selectedPage,
  onPageSelect,
}: DrawerProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : drawerWidthClosed,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : drawerWidthClosed,
          boxSizing: 'border-box',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={selectedPage === item.text}
              onClick={() => onPageSelect(item.text)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <motion.div
                initial={false}
                animate={{
                  opacity: open ? 1 : 0,
                  width: open ? 'auto' : 0,
                }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <ListItemText primary={item.text} />
              </motion.div>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}
