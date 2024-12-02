"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

const HIDE_DELAY = 10000; // 10 segundos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 segundos

export default function VideoPage({ 
    autoHide = true,
    showControls = false,
    onError,
    onVideoLoad 
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoId, setVideoId] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const timerRef = useRef(null);
    const iframeRef = useRef(null);

    const extractVideoId = useCallback((url) => {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/,
            /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        throw new Error("URL inválida. Não é um vídeo do YouTube válido.");
    }, []);

    const startHideTimer = useCallback(() => {
        if (!autoHide) return;
        
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            setIsVisible(true); // Reaparece após 10 segundos
        }, HIDE_DELAY);
    }, [autoHide]);

    const handleInteraction = useCallback(() => {
        setIsVisible(false); // Esconde o vídeo
        startHideTimer(); // Inicia o timer para reaparecer
    }, [startHideTimer]);

    const handleVideoError = useCallback((error) => {
        console.error("Erro no vídeo:", error);
        setError(error.message);
        
        if (onError) {
            onError(error);
        }

        // Retry logic
        if (retryCount < RETRY_ATTEMPTS) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                fetchVideo();
            }, RETRY_DELAY);
        }
    }, [retryCount, onError]);

    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = await videoService.getVideo();
            const id = extractVideoId(url);
            setVideoId(id);
            setRetryCount(0); // Reset retry count on success
            
            if (onVideoLoad) {
                onVideoLoad(id);
            }
        } catch (err) {
            handleVideoError(err);
        } finally {
            setLoading(false);
        }
    }, [extractVideoId, handleVideoError, onVideoLoad]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        
        if (iframeRef.current) {
            // Comunica com o iframe do YouTube usando postMessage
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: isMuted ? 'unMute' : 'mute'
                }),
                '*'
            );
        }
    }, [isMuted]);

    useEffect(() => {
        fetchVideo();
    }, [fetchVideo]);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <div className={styles.videoWrapper}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Carregando vídeo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.videoWrapper}>
                <div className={styles.error}>
                    <p>{error}</p>
                    {retryCount < RETRY_ATTEMPTS && (
                        <button 
                            onClick={fetchVideo}
                            className={styles.retryButton}
                        >
                            Tentar novamente
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`${styles.videoWrapper} ${isVisible ? styles.fadeIn : styles.fadeOut}`} 
            onClick={handleInteraction}
        >
            <iframe
                ref={iframeRef}
                className={styles.video}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=${showControls ? 1 : 0}&mute=${isMuted ? 1 : 0}&enablejsapi=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={handleVideoError}
            />
        </div>
    );
}
