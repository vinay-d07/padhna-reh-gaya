export const clerkAppearance = {
  variables: {
    colorPrimary: "#000000",
    colorText: "#000000",
    colorTextSecondary: "#444444",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#000000",
    borderRadius: "8px",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full",
    card: "w-full shadow-none rounded-card-lg bg-paper-white p-0",
    header: "hidden",
    footer: "bg-transparent",
    footerActionText: "text-slate",
    footerActionLink: "text-carbon-black font-medium hover:underline",
    formButtonPrimary:
      "bg-carbon-black hover:bg-graphite text-body font-medium normal-case rounded-lg",
    formFieldInput:
      "rounded-lg border border-ash focus:border-carbon-black focus:ring-1 focus:ring-carbon-black",
    formFieldLabel: "text-body-sm font-medium text-slate",
    dividerLine: "bg-ash",
    dividerText: "text-smoke",
    socialButtonsBlockButton: "rounded-lg border border-ash hover:bg-mist-gray",
    identityPreview: "rounded-lg border border-ash",
    footerPagesLink: "text-slate hover:text-carbon-black",
  },
};
