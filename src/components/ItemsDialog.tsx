import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import { InventoryItem } from '@/typings/inventoryItem';
import { sentimentBorderColour } from '@/pages/task/inventoryTab';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ItemsDialog = ({
  items,
  message,
  open,
  handleClose
}: {
  items?: InventoryItem[];
  message?: string;
  open: boolean;
  handleClose: () => void;
}) => {
  return (
    <Dialog open={open} onClose={handleClose} TransitionComponent={Transition} keepMounted>
      <DialogTitle></DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        <ul>
          {items?.map((item: InventoryItem, index: number) => {
            return (
              <li
                key={index}
                className={`flex items-center justify-between p-4 my-2 border-4 rounded shadow ${
                  item?.sentiment ? sentimentBorderColour(item.sentiment) : ''
                }`}
              >
                <div className="flex items-center">
                  <img src={item.image_url} alt={item.title} className="w-20 h-20 mr-4" />
                  <span>{item.title}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" autoFocus>
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemsDialog;
