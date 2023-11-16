import React, { useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';

import { Task } from '../typings/Task';
import TaskDialog from './TaskDialog';

interface Props {
  tasks: Task[];
}

export default function TaskList({ tasks }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleClose = () => {
    setSelectedTask(null);
  };

  return (
    <List>
      {tasks &&
        tasks.map((task, index) => (
          <>
            <ListItem alignItems="flex-start" onClick={() => setSelectedTask(task)}>
              <ListItemAvatar>
                {task.image_url ? (
                  <Avatar src={task.image_url} sx={{ width: 40, height: 40 }} variant="rounded" />
                ) : (
                  ''
                )}
              </ListItemAvatar>
              <ListItemText primary={task.type} secondary={task.content.slice(0, 100) + '...'} />
            </ListItem>
            {index === tasks.length - 1 ? '' : <Divider variant="inset" component="li" />}
            <TaskDialog open={selectedTask === task} handleClose={handleClose} task={task} />
          </>
        ))}
    </List>
  );
}
