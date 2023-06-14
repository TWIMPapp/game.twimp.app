import { useEffect, useState } from 'react';
import axios from 'axios';

import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import ChatRoom from '@/components/ChatRoom';
import { MessageItem } from '@/types/MessageItem';
import { InventoryItem } from '@/types/inventoryItem';
import ItemsDialog from '@/components/ItemsDialog';
import { promiseWithTimeout } from '@/utils/promiseWithTimeout';

const baseUrl =
  'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=conversation';

interface ChatResponse {
  ok: boolean;
  message: MessageItem;
  items: InventoryItem[];
  energy: number;
}

const stringifyQueryParams = (params: QueryParams): string => {
  return `&${Object.keys(params)
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};

const getData = async (params: QueryParams): Promise<ChatResponse> => {
  const response = await axios
    .get(`${baseUrl}/start${stringifyQueryParams(params)}`)
    .catch((error) => {
      console.error(error);
    });
  return response?.data?.body;
};

const postData = async (message: string, params: QueryParams): Promise<ChatResponse> => {
  const response = await axios
    .post(
      `${baseUrl}`,
      { message, ...params },
      {
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    )
    .catch((error) => {
      console.error(error);
    });

  return response?.data?.body;
};

export default function Multi() {
  const [params, setParams] = useState<QueryParams>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [energy, setEnergy] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const messageCallback = async (message: string) => {
    const newMessage: MessageItem = {
      text: message,
      id: Math.random().toString(36).substr(2, 9),
      avatar: params?.user_image_url
        ? params.user_image_url
        : 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/user.png',
      createdAt: new Date(),
      sent: true,
      role: 'user'
    };
    setMessages([...messages, newMessage]);
    setSending(true);

    const data = (await promiseWithTimeout(20000, postData(message, params as QueryParams)).catch(
      (error) => {
        console.error(error);
        return {
          ok: false,
          message: {
            text: 'Sorry, something went wrong. Please try again.',
            id: Math.random().toString(36).substr(2, 9),
            avatar: 'https://trail-images.s3.eu-west-2.amazonaws.com/ryan/error.png',
            createdAt: new Date(),
            sent: false,
            role: 'assistant'
          },
          items: [],
          energy
        } as ChatResponse;
      }
    )) as ChatResponse;

    if (data?.message) {
      const returnedMessage: MessageItem = {
        ...data.message,
        sent: false
      };
      setMessages([...messages, newMessage, returnedMessage]);
      setSending(false);

      if (data?.energy) {
        setEnergy(data.energy);
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
      const data = await getData(_params);
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
          theme={params?.theme}
          callback={messageCallback}
        />
      ) : (
        <Loading />
      )}
      <ItemsDialog items={items} open={open} handleClose={handleClose}></ItemsDialog>
    </>
  );
}
