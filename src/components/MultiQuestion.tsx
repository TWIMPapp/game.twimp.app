import { useState } from 'react';
import Hint from './Hint';
import Question from './Question';
import { Option } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import { CircularProgress } from '@mui/material';

const colourMap = {
  [Colour.Red]: 'bg-red-400',
  [Colour.Blue]: 'bg-blue-400',
  [Colour.Green]: 'bg-green-400',
  [Colour.Yellow]: 'bg-yellow-400',
  [Colour.Orange]: 'bg-orange-400',
  [Colour.Purple]: 'bg-purple-400',
  [Colour.Pink]: 'bg-pink-400'
};

const getColour = (index: number): string => {
  return ['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400'][index];
};

const MultiQuestion = ({
  question,
  hint,
  options,
  loadingOption,
  callback
}: {
  question: string;
  hint?: string;
  options: Option[];
  loadingOption: Option | undefined;
  callback: (option: Option) => any;
}) => {
  const [activeOption, setActiveOption] = useState<Option | null>(null);

  const handleClick = (option: Option) => {
    callback(option);
    setActiveOption(option);
  };

  const isActiveAnswer = (option: Option): boolean => {
    return activeOption?.content === option?.content;
  };

  return (
    <div className="pl-6 pr-6 pb-6">
      <div className="max-h-64">
        <Question question={question} />
        {hint && <Hint hint={hint} />}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        {options?.map((option: Option, index: number) => {
          return (
            <button
              disabled={loadingOption !== undefined}
              key={index}
              className={`cy-multi-option-${index} text-white p-6 font-semibold rounded shadow ${
                option?.colour ? colourMap[option.colour] : getColour(index)
              } animate__animated ${isActiveAnswer(option) ? 'animate__bounce' : ''}`}
              onClick={() => handleClick(option)}
            >
              {loadingOption?.content === option.content ? <CircularProgress /> : option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiQuestion;
