import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import AvatarUpload from "@/components/Shared/AvatarUpload";
import BackButton from "@/components/Shared/BackButton";
import CoverUpload from "@/components/Shared/CoverUpload";
import {
  Button,
  Card,
  CardHeader,
  Form,
  Input,
  TextArea,
  useZodForm
} from "@/components/Shared/UI";
import { ERRORS } from "@/data/errors";
import { api } from "@/lib/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const ValidationSchema = z.object({
  displayName: z.string().max(100, { message: "Display Name should not exceed 100 characters" }).optional(),
  bio: z.string().max(260, { message: "Bio should not exceed 260 characters" }).optional(),
  location: z.string().max(100, { message: "Location should not exceed 100 characters" }).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

const PersonalizeSettingsForm = () => {
  const { currentAccount, setCurrentAccount } = useAccountStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    currentAccount?.avatarUrl || ""
  );
  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    currentAccount?.coverUrl || ""
  );

  const form = useZodForm({
    defaultValues: {
      displayName: currentAccount?.displayName || "",
      bio: currentAccount?.bio || "",
      location: currentAccount?.location || "",
      website: currentAccount?.website || ""
    },
    schema: ValidationSchema
  });

  const updateAccount = async (
    data: z.infer<typeof ValidationSchema>,
    avatarSrc: string | undefined,
    coverSrc: string | undefined
  ) => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }

    setIsSubmitting(true);
    umami.track("update_profile");
    
    try {
      const response = await api.me.update({
        ...data,
        avatarUrl: avatarSrc,
        coverUrl: coverSrc
      });
      
      setCurrentAccount({ ...currentAccount, ...response.me });
      toast.success("Account updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSetAvatar = async (src: string | undefined) => {
    setAvatarUrl(src);
    return await updateAccount({ ...form.getValues() }, src, coverUrl);
  };

  const onSetCover = async (src: string | undefined) => {
    setCoverUrl(src);
    return await updateAccount({ ...form.getValues() }, avatarUrl, src);
  };

  return (
    <Card>
      <CardHeader icon={<BackButton path="/settings" />} title="Personalize" />
      <Form
        className="space-y-4 p-5"
        form={form}
        onSubmit={(data) => updateAccount(data, avatarUrl, coverUrl)}
      >
        <Input
          disabled
          label="Username"
          type="text"
          value={`@${currentAccount?.username}`}
        />
        <Input
          label="Display Name"
          placeholder="Gavin Belson"
          type="text"
          {...form.register("displayName")}
        />
        <Input
          label="Location"
          placeholder="Miami"
          type="text"
          {...form.register("location")}
        />
        <Input
          label="Website"
          placeholder="https://example.com"
          type="text"
          {...form.register("website")}
        />
        <TextArea
          label="Bio"
          placeholder="Tell us something about you!"
          {...form.register("bio")}
        />
        <AvatarUpload setSrc={onSetAvatar} src={avatarUrl || ""} />
        <CoverUpload setSrc={onSetCover} src={coverUrl || ""} />
        <Button
          className="ml-auto"
          disabled={isSubmitting}
          loading={isSubmitting}
          type="submit"
        >
          Save
        </Button>
      </Form>
    </Card>
  );
};

export default PersonalizeSettingsForm;
