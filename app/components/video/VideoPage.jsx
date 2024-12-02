"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

const HIDE_DELAY = 10000; // Tempo de delay para esconder/reaparecer o vídeo (em ms)
const RETRY_ATTEMPTS = 3; // Número máximo de tentativas ao buscar o vídeo
const RETRY_DELAY = 2000; // Delay entre tentativas de recuperação do vídeo (em ms)

export default function VideoPage({
    autoHide = true, // Esconde o vídeo após interação?
    showControls = false, // Exibir controles do player?
    onError, // Callback para erros
    onVideoLoad, // Callback para carregamento de vídeo
}) {
    const [videoId, setVideoId] = useState("");
    const [isVisible, setIsVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const iframeRef = useRef(null);
    const hideTimerRef = useRef(null);

    // Função para extrair o ID de um vídeo do YouTube a partir da URL
    const extractVideoId = useCallback((url) => {
        if (typeof url !== "string") {
            throw new Error("A URL fornecida não é uma string válida.");
        }

        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/,
            /^[a-zA-Z0-9_-]{11}$/, // Caso o input já seja um ID direto
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        throw new Error("URL inválida. Não é um vídeo do YouTube válido.");
    }, []);

    // Função para buscar o vídeo na API
    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = await videoService.getVideo();

            if (!url || typeof url !== "string") {
                throw new Error("URL do vídeo ausente ou inválida.");
            }

            const id = extractVideoId(url);
            setVideoId(id);
            setRetryCount(0); // Reset ao obter sucesso
            if (onVideoLoad) onVideoLoad(id);
        } catch (err) {
            console.error("Erro ao carregar o vídeo:", err);
            setError(err.message);
            if (onError) onError(err);

            // Retry logic
            if (retryCount < RETRY_ATTEMPTS) {
                setTimeout(() => {
                    setRetryCount((prev) => prev + 1);
                    fetchVideo();
                }, RETRY_DELAY);
            }
        } finally {
            setLoading(false);
        }
    }, [extractVideoId, onError, onVideoLoad, retryCount]);

    // Função para alternar o estado de som
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: "command",
                    func: isMuted ? "unMute" : "mute",
                }),
                "*"
            );
        }
    }, [isMuted]);

    // Timer para esconder o vídeo
    const startHideTimer = useCallback(() => {
        if (!autoHide) return;

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, HIDE_DELAY);
    }, [autoHide]);

    // Interação do usuário que reinicia o timer
    const handleInteraction = useCallback(() => {
        setIsVisible(true);
        startHideTimer();
    }, [startHideTimer]);

    // Fetch inicial do vídeo
    useEffect(() => {
        fetchVideo();
    }, [fetchVideo]);

    // Cleanup do timer ao desmontar o componente
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
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
                        <button onClick={fetchVideo} className={styles.retryButton}>
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
            />

            <div className={styles.videoControls}>
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
    );
}
