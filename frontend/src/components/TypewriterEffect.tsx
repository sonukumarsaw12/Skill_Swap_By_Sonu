"use client";

import { useEffect, useState } from "react";

interface TypewriterEffectProps {
    phrases: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseTime?: number;
}

export const TypewriterEffect = ({
    phrases,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseTime = 2000,
}: TypewriterEffectProps) => {
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [delta, setDelta] = useState(typingSpeed);

    useEffect(() => {
        let ticker = setTimeout(() => {
            tick();
        }, delta);

        return () => clearTimeout(ticker);
    }, [text, delta]);

    const tick = () => {
        let i = loopNum % phrases.length;
        let fullText = phrases[i];
        let updatedText = isDeleting
            ? fullText.substring(0, text.length - 1)
            : fullText.substring(0, text.length + 1);

        setText(updatedText);

        if (isDeleting) {
            setDelta(deletingSpeed);
        }

        if (!isDeleting && updatedText === fullText) {
            setIsDeleting(true);
            setDelta(pauseTime);
        } else if (isDeleting && updatedText === "") {
            setIsDeleting(false);
            setLoopNum(loopNum + 1);
            setDelta(typingSpeed);
        } else {
            // Add slight randomness to typing for realism
            if (!isDeleting) {
                setDelta(typingSpeed - Math.random() * 20);
            }
        }
    };

    return (
        <span className="inline-block min-h-[1.5em] text-gray-600 dark:text-gray-400 text-lg transition-all duration-200">
            {text}
            <span className="animate-pulse ml-1 text-indigo-500 font-bold">|</span>
        </span>
    );
};
