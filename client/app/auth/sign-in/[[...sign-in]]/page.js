import AuthLayout from "@/features/auth/components/AuthLayout";
import SignInForm from "@/features/auth/components/SignInForm";

export default function SignInPage() {
  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your padhle account to continue"
    >
      <SignInForm />
    </AuthLayout>
  );
}
