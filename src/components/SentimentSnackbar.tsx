import { Sentiment } from '@/types/Sentiment.enum';
import { Outcome } from '@/types/Task';
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
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={handleClose}>
      <Alert severity={severityMap[outcome.sentiment]} sx={{ width: '100%' }}>
        <h3>{outcome.title}</h3>
        <p>{outcome.subtitle}</p>
      </Alert>
    </Snackbar>
  );
};

export default SentimentSnackbar;
