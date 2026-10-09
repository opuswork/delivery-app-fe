import { redirect } from "next/navigation";

/** The app no longer has a login; old links and home-screen shortcuts open the app. */
export default function LoginPage() {
  redirect("/");
}
