import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Post } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SimplePostCard from "@/components/Post/SimplePostCard";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import BackButton from "@/components/Shared/BackButton";
import NewPostModal from "@/components/Composer/NewPostModal";
import Loader from "@/components/Shared/Loader";
import Custom404 from "@/components/Shared/404";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import Footer from "@/components/Shared/Footer";

const ViewPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentAccount } = useAccountStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPost = async () => {
    if (!slug) return;
    try {
      const data = await api.posts.get(slug);
      setPost(data.post);
      setComments(data.comments);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [slug]);

  if (loading) return <Loader className="my-12" message="Loading post..." />;
  if (error || !post) return <Custom404 />;

  const handleUpdate = (updated: Post) => {
    if (updated.id === post.id) {
      setPost(updated);
    } else {
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  };

  const handleDelete = (id: string) => {
    if (id === post.id) {
      window.history.back();
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <PageLayout
      sidebar={
        <div className="space-y-5">
          <Card as="aside" className="p-5">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Author</h3>
            <div className="flex items-center gap-3">
              <img 
                src={post.author.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${post.author.username}`} 
                className="size-10 rounded-full" 
                alt={post.author.username} 
              />
              <div>
                <Link to={`/u/${post.author.username}`} className="font-semibold text-gray-900 hover:underline dark:text-white">
                  {post.author.displayName ?? post.author.username}
                </Link>
                <div className="text-sm text-gray-500">@{post.author.username}</div>
              </div>
            </div>
          </Card>
          <Footer />
        </div>
      }
      title={`Post by ${post.author.username} • Hey`}
      zeroTopMargin
    >
      <div className="space-y-5">
        <Card>
          <CardHeader icon={<BackButton />} title="Post" />
          <div className="border-b border-gray-100 dark:border-gray-800">
            <SimplePostCard post={post} onUpdate={handleUpdate} onDelete={handleDelete} />
          </div>
          
          {currentAccount && (
            <div className="border-b border-gray-100 dark:border-gray-800">
              <NewPostModal 
                onClose={() => {}} 
                parentId={post.id} 
                onSuccess={loadPost} 
              />
            </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {comments.map(comment => (
              <SimplePostCard 
                key={comment.id} 
                post={comment} 
                onUpdate={handleUpdate} 
                onDelete={handleDelete} 
              />
            ))}
            {comments.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                No comments yet. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ViewPost;
