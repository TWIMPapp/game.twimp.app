import { useEffect, useState } from 'react';
import axios from 'axios';

import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import ChatRoom from '@/components/ChatRoom';
import { MessageItem } from '@/types/MessageItem';

const baseUrl =
  'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=conversation';

interface ChatResponse {
  // correct: boolean;
  // message: string;
  // items: InventoryItem[];
}

interface ChatData {
  // question: string;
  // hint?: string;
  // answers: string[];
}

const stringifyQueryParams = (params: QueryParams): string => {
  return `&${Object.keys(params)
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};

// const getData = async (params: QueryParams): Promise<ChatData> => {
//   const response = await axios
//     .get(`${baseUrl}/question${stringifyQueryParams(params)}`)
//     .catch((error) => {
//       console.error(error);
//     });
//   return response?.data?.body;
// };

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

  const messageCallback = async (message: string) => {
    const newMessage: MessageItem = {
      text: message,
      id: Math.random().toString(36).substr(2, 9),
      avatar: 'https://i.pravatar.cc/40',
      createdAt: new Date(),
      sent: true
    };
    setMessages([...messages, newMessage]);
    setSending(true);

    const data = await postData(message, params as QueryParams);
    if (data) {
      const returnedMessage: MessageItem = {
        text: (data as any).message,
        id: Math.random().toString(36).substr(2, 9),
        avatar: 'https://i.pravatar.cc/40',
        createdAt: new Date(),
        sent: false
      };
      setMessages([...messages, newMessage, returnedMessage]);
      setSending(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      setParams(_params);
      // const data = await getData(_params);
      // if (data) {
      setLoaded(true);
      // }
    };

    fetchData();
  }, []);

  return (
    <>
      {loaded ? (
        <ChatRoom
          messages={messages}
          sending={sending}
          theme={params?.theme}
          callback={messageCallback}
        />
      ) : (
        <Loading />
      )}
    </>
  );
}
