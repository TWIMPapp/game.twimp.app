const Hint = ({ hint }: { hint: string }) => {
  return (
    <small
      className="text-gray-500 pt-2 block"
      dangerouslySetInnerHTML={{ __html: `Hint: ${hint}` }}
    ></small>
  );
};

export default Hint;
