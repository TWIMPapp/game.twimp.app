import { useEffect, useState } from 'react';

import MultiQuestion from '../../../components/MultiQuestion';
import Loading from '../../../components/Loading';
import ItemsDialog from '../../../components/ItemsDialog';
import { InventoryItem } from '../../../types/InventoryItem';
import { QueryParams } from '../../../types/QueryParams';
import { APIService } from '@/services/API';
import { MultiQuestionResponse } from './MultiQuestionResponse.interface';
import { MultiQuestionData } from './MultiQuestionData.interface';
import { Endpoint } from '@/types/Endpoint.enum';

export default function Multi() {
  const [question, setQuestion] = useState<MultiQuestionData>();
  const [params, setParams] = useState<QueryParams>();
  const [items, setItems] = useState<InventoryItem[]>();
  const [message, setMessage] = useState<string>();
  const [open, setOpen] = useState<boolean>(false);

  const API = new APIService(Endpoint.QUESTION);

  const handleClose = () => {
    setOpen(false);
  };

  const answerCallback = async (answer: string) => {
    const data = await API.post<MultiQuestionResponse>(answer, params as QueryParams);
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
      const data = await API.get<MultiQuestionData>(_params);
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
