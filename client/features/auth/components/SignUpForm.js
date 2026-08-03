import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/features/auth/clerkAppearance";

export default function SignUpForm() {
  return (
    <SignUp
      path="/auth/sign-up"
      routing="path"
      signInUrl="/auth/sign-in"
      appearance={clerkAppearance}
    />
  );
}
