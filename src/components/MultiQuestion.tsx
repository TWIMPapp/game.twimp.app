import Hint from './Hint';
import Question from './Question';

const getColour = (index: number): string => {
  return ['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400'][index];
};

const MultiQuestion = ({
  question,
  hint,
  answers,
  callback
}: {
  question: string;
  hint?: string;
  answers: string[];
  callback: (answer: string) => any;
}) => {
  return (
    <div className="p-10">
      <Question question={question} />
      {hint && <Hint hint={hint} />}

      <div className="grid grid-cols-1 gap-6 mt-6">
        {answers?.map((answer: string, index: number) => {
          return (
            <button
              key={index}
              className={`text-white p-4 font-semibold rounded shadow ${getColour(index)}`}
              onClick={() => callback(answer)}
            >
              {answer}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiQuestion;
