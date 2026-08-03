export const metadata = {
  title: "Authentication - padhle",
  description: "Sign in or register your account on padhle",
};

export default function AuthLayoutGroup({ children }) {
  return (
    <div className="min-h-screen bg-warm-canvas text-carbon-black">
      {children}
    </div>
  );
}
