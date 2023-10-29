const Hint = ({ hint }: { hint: string }) => {
  return (
    <small
      className="text-gray-500 pt-2 block"
      dangerouslySetInnerHTML={{ __html: `<strong>Hint:</strong> ${hint}` }}
    ></small>
  );
};

export default Hint;
