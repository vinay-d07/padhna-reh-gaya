import { SignIn } from "@clerk/nextjs";

export default function SignInForm() {
  return (
    <SignIn
      path="/auth/sign-in"
      routing="path"
      signUpUrl="/auth/sign-up"



    
    />
  );
}
