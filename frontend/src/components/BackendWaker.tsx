"use client";

import { useEffect } from 'react';

export const BackendWaker = () => {
    useEffect(() => {
        const wakeBackend = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://skill-swap-by-sonu.onrender.com";
                console.log("Pinging backend to wake it up...");
                // Just a simple fetch to the root or a health endpoint
                fetch(`${backendUrl}/`, { mode: 'no-cors' }).catch(() => {});
            } catch (error) {
                // Ignore errors, this is just a best-effort ping
            }
        };

        wakeBackend();
    }, []);

    return null; // This component doesn't render anything
};
