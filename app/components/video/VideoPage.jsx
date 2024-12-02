"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

const HIDE_DELAY = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function VideoPage({ 
    videoId: initialVideoId,
    autoHide = true,
    showControls = false,
    onError,
    onVideoLoad 
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoId, setVideoId] = useState(initialVideoId || "");
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
            setIsVisible(false);
        }, HIDE_DELAY);
    }, [autoHide]);

    const handleInteraction = useCallback((event) => {
        // Prevent interaction if clicking on control elements
        if (event?.target?.closest('.video-controls')) return;

        setIsVisible(true);
        startHideTimer();
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
            const [video] = await videoService.getVideo();
            
            if (!video?.url) {
                throw new Error("URL do vídeo não encontrada.");
            }

            const id = extractVideoId(video.url);
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
            // Communicate with YouTube iframe using postMessage
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: isMuted ? 'unMute' : 'mute'
                }),
                '*'
            );
        }
    }, [isMuted]);

    // Effect for video fetching
    useEffect(() => {
        if (!videoId) {
            fetchVideo();
        } else {
            setLoading(false);
        }
    }, [videoId, fetchVideo]);

    // Effect for handling interactions
    useEffect(() => {
        if (!autoHide) return;

        startHideTimer();

        const handleGlobalClick = (e) => handleInteraction(e);
        const handleKeyPress = (e) => handleInteraction(e);
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsVisible(false);
            }
        };

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleKeyPress);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleKeyPress);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleInteraction, startHideTimer, autoHide]);

    // Cleanup on unmount
    useEffect(() => {
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

    // Modificar a parte do return do componente
return (
    <div className={`${styles.videoWrapper} ${isVisible ? styles.fadeIn : styles.fadeOut}`}>
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

        <div 
            className={styles.clickOverlay} 
            onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                // Reinicia o timer para mostrar o vídeo novamente após 10 segundos
                setTimeout(() => {
                    setIsVisible(true);
                }, HIDE_DELAY);
            }}
        >
            <div className={`${styles.videoControls} video-controls`} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                    }}
                    className={styles.muteButton}
                    aria-label={isMuted ? "Ativar som" : "Desativar som"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>
            </div>
        </div>
    </div>
);
}