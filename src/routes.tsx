import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes as RouterRoutes } from "react-router";
import Layout from "@/components/Common/Layout";
import FullPageLoader from "@/components/Shared/FullPageLoader";

const Bookmarks = lazy(() => import("@/components/Bookmarks"));
const Custom404 = lazy(() => import("@/components/Shared/404"));
const Explore = lazy(() => import("@/components/Explore"));
const Home = lazy(() => import("@/components/Home"));
const Notification = lazy(() => import("@/components/Notification"));
const Privacy = lazy(() => import("@/components/Pages/Privacy"));
const Search = lazy(() => import("@/components/Search"));
const Terms = lazy(() => import("@/components/Pages/Terms"));
const ViewAccount = lazy(() => import("@/components/Account"));
const ViewPost = lazy(() => import("@/components/Post"));

const AccountSettings = lazy(() => import("@/components/Settings"));
const AccountPersonalizeSettings = lazy(() => import("@/components/Settings/Personalize"));
const ManagerSettings = lazy(() => import("@/components/Settings/Manager"));
const UsernameSettings = lazy(() => import("@/components/Settings/Username"));

const Routes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <RouterRoutes>
          <Route element={<Layout />} path="/">
            <Route element={<Home />} index />
            <Route element={<Explore />} path="explore" />
            <Route element={<Search />} path="search" />
            <Route element={<Bookmarks />} path="bookmarks" />
            <Route element={<Notification />} path="notifications" />
            <Route element={<ViewAccount />} path="account/:address" />
            <Route element={<ViewAccount />} path="user/:username" />
            <Route path="posts/:slug">
              <Route element={<ViewPost />} index />
            </Route>
            <Route path="settings">
              <Route element={<AccountSettings />} index />
              <Route element={<AccountPersonalizeSettings />} path="personalize" />
              <Route element={<ManagerSettings />} path="manager" />
              <Route element={<UsernameSettings />} path="username" />
            </Route>
            <Route element={<Terms />} path="terms" />
            <Route element={<Privacy />} path="privacy" />
            <Route element={<Custom404 />} path="*" />
          </Route>
        </RouterRoutes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Routes;
