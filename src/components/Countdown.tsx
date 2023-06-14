import { Box, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';

interface CountdownProps {
  date: Date;
}

const Countdown: React.FC<CountdownProps> = ({ date }) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [days, setDays] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = date.getTime() - now;
      setSeconds(Math.floor((distance % (1000 * 60)) / 1000));
      setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setDays(Math.floor(distance / (1000 * 60 * 60 * 24)));
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 10px'
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{days}</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Days</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 10px'
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{hours}</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Hours</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 10px'
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{minutes}</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Minutes</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 10px'
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{seconds}</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Seconds</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Countdown;
