import {
  BellIcon as BellOutline,
  BookmarkIcon as BookmarkOutline,
  GlobeAltIcon as GlobeOutline,
  HomeIcon as HomeOutline,
  UserCircleIcon,
  UserGroupIcon as UserGroupOutline
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellSolid,
  BookmarkIcon as BookmarkSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeSolid,
  UserGroupIcon as UserGroupSolid
} from "@heroicons/react/24/solid";
import {
  type MouseEvent,
  memo,
  type ReactNode,
  useCallback,
  useState
} from "react";
import { Link, useLocation } from "react-router";
import { Image, Spinner, Tooltip } from "@/components/Shared/UI";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SignedAccount from "./SignedAccount";

const navigationItems = {
  "/": {
    outline: <HomeOutline className="size-6" />,
    solid: <HomeSolid className="size-6" />,
    title: "Home"
  },
  "/explore": {
    outline: <GlobeOutline className="size-6" />,
    solid: <GlobeSolid className="size-6" />,
    title: "Explore"
  },
  "/notifications": {
    outline: <BellOutline className="size-6" />,
    solid: <BellSolid className="size-6" />,
    title: "Notifications"
  },
  "/bookmarks": {
    outline: <BookmarkOutline className="size-6" />,
    solid: <BookmarkSolid className="size-6" />,
    title: "Bookmarks"
  }
};

interface NavItemProps {
  url: string;
  icon: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const NavItem = memo(({ icon, onClick, url }: NavItemProps) => (
  <Tooltip content={navigationItems[url as keyof typeof navigationItems].title}>
    <Link onClick={onClick} to={url}>
      {icon}
    </Link>
  </Tooltip>
));

const NavItems = memo(({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { pathname } = useLocation();
  const routes = [
    "/",
    "/explore",
    ...(isLoggedIn ? ["/notifications", "/bookmarks"] : [])
  ];

  return (
    <>
      {routes.map((route) => {
        const item = navigationItems[route as keyof typeof navigationItems];
        const icon =
          pathname === route ? item.solid : item.outline;

        return (
          <NavItem
            icon={icon}
            key={route}
            url={route}
          />
        );
      })}
    </>
  );
});

const Navbar = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { setShowAuthModal } = useAuthModalStore();

  const handleLogoClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo(0, 0);
      }
    },
    [pathname]
  );

  const handleAuthClick = useCallback(() => {
    setShowAuthModal(true);
  }, [setShowAuthModal]);

  return (
    <aside className="sticky top-5 mt-5 hidden w-10 shrink-0 flex-col items-center gap-y-5 md:flex">
      <Link onClick={handleLogoClick} to="/">
        <Image
          alt="Logo"
          height={32}
          src={`/logo.png`}
          width={32}
        />
      </Link>
      <NavItems isLoggedIn={!!currentAccount} />
      {currentAccount ? (
        <SignedAccount />
      ) : (
        <button onClick={handleAuthClick} type="button">
          <Tooltip content="Login">
            <UserCircleIcon className="size-6" />
          </Tooltip>
        </button>
      )}
    </aside>
  );
};

export default memo(Navbar);
