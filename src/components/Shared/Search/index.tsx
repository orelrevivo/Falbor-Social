import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useClickAway, useDebounce } from "@uidotdev/usehooks";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";

import { api } from "@/lib/api";
import type { User } from "@/types/api";

import Loader from "@/components/Shared/Loader";
import { Card, Form, Input, useZodForm } from "@/components/Shared/UI";
import cn from "@/helpers/cn";

interface SearchProps {
  placeholder?: string;
}

const ValidationSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: "Enter something to search" })
    .max(100, { message: "Query should not exceed 100 characters" })
});

const Search = ({ placeholder = "Search…" }: SearchProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const [showDropdown, setShowDropdown] = useState(false);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useZodForm({
    defaultValues: { query: "" },
    schema: ValidationSchema
  });

  const query = form.watch("query");
  const debouncedSearchText = useDebounce<string>(query, 500);

  const handleReset = useCallback(() => {
    setShowDropdown(false);
    setAccounts([]);
    form.reset();
  }, [form]);

  const dropdownRef = useClickAway(() => {
    handleReset();
  }) as MutableRefObject<HTMLDivElement>;

  const handleSubmit = useCallback(
    ({ query }: z.infer<typeof ValidationSchema>) => {
      const search = query.trim();
      if (pathname === "/search") {
        navigate(
          `/search?q=${encodeURIComponent(search)}&type=${type ?? "accounts"}`
        );
      } else {
        navigate(`/search?q=${encodeURIComponent(search)}&type=accounts`);
      }
      handleReset();
    },
    [pathname, navigate, type, handleReset]
  );

  const handleShowDropdown = useCallback(() => {
    setShowDropdown(true);
  }, []);

  useEffect(() => {
    if (pathname === "/search" || !showDropdown) {
      setAccounts([]);
      return;
    }

    const searchText = debouncedSearchText.trim();
    if (!searchText) {
      setAccounts([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.search.query(searchText, "accounts").then((res) => {
      if (!cancelled) {
        setAccounts(res.accounts);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchText, pathname, showDropdown]);

  return (
    <div className="w-full relative">
      <Form form={form} onSubmit={handleSubmit}>
        <Input
          className="px-3 py-3 text-sm"
          iconLeft={<MagnifyingGlassIcon />}
          iconRight={
            <XMarkIcon
              className={cn("cursor-pointer", query ? "visible" : "invisible")}
              onClick={handleReset}
            />
          }
          onClick={handleShowDropdown}
          placeholder={placeholder}
          type="text"
          {...form.register("query")}
        />
      </Form>
      {pathname !== "/search" && showDropdown ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[360px]" ref={dropdownRef}>
          <Card className="max-h-[80vh] overflow-y-auto py-2 shadow-xl border border-gray-100 dark:border-gray-800">
            {loading ? (
              <Loader className="my-3" message="Searching users" small />
            ) : (
              <>
                {accounts.map((user) => (
                  <div
                    className="flex items-center gap-3 cursor-pointer px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    key={user.id}
                    onClick={() => {
                      navigate(`/u/${user.username}`);
                      handleReset();
                    }}
                  >
                    <img 
                      src={user.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`} 
                      className="size-10 rounded-full" 
                      alt={user.username} 
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {user.displayName ?? user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                ))}
                {accounts.length === 0 && debouncedSearchText ? (
                  <div className="px-4 py-3 text-gray-500 text-sm text-center">
                    No results found for "{debouncedSearchText}"
                  </div>
                ) : null}
                {!debouncedSearchText && (
                  <div className="px-4 py-3 text-gray-500 text-sm text-center">
                    Type to search people...
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Search;
