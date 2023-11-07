import { useEffect, useState } from 'react';

import Loading from '../../../components/Loading';
import { QueryParams } from '../../../types/QueryParams';
import ChatRoom from '../../../components/ChatRoom';
import ItemsDialog from '../../../components/ItemsDialog';
import NoBatteryDialog from '../../../components/NoBatteryDialog';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';
import { InventoryItem } from '@/types/inventoryItem';
import { Message } from '@/types/Task';
import { ChatResponse } from './ChatResponse.interface';
import { promiseWithTimeout } from '@/utils/promiseWithTimeout';

export default function Chat() {
  const [params, setParams] = useState<QueryParams>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [energy, setEnergy] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [noBattery, setNoBattery] = useState<boolean>(false);

  const API = new APIService(Endpoint.Chat);

  const handleClose = () => {
    setOpen(false);
  };

  const messageCallback = async (message: string) => {
    const newMessage: Message = {
      content: message,
      id: Math.random().toString(36).substr(2, 9),
      // avatar: params?.user_image_url
      //   ? params.user_image_url
      //   : 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/user.png',
      created: new Date(),
      role: 'user',
      character_id: 'new'
    };
    setMessages([...messages, newMessage]);
    setSending(true);

    const randomTime = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
      setIsTyping(true);
    }, randomTime);

    const data = (await promiseWithTimeout(
      20000,
      API.post<ChatResponse>(message, params as QueryParams)
    ).catch((error) => {
      console.error(error);
      return {
        ok: false,
        message: {
          content: 'Sorry, something went wrong. Please try again.',
          id: Math.random().toString(36).substr(2, 9),
          created: new Date(),
          role: 'assistant',
          character_id: ''
        },
        items: [],
        energy
      } as ChatResponse;
    })) as ChatResponse;

    if (data?.message) {
      const returnedMessage: Message = {
        ...data.message
      };
      setIsTyping(false);
      setMessages([...messages, newMessage, returnedMessage]);
      setSending(false);

      if (data?.energy) {
        setEnergy(data.energy);

        if (data.energy <= 0) {
          setNoBattery(true);
        }
      }

      if (data?.items?.length > 0) {
        setItems(data.items);
        setOpen(true);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      setParams(_params);
      const data = await API.get<ChatResponse>(_params);
      if (data) {
        setMessages([data.message]);
        setEnergy(data.energy);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {loaded ? (
        <ChatRoom
          messages={messages}
          sending={sending}
          energy={energy}
          isTyping={isTyping}
          theme={params?.theme}
          // upsideDown={params?.upside_down}
          callback={messageCallback}
        />
      ) : (
        <Loading />
      )}
      <ItemsDialog items={items} open={open} handleClose={handleClose}></ItemsDialog>
      <NoBatteryDialog open={noBattery}></NoBatteryDialog>
    </>
  );
}
