import { Sentiment } from '@/typings/Sentiment.enum';
import { Outcome } from '@/typings/Task';
import { Alert, AlertColor, Snackbar } from '@mui/material';

const severityMap: Record<Sentiment, AlertColor> = {
  [Sentiment.Negative]: 'error',
  [Sentiment.Neutral]: 'info',
  [Sentiment.Positive]: 'success'
};

const SentimentSnackbar = ({
  outcome,
  open,
  autoHideDuration,
  handleClose
}: {
  outcome: Outcome;
  open: boolean;
  autoHideDuration: number;
  handleClose: () => void;
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: '5vh' }}
    >
      <Alert severity={severityMap[outcome.sentiment]} sx={{ width: '100%', borderRadius: '16px', alignItems: 'center' }}>
        <span className="font-semibold">{outcome.title}</span>
        {outcome.subtitle && <span className="block mt-1">{outcome.subtitle}</span>}
      </Alert>
    </Snackbar>
  );
};

export default SentimentSnackbar;
