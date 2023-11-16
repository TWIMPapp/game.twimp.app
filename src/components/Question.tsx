const Question = ({ question }: { question: string }) => {
  return <h2 className="text-2xl" dangerouslySetInnerHTML={{ __html: question }}></h2>;
};

export default Question;
