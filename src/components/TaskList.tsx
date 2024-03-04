import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { TaskUnion } from '../typings/Task';
import TaskDialog from './TaskDialog';
import { Button } from '@mui/material';

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0
  },
  '&::before': {
    display: 'none'
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)'
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1)
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)'
}));
interface Props {
  tasks: TaskUnion[];
}

export default function TaskList({ tasks }: Props) {
  const [selectedTask, setSelectedTask] = useState<TaskUnion | null>(null);
  const [expanded, setExpanded] = React.useState<number | false>(0);

  const handleChange = (panelIndex: number) => (event: React.SyntheticEvent) => {
    setExpanded(panelIndex === expanded ? false : panelIndex);
  };

  const handleClose = () => {
    setSelectedTask(null);
  };

  const reversedTasksWithoutMapTasks = tasks.filter((task) => task.type !== 'map').reverse();

  return (
    <>
      {reversedTasksWithoutMapTasks &&
        reversedTasksWithoutMapTasks.map((task, index) => (
          <>
            <Accordion key={index} expanded={expanded === index} onChange={handleChange(index)}>
              <AccordionSummary>
                <Typography>
                  Task #{reversedTasksWithoutMapTasks.length - index} {task.type.toUpperCase()}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {task.image_url ? (
                  <>
                    <Avatar
                      src={task.image_url}
                      sx={{ height: 140, width: '100%' }}
                      variant="rounded"
                    />
                    <br />
                  </>
                ) : (
                  ''
                )}
                {task.content.length > 100 ? (
                  <>
                    {task.content.slice(0, 100)}...
                    <Button
                      color="primary"
                      variant="text"
                      sx={{ display: 'block', padding: '10px 0 0 0' }}
                      onClick={() => {
                        setSelectedTask(task);
                      }}
                    >
                      Read more
                    </Button>
                  </>
                ) : (
                  task.content
                )}
              </AccordionDetails>
            </Accordion>
          </>
        ))}
      {selectedTask ? (
        <TaskDialog open={!!selectedTask} handleClose={handleClose} task={selectedTask} />
      ) : (
        ''
      )}
    </>
  );
}
