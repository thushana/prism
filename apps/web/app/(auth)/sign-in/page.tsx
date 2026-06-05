import { SignInPage } from "authentication";
import { authEnv } from "@/config/auth";

export default function SignInRoutePage() {
  return <SignInPage authBaseURL={authEnv.BETTER_AUTH_URL} />;
}
