import { useEffect, useState } from 'react';
import axios from 'axios';

import MultiQuestion from '../../../components/MultiQuestion';
import Loading from '../../../components/Loading';
import ItemsDialog from '../../../components/ItemsDialog';
import { InventoryItem } from '../../../types/inventoryItem';
import { QueryParams } from '../../../types/queryParams';

// ?user_id=115&trail_ref=Bristol-AnniesMurder&task_sequence=700&path=0|1&lat=51.470675&lng=-2.5908689&theme=family

// TODO: Be themeable (family, rpg) -- theme up
// TODO: Support true/false questions with right colours

// IMP: Add error state for when the API is down
// IMP: Add interceptors for the API to retry on failure (try 3 times, if failed, open support)

const baseUrl =
  'https://script.google.com/macros/s/AKfycbx2Hnd9zQqpuO8dyP4ZouhmbpvO1S1cvO47tfhaXHRBCs_KxZHfkQGsFYdzJkFeWgiAJA/exec?q=trails';

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
      if (data.message) {
        setMessage(data.message);
        setOpen(true);
      }

      if (data.items.length > 0) {
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
      console.log(data);
      if (data) {
        setQuestion(data);
      }
    };

    fetchData();
  }, []);

  return (
    <>
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
    </>
  );
}
