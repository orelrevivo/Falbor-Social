import NewPost from "@/components/Composer/NewPost";
import PageLayout from "@/components/Shared/PageLayout";
import { HomeFeedType } from "@/data/enums";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import FeedType from "./FeedType";
import Hero from "./Hero";
import Timeline from "./Timeline";
import TopAccounts from "./TopAccounts";

const Home = () => {
  const { currentAccount } = useAccountStore();
  const { feedType } = useHomeTabStore();
  const loggedInWithAccount = Boolean(currentAccount);

  return (
    <PageLayout>
      {loggedInWithAccount ? (
        <>
          <FeedType />
          <NewPost />
          {feedType === HomeFeedType.FOLLOWING ? (
            <Timeline />
          ) : feedType === HomeFeedType.HIGHLIGHTS ? (
            <Timeline isExplore />
          ) : feedType === HomeFeedType.FORYOU ? (
            <Timeline isExplore />
          ) : null}
        </>
      ) : (
        <>
          <Hero />
          <TopAccounts />
        </>
      )}
    </PageLayout>
  );
};

export default Home;
