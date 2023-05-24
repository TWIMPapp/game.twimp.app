import { useEffect, useState } from 'react';
import axios from 'axios';

import MultiQuestion from '@/components/MultiQuestion';
import Loading from '@/components/Loading';
import ItemsDialog from '@/components/ItemsDialog';
import { InventoryItem } from '@/types/inventoryItem';

// ?user_id=115&trail_ref=Bristol-AnniesMurder&task_sequence=700&path=0|1&lat=51.470675&lng=-2.5908689

// TODO: Be themeable (e.g. dark mode, rpg, etc)
// TODO: Support true/false questions with right colours (theme?)

// IMP: Add error state for when the API is down
// IMP: Add interceptors for the API to retry on failure (try 3 times, if failed, open support)

const baseUrl =
  'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=trails';

interface QueryParams {
  user_id: string;
  trail_ref: string;
  trail_sequence: string;
  path: string;
  lat: string;
  lng: string;
}

interface MultiQuestionResponse {
  correct: boolean;
  message: string;
  items: InventoryItem[];
}

interface MultiQuestionData {
  question: string;
  hint?: string;
  answers: string[];
}

const stringifyQueryParams = (params: QueryParams): string => {
  return `&${Object.keys(params)
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};

const getData = async (params: QueryParams): Promise<MultiQuestionData> => {
  const response = await axios
    .get(`${baseUrl}/question${stringifyQueryParams(params)}`)
    .catch((error) => {
      console.error(error);
    });
  return response?.data?.body;
};

const postData = async (answer: string, params: QueryParams): Promise<MultiQuestionResponse> => {
  const response = await axios
    .post(
      `${baseUrl}/question`,
      { answer, ...params },
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
  const [question, setQuestion] = useState<MultiQuestionData>();
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>();
  const [message, setMessage] = useState<string>();
  const [open, setOpen] = useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const answerCallback = async (answer: string) => {
    const data = await postData(answer, params as QueryParams);
    if (data) {
      console.log('####### DATA?', data);
      if (data.message) {
        console.log('HAS MESSAGE');
        setMessage(data.message);
        setOpen(true);
      }

      // if has items, show them
      if (data.items.length > 0) {
        console.log('HAS ITEMS');
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
        setQuestion(data);
      }
    };

    fetchData();
  }, []);

  return (
    <main id="game">
      {question ? (
        <>
          <MultiQuestion
            question={question.question}
            hint={question.hint}
            answers={question.answers}
            callback={answerCallback}
          />
          <ItemsDialog
            items={items}
            message={message}
            open={open}
            handleClose={handleClose}
          ></ItemsDialog>
        </>
      ) : (
        <Loading />
      )}
    </main>
  );
}
