"use client";

import { ClerkProvider } from "@clerk/nextjs";
import AuthTokenBridge from "./AuthTokenBridge";
import UserSync from "./UserSync";

export const GlobalProvider = ({ children }) => {
    return (
        <ClerkProvider>
            <AuthTokenBridge />
            <UserSync>{children}</UserSync>
        </ClerkProvider>
    );
};