import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ExploreIcon from '@mui/icons-material/Explore';
import BackpackIcon from '@mui/icons-material/Backpack';
import PeopleIcon from '@mui/icons-material/People';

export default function BottomNav() {
    const [value, setValue] = React.useState(1); // Default to Explore (Pink)

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation
                showLabels={false}
                value={value}
                onChange={(event, newValue) => {
                    setValue(newValue);
                }}
                sx={{
                    height: 70,
                    '& .Mui-selected': {
                        '& .MuiBottomNavigationAction-icon': {
                            backgroundColor: '#FF2E5B',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '8px',
                            fontSize: '2rem',
                            transform: 'translateY(-10px)',
                            boxShadow: '0 4px 12px rgba(255, 46, 91, 0.4)',
                        },
                    },
                    '& .MuiBottomNavigationAction-icon': {
                        transition: 'all 0.2s ease-in-out',
                        color: '#757575',
                    }
                }}
            >
                <BottomNavigationAction icon={<HomeIcon />} />
                <BottomNavigationAction icon={<ExploreIcon />} />
                <BottomNavigationAction icon={<BackpackIcon />} />
                <BottomNavigationAction icon={<PeopleIcon />} />
            </BottomNavigation>
        </Paper>
    );
}
