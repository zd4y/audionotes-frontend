import { useAuthenticated } from "../auth";

const Notes = () => {
  const accessToken = useAuthenticated();
  return <p>Notes</p>;
};

export default Notes;
