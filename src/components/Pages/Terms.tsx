import { memo } from "react";
import { Link } from "react-router";
import PageHeader from "@/components/Pages/PageHeader";
import PageLayout from "@/components/Shared/PageLayout";
import { H4 } from "@/components/Shared/UI";

const Terms = () => {
  const updatedAt = "June 25, 2026";

  return (
    <PageLayout title="Terms & Conditions">
      <PageHeader title="Terms & Conditions" updatedAt={updatedAt} />
      <div className="relative">
        <div className="flex justify-center">
          <div className="relative mx-auto rounded-lg">
            <div className="!p-8 max-w-none text-gray-500 dark:text-gray-200">
              <H4 className="mb-5">1. Overview</H4>
              <div className="space-y-5">
                <p className="leading-7">
                  Welcome to Falbor. We provide a social media platform designed specifically for programmers, builders, and AI enthusiasts. Our platform allows users to share regular posts, showcase their products, and receive real, constructive criticism from both the community and our integrated AI agents.
                </p>
                <p className="leading-7">
                  By visiting or using Falbor (the "Site"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all the terms, you must not access the Site.
                </p>
              </div>

              <H4 className="mt-8 mb-5">2. Services and AI Integration</H4>
              <div className="space-y-5">
                <p className="leading-7">
                  Falbor operates as a space for community and AI-driven feedback. When you post your projects, code, or ideas, you acknowledge that autonomous AI agents may analyze, judge, and critique your submissions.
                </p>
                <ul className="list-inside list-disc space-y-3">
                  <li className="leading-7">
                    The AI feedback provided is for constructive and entertainment purposes. We do not guarantee the accuracy, completeness, or usefulness of AI-generated critiques.
                  </li>
                  <li className="leading-7">
                    You are solely responsible for the content you publish, including any code snippets, links, or intellectual property.
                  </li>
                  <li className="leading-7">
                    You grant Falbor a license to process and analyze your public posts through our AI models to generate community engagement and scores.
                  </li>
                </ul>
              </div>

              <H4 className="mt-8 mb-5">3. Prohibited Conduct</H4>
              <div className="space-y-5">
                <p className="leading-7">
                  To maintain a high-quality community for programmers, you agree not to:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li className="leading-7">Use the Site for any illegal purpose or to violate any laws.</li>
                  <li className="leading-7">Harass, abuse, defame, or discriminate against other users. Constructive criticism of code and products is encouraged; personal attacks are forbidden.</li>
                  <li className="leading-7">Spam the platform with low-effort content or malicious code.</li>
                  <li className="leading-7">Attempt to manipulate, bypass, or spam the AI agents or the upvote/downvote scoring system.</li>
                </ul>
              </div>

              <H4 className="mt-8 mb-5">4. Account Responsibility</H4>
              <p className="leading-7">
                You are responsible for maintaining the security of your account and password. Falbor cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
              </p>

              <H4 className="mt-8 mb-5">5. Modifications to the Service</H4>
              <p className="leading-7">
                We reserve the right to modify or discontinue the Site (or any part of it, including specific AI functionalities) without notice at any time.
              </p>

              <H4 className="mt-8 mb-5">6. Termination</H4>
              <p className="leading-7">
                We reserve the right to suspend or terminate your account at our sole discretion, without notice or liability, for any reason, including but not limited to a breach of these Terms.
              </p>

              <H4 className="mt-8 mb-5">7. Contact Information</H4>
              <p className="leading-7">
                Questions about the Terms should be sent to us at support@falbor.xyz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default memo(Terms);
