"use client";

import { ClerkProvider } from "@clerk/nextjs";
import UserSync from "./UserSync";

export const GlobalProvider = ({ children }) => {
    return (
        <ClerkProvider>
            <UserSync>{children}</UserSync>
        </ClerkProvider>
    );
};