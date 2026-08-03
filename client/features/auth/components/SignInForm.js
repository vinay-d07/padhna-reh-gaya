import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/features/auth/clerkAppearance";

export default function SignInForm() {
  return (
    <SignIn
      path="/auth/sign-in"
      routing="path"
      signUpUrl="/auth/sign-up"
      appearance={clerkAppearance}
    />
  );
}
