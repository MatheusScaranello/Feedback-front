"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

export default function VideoPage({ videoId: initialVideoId }) {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoId, setVideoId] = useState(initialVideoId || "");
    const [timer, setTimer] = useState(null); // New state to track the timer

    const extractVideoId = useCallback((url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não é um vídeo do YouTube.");
        return match[1];
    }, []);

    // Modified to handle timer reset
    const startHideTimer = useCallback(() => {
        // Clear existing timer if any
        if (timer) clearTimeout(timer);
        
        // Set new timer
        const newTimer = setTimeout(() => setIsVisible(false), 10000);
        setTimer(newTimer);
    }, [timer]);

    // Modified click handler
    const handleInteraction = useCallback(() => {
        setIsVisible(true);
        startHideTimer();
    }, [startHideTimer]);

    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [video] = await videoService.getVideo();
            if (!video?.url) throw new Error("URL do vídeo inválida.");

            const id = extractVideoId(video.url);
            setVideoId(id);
        } catch (err) {
            console.error("Erro ao carregar o vídeo: ", err);
            setError(err.message || "Erro ao carregar o vídeo.");
        } finally {
            setLoading(false);
        }
    }, [extractVideoId]);

    // Effect for video fetching
    useEffect(() => {
        if (!videoId) {
            fetchVideo();
        }
    }, [videoId, fetchVideo]);

    // Effect for handling interactions
    useEffect(() => {
        // Start initial timer
        startHideTimer();

        // Add event listeners for both click and keyboard
        const handleGlobalClick = (e) => handleInteraction();
        const handleKeyPress = (e) => handleInteraction();

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleKeyPress);

        // Cleanup
        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleInteraction, startHideTimer, timer]);

    return (
        <div className={styles.videoWrapper}>
            {loading && <div className={styles.loading}>Carregando...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {isVisible && !loading && !error && (
                <>
                    <iframe
                        className={styles.video}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>

                    <div 
                        className={styles.clickOverlay} 
                        onClick={handleInteraction}
                    />
                </>
            )}
        </div>
    );
}
