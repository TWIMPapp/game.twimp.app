import { useEffect, useState } from 'react';
import axios from 'axios';

import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import ChatRoom from '@/components/ChatRoom';
import { MessageItem } from '@/types/MessageItem';
import { InventoryItem } from '@/types/inventoryItem';

const baseUrl =
  'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=conversation';

interface ChatResponse {
  ok: boolean;
  message: MessageItem;
  item: InventoryItem[];
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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [energy, setEnergy] = useState<number>(0);

  const messageCallback = async (message: string) => {
    const newMessage: MessageItem = {
      text: message,
      id: Math.random().toString(36).substr(2, 9),
      // TODO: get avatar from user
      avatar: 'https://i.pravatar.cc/40',
      createdAt: new Date(),
      sent: true
    };
    setMessages([...messages, newMessage]);
    setSending(true);

    const data = await postData(message, params as QueryParams);
    if (data?.message) {
      const returnedMessage: MessageItem = {
        ...data.message,
        sent: false
      };
      setMessages([...messages, newMessage, returnedMessage]);
      setEnergy(data.energy);
      setSending(false);
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
    </>
  );
}
