import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Task } from '../typings/Task';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { CardActions, CardContent } from '@mui/material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <Dialog open={open} onClose={handleClose} sx={{ width: '80%', margin: '10%' }}>
      <Card sx={{ overflowY: 'auto' }}>
        <CardMedia component="img" height="140" image={task.image_url} />
        <CardContent className="markdown-body" sx={{ whiteSpace: 'pre-wrap' }}>
          <Markdown remarkPlugins={[remarkGfm]}>{task.content}</Markdown>
        </CardContent>
        <CardActions>
          <Button color="primary" onClick={handleClose}>
            Close
          </Button>
        </CardActions>
      </Card>
    </Dialog>
  );
};

export default TaskDialog;
