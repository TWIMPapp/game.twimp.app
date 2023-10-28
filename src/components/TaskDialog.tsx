import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Task } from '../types/Task';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { CardActions, CardContent } from '@mui/material';

const TaskDialog = ({
  open,
  handleClose,
  task
}: {
  open: boolean;
  handleClose: () => void;
  task: Task;
}) => {
  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <Card sx={{ overflowY: 'auto' }}>
          <CardMedia component="img" height="140" image={task.image} />
          <CardContent sx={{ whiteSpace: 'pre-wrap' }}>{task.content}</CardContent>
          <CardActions>
            <Button color="primary" onClick={handleClose}>
              Close
            </Button>
          </CardActions>
        </Card>
      </Dialog>
    </>
  );
};

export default TaskDialog;
