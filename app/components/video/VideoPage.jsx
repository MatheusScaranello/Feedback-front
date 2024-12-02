"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

const HIDE_DELAY = 10000; // Tempo para esconder o player (em ms)
const RETRY_ATTEMPTS = 3; // Tentativas máximas para buscar o vídeo
const RETRY_DELAY = 2000; // Intervalo entre tentativas (em ms)

export default function VideoPage({
    autoHide = true, // Esconder o vídeo após interação?
    showControls = false, // Mostrar controles do player?
    onError, // Callback para erros
    onVideoLoad, // Callback para carregamento de vídeo
}) {
    const [videoId, setVideoId] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const iframeRef = useRef(null);
    const hideTimerRef = useRef(null);

    // Função para extrair o ID do vídeo do YouTube a partir de uma URL
    const extractVideoId = useCallback((url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não foi possível extrair o ID do vídeo.");
        return match[1];
    }, []);

    // Função para buscar o vídeo do servidor
    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const video = await videoService.getVideo();
            if (!video || !video.url) throw new Error("URL do vídeo não encontrada.");
            
            const id = extractVideoId(video.url);
            setVideoId(id);
            if (onVideoLoad) onVideoLoad(id);
            setRetryCount(0); // Resetar contagem de tentativas
        } catch (err) {
            console.error("Erro ao buscar o vídeo:", err);
            setError(err.message);
            if (onError) onError(err);

            // Lógica de tentativas
            if (retryCount < RETRY_ATTEMPTS) {
                setRetryCount((prev) => prev + 1);
                setTimeout(fetchVideo, RETRY_DELAY);
            }
        } finally {
            setLoading(false);
        }
    }, [extractVideoId, onError, onVideoLoad, retryCount]);

    // Função para alternar o estado do áudio (mutado/desmutado)
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

    // Timer para esconder o player
    const startHideTimer = useCallback(() => {
        if (!autoHide) return;

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, HIDE_DELAY);
    }, [autoHide]);

    // Reiniciar o timer ao interagir
    const handleInteraction = useCallback(() => {
        setIsVisible(true);
        startHideTimer();
    }, [startHideTimer]);

    // Buscar o vídeo na inicialização
    useEffect(() => {
        fetchVideo();
    }, [fetchVideo]);

    // Limpar o timer ao desmontar o componente
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    // Renderizar estado de carregamento
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

    // Renderizar mensagem de erro
    if (error) {
        return (
            <div className={styles.videoWrapper}>
                <div className={styles.error}>
                    <p>{error}</p>
                    {retryCount < RETRY_ATTEMPTS && (
                        <button onClick={fetchVideo} className={styles.retryButton}>
                            Tentar Novamente
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Renderizar player de vídeo
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
            ></iframe>

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
