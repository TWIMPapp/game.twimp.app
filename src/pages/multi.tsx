import { useEffect, useState } from 'react';
import axios from 'axios';

import MultiQuestion from '@/components/MultiQuestion';
import Loading from '@/components/Loading';

// ?user_id=115&trail_ref=Bristol-AnniesMurder&task_sequence=700&path=0|1&lat=51.470675&lng=-2.5908689

// TODO: Be themeable
// TODO: Add a "correct" state
// TODO: Add a "wrong" state
// TODO: Support true/false questions with right colours
// TODO: Add stepn type stiff on items received/removed/neutral
// TODO: Add error state for when the API is down
// TODO: Add interceptors for the API to retry on failure (try 3 times, if failed, open support)

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

interface MultiResponseItems {
  title: string;
  image: string;
  sentiment: 'good' | 'bad' | 'hardtosay';
}

interface MultiQuestionResponse {
  correct: boolean;
  message: string;
  items: MultiResponseItems[];
}

interface MultiQuestionData {
  question: string;
  hint?: string;
  answers: string[];
}

const sentimentBorderColour = (sentiment: 'good' | 'bad' | 'hardtosay'): string => {
  return {
    good: 'border-green-400',
    bad: 'border-red-400',
    hardtosay: 'border-yellow-400'
  }[sentiment];
};

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

  console.log('#####', response?.data?.body);
  return response?.data?.body;
};

export default function Multi() {
  const [question, setQuestion] = useState<MultiQuestionData>();
  const [params, setParams] = useState<QueryParams>();

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
        <MultiQuestion
          question={question.question}
          hint={question.hint}
          answers={question.answers}
          callback={async (answer: string) => await postData(answer, params as QueryParams)}
        />
      ) : (
        <Loading />
      )}
    </main>
  );
}
