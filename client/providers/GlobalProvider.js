"use client";

import { ClerkProvider } from "@clerk/nextjs";
import AuthTokenBridge from "./AuthTokenBridge";
import UserSync from "./UserSync";
import ToastProvider from "./ToastProvider";

export const GlobalProvider = ({ children }) => {
    return (
        <ClerkProvider>
            <AuthTokenBridge />
            <ToastProvider>
                <UserSync>{children}</UserSync>
            </ToastProvider>
        </ClerkProvider>
    );
};