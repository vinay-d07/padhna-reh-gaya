import AuthLayout from "@/features/auth/components/AuthLayout";
import SignUpForm from "@/features/auth/components/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join padhle and elevate your study experience"
    >
      <SignUpForm />
    </AuthLayout>
  );
}
