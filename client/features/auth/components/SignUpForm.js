import { SignUp } from "@clerk/nextjs";

export default function SignUpForm() {
  return (
    <SignUp
      path="/auth/sign-up"
      routing="path"
      signInUrl="/auth/sign-in"


    />
  );
}
