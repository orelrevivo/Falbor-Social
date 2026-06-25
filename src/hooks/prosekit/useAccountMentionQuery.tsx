import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const SUGGESTION_LIST_LENGTH_LIMIT = 5;

export type MentionAccount = {
  address: string;
  username: string;
  name: string;
  picture: string;
};

const useAccountMentionQuery = (query: string): MentionAccount[] => {
  const [results, setResults] = useState<MentionAccount[]>([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    // Use our local REST API instead of Apollo
    api.search.query(query).then((data) => {
      const accounts = data?.accounts || [];
      const accountsResults = accounts.map(
        (account: any): MentionAccount => ({
          address: account.username, // Just use username as address fallback
          name: account.displayName || account.username,
          picture: account.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${account.username}`,
          username: account.username
        })
      );

      setResults(accountsResults.slice(0, SUGGESTION_LIST_LENGTH_LIMIT));
    }).catch(() => {
      setResults([]);
    });
  }, [query]);

  return results;
};

export default useAccountMentionQuery;
