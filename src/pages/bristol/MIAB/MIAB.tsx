import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Skeleton,
  Typography
} from '@mui/material';
import { ShoppingCart, Launch, Email } from '@mui/icons-material';
import Countdown from '../../../components/Countdown';
import EmailDialog from '../../../components/EmailDialog';
import axios from 'axios';
import Logo from '../../../components/Logo';

interface Chapter {
  num: number;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  isCountdown: boolean;
  isLocked: boolean;
  launchDate?: Date;
}

const chapters: Chapter[] = [
  {
    num: 1,
    title: 'Rory',
    description: `Unleash your inner detective and summon your courage. The fate of the "Man in a Box" lies in your hands, and the secrets of Bristol's shadowy underbelly await those bold enough to step into the abyss. Will you answer the call? He needs you.`,
    price: '£20.95',
    imageUrl: 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/ryan-lg.png',
    isCountdown: false,
    isLocked: false
  },
  {
    num: 2,
    title: 'Rusty',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl: 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/rusty-lg.png',
    isCountdown: true,
    isLocked: false,
    launchDate: new Date('2023-07-15T18:00:00')
  },
  {
    num: 3,
    title: 'Aurelia',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 4,
    title: 'Chloe',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 5,
    title: 'Cyan',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 6,
    title: 'Indira',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 7,
    title: 'Tyrian',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 8,
    title: 'Fate',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 9,
    title: 'Secret Society',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 10,
    title: 'Precipice',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  },
  {
    num: 11,
    title: 'Finale',
    description: 'Here the story begins...',
    price: '£10.95',
    imageUrl:
      'https://cdn.vox-cdn.com/thumbor/ATC7_28szgrkXuoTxCW5yqofHV4=/0x0:5219x3668/1200x800/filters:focal(1467x1198:2301x2032)/cdn.vox-cdn.com/uploads/chorus_image/image/72355950/1496944187.0.jpg',
    isCountdown: false,
    isLocked: true
  }
];

const card = (chapter: Chapter, setOpen: (bool: boolean) => void) => (
  <React.Fragment>
    {chapter.imageUrl ? (
      chapter.isLocked ? (
        <Skeleton sx={{ bgcolor: 'grey.900' }} variant="rectangular" height={140} width="100%" />
      ) : (
        <CardMedia sx={{ height: 140 }} image={chapter.imageUrl} title={chapter.title} />
      )
    ) : (
      ''
    )}
    <CardContent>
      <Typography
        sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}
        color="text.secondary"
        gutterBottom
      >
        Chapter {chapter.num}
      </Typography>
      {chapter.isLocked ? (
        <Skeleton sx={{ bgcolor: 'grey.900' }} variant="rectangular" height={40} width={120} />
      ) : (
        <Typography variant="h5" component="div">
          {chapter.title}
        </Typography>
      )}

      <Typography variant="body2">
        {chapter.isLocked ? (
          'Coming soon...'
        ) : chapter.isCountdown && chapter.launchDate ? (
          <Countdown date={chapter.launchDate}></Countdown>
        ) : (
          chapter.description
        )}
      </Typography>
    </CardContent>
    <CardActions>
      {chapter.isLocked ? (
        ''
      ) : chapter.num === 1 ? (
        <Button variant="outlined" color="success" endIcon={<Launch />}>
          Free ticket on Eventbrite
        </Button>
      ) : chapter.isCountdown ? (
        <>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpen(true)}
            endIcon={<Email />}
          >
            Notify me when ready
          </Button>
        </>
      ) : (
        <Button variant="outlined" color="success" endIcon={<ShoppingCart />}>
          Unlock for {chapter.price}
        </Button>
      )}
    </CardActions>
  </React.Fragment>
);

export default function BristolMIAB() {
  const [open, setOpen] = useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleEmailCapture = (email: string, firstname: string) => {
    const launchingChapter = chapters.find((chapter) => chapter.isCountdown);

    const url =
      'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=miab/register';

    axios
      .post(
        url,
        { email, firstname, chapter: `Chapter ${launchingChapter?.num}`, city: 'Bristol' },
        {
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      )
      .then(() => handleClose());
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          backgroundColor: 'rgb(18, 18, 18)',
          height: '100vh',
          margin: '10%',
          marginTop: '30px'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Logo />
          <Typography variant="h5" sx={{ color: 'rgb(255, 255, 255)', marginTop: '30px' }}>
            Bristol
          </Typography>
          <Typography variant="h2" sx={{ color: 'rgb(255, 255, 255)' }}>
            Man in a Box
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgb(255, 255, 255)' }}>
            {`Unearth Bristol's secret past via a mysterious phone app. Solve clues, outwit a cunning
          assailant, and solve the case before time runs out.`}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: { lg: 'row', xs: 'column' },
            marginTop: '60px'
          }}
        >
          {chapters.map((chapter) => (
            <Card
              key={chapter.num}
              sx={{
                backgroundColor: 'rgb(18, 18, 18)',
                color: 'rgb(255, 255, 255)',
                borderColor: 'rgb(255, 255, 255)',
                flex: 1,
                minWidth: chapter.num === 1 ? '50%' : '25%'
              }}
              variant="outlined"
            >
              {card(chapter, setOpen)}
            </Card>
          ))}
        </Box>

        <Box
          sx={{ display: 'flex', marginTop: '60px', marginBottom: '60px', flexDirection: 'column' }}
        >
          <Typography variant="h5" sx={{ color: 'rgb(255, 255, 255)' }}>
            Fancy something a little different?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgb(255, 255, 255)' }}>
            {`Hidden amidst the ancient cobblestone streets of Bristol lies a secret world teeming with
          intrigue, mystery, and untold dangers. As you stumble upon "X," an enigmatic phone app,
          its innocuous appearance belies the extraordinary adventure that awaits. A foreboding
          message illuminates your screen, urging you to embark on an epic, multi-chapter quest that
          will lead you into the city's darkest recesses. Unbeknownst to you, this thrilling journey
          through Bristol's shadowy underbelly is no ordinary game. It is a never-before-seen
          meticulously crafted, real-life immersive experience that blurs the lines between fantasy
          and reality. You find yourself caught in a race against time as you become the sole hope
          for the survival of the enigmatic "Man in a Box." Desperately counting on your
          resourcefulness, wit, and courage, the fate of this mysterious figure hangs in the
          balance. The clock is ticking, and every decision you make could be a matter of life and
          death. Unleash your inner detective and summon your courage. The fate of the "Man in a
          Box" lies in your hands, and the secrets of Bristol's shadowy underbelly await those bold
          enough to step into the abyss. Will you answer the call?`}
          </Typography>
          <Typography variant="h5" sx={{ color: 'rgb(255, 255, 255)', marginTop: '30px' }}>
            Who is this for?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgb(255, 255, 255)', marginBottom: '30px' }}>
            Ages 15+ Embark on a thrilling journey, the ideal escapade lasting 1-2 hours that
            promises a blend of enigma, excitement, and bonding. Perfect for a daring family outing
            with mature youngsters, an electrifying get-together with your comrades, or even an
            extraordinary date night to ignite sparks of adventure. Navigate your way through this
            intriguing game spanning 1-2 miles, a labyrinth of mysteries that beckon you, teasing
            your curiosity and intellect.
          </Typography>
        </Box>
      </Box>
      <EmailDialog
        open={open}
        handleClose={handleClose}
        handleEmailCapture={handleEmailCapture}
      ></EmailDialog>
    </Box>
  );
}
