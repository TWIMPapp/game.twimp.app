import { useState } from 'react';
import Hint from './Hint';
import Question from './Question';
import { Option } from '@/types/Task';
import { Colour } from '@/types/Colour.enum';

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
  callback
}: {
  question: string;
  hint?: string;
  options: Option[];
  callback: (option: Option) => any;
}) => {
  const [activeOption, setActiveOption] = useState<Option | null>(null);

  const handleClick = (option: Option) => {
    callback(option);
    setActiveOption(option);
  };

  const isActiveAnswer = (option: Option): boolean => {
    return activeOption?.content === option.content;
  };

  return (
    <div className="p-6">
      <div className="max-h-64">
        <Question question={question} />
        {hint && <Hint hint={hint} />}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        {options?.map((option: Option, index: number) => {
          return (
            <button
              key={index}
              style={{ height: 'calc((100vh - 550px) / 2)' }}
              className={`text-white p-6 font-semibold rounded shadow ${
                option.colour ? colourMap[option.colour] : getColour(index)
              } animate__animated ${isActiveAnswer(option) ? 'animate__bounce' : ''}`}
              onClick={() => handleClick(option)}
            >
              {option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiQuestion;
