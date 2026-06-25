import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "react-router";
import MenuTransition from "@/components/Shared/MenuTransition";
import Logout from "@/components/Shared/Navbar/NavItems/Logout";
import Settings from "@/components/Shared/Navbar/NavItems/Settings";
import ThemeSwitch from "@/components/Shared/Navbar/NavItems/ThemeSwitch";
import { Image } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const SignedAccount = () => {
  const { currentAccount } = useAccountStore();

  const avatarUrl =
    currentAccount?.avatarUrl ??
    `https://api.dicebear.com/8.x/initials/svg?seed=${currentAccount?.username ?? "user"}`;

  const Avatar = () => (
    <Image
      alt={currentAccount?.username ?? "avatar"}
      className="size-8 cursor-pointer rounded-full border border-gray-200 dark:border-gray-700"
      src={avatarUrl}
    />
  );

  return (
    <Menu as="div">
      <MenuButton>
        <Avatar />
      </MenuButton>
      <MenuTransition>
        <MenuItems
          anchor="bottom start"
          className="z-[5] mt-2 w-52 origin-top-left rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-hidden dark:border-gray-700 dark:bg-black"
          static
        >
          {/* Profile info */}
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {currentAccount?.displayName ?? currentAccount?.username}
            </p>
            <p className="text-gray-500 text-xs">@{currentAccount?.username}</p>
          </div>

          {/* Profile link */}
          <MenuItem
            as={Link}
            className={({ focus }: { focus: boolean }) =>
              cn({ "dropdown-active": focus }, "menu-item")
            }
            to={`/user/${currentAccount?.username}`}
          >
            Your profile
          </MenuItem>

          <MenuItem
            as={Link}
            className={({ focus }: { focus: boolean }) =>
              cn({ "dropdown-active": focus }, "menu-item")
            }
            to="/settings"
          >
            <Settings />
          </MenuItem>

          <div className="divider" />

          <MenuItem
            as="div"
            className={({ focus }) =>
              cn({ "dropdown-active": focus }, "m-2 rounded-lg")
            }
          >
            <ThemeSwitch />
          </MenuItem>

          <div className="divider" />

          <MenuItem
            as="div"
            className={({ focus }) =>
              cn({ "dropdown-active": focus }, "m-2 rounded-lg")
            }
          >
            <Logout />
          </MenuItem>
        </MenuItems>
      </MenuTransition>
    </Menu>
  );
};

export default SignedAccount;
