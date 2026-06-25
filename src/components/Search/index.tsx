import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";

import { api } from "@/lib/api";
import type { SearchResult } from "@/types/api";

import PageLayout from "@/components/Shared/PageLayout";
import { default as SearchInput } from "@/components/Shared/Search";
import Sidebar from "@/components/Shared/Sidebar";
import { EmptyState, Card } from "@/components/Shared/UI";
import Loader from "@/components/Shared/Loader";
import SimplePostCard from "@/components/Post/SimplePostCard";

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");
  const type = searchParams.get("type") === "posts" ? "posts" : "accounts";

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    const loadSearch = async () => {
      setLoading(true);
      try {
        const data = await api.search.query(q, type);
        setResults(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    loadSearch();
  }, [q, type]);

  return (
    <PageLayout hideSearch sidebar={<Sidebar />} title="Search">
      <div className="px-5 md:px-0">
        <SearchInput />
      </div>
      
      <div className="flex gap-4 px-5 md:px-0 my-4 border-b border-gray-200 dark:border-gray-800">
        <Link 
          to={`/search?q=${q ?? ""}&type=accounts`} 
          className={`pb-2 font-medium ${type === "accounts" ? "border-b-2 border-brand-500 text-brand-500" : "text-gray-500"}`}
        >
          Accounts
        </Link>
        <Link 
          to={`/search?q=${q ?? ""}&type=posts`} 
          className={`pb-2 font-medium ${type === "posts" ? "border-b-2 border-brand-500 text-brand-500" : "text-gray-500"}`}
        >
          Posts
        </Link>
      </div>

      {!q && (
        <EmptyState
          icon={<MagnifyingGlassIcon className="size-8" />}
          message="Search for accounts or posts"
        />
      )}

      {q && loading && <Loader className="my-10" />}

      {q && !loading && results && type === "accounts" && (
        <Card className="divide-y divide-gray-200 dark:divide-gray-800">
          {results.accounts.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No accounts found</div>
          ) : (
            results.accounts.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-5">
                <Link to={`/u/${user.username}`}>
                  <img 
                    src={user.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`} 
                    alt={user.username} 
                    className="size-12 rounded-full"
                  />
                </Link>
                <div>
                  <Link to={`/u/${user.username}`} className="font-bold text-gray-900 hover:underline dark:text-white">
                    {user.displayName ?? user.username}
                  </Link>
                  <div className="text-sm text-gray-500">@{user.username}</div>
                  {user.bio && <div className="text-sm text-gray-800 mt-1 dark:text-gray-200">{user.bio}</div>}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {q && !loading && results && type === "posts" && (
        <Card className="divide-y divide-gray-200 dark:divide-gray-800">
          {results.posts.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No posts found</div>
          ) : (
            results.posts.map((post) => (
              <SimplePostCard key={post.id} post={post} />
            ))
          )}
        </Card>
      )}
    </PageLayout>
  );
};

export default Search;
