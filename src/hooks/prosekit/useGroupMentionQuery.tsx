import { useEffect, useState } from "react";
// import removed

const SUGGESTION_LIST_LENGTH_LIMIT = 5;

export type MentionGroup = {
  address: string;
  name: string | undefined;
  icon: string | undefined;
  member: boolean;
};

const useGroupMentionQuery = (query: string): MentionGroup[] => {
  const [results, setResults] = useState<MentionGroup[]>([]);

  useEffect(() => {
    // Web2 backend does not currently support groups, mock empty
    setResults([]);
  }, [query]);

  return results;
};

export default useGroupMentionQuery;
