import { redirect } from "next/navigation";

export default function InvitePage({ params }: { params: { token: string } }) {
  redirect(`/signup?invite=${params.token}`);
}
