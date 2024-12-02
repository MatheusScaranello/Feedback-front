"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import apiVideo from "../../service/video"; // Serviço para buscar o vídeo

const HIDE_DELAY = 10000; // Tempo de auto-hide (ms)
const RETRY_ATTEMPTS = 3; // Máximo de tentativas para carregar o vídeo
const RETRY_DELAY = 2000; // Intervalo entre tentativas (ms)

export default function VideoPage({
    showControls = false, // Exibir controles no player
    onError, // Callback para erros
    onVideoLoad, // Callback para sucesso no carregamento do vídeo
}) {
    const [videoId, setVideoId] = useState(null);
    const [isVisible, setIsVisible] = useState(true); // Controle de visibilidade
    const [isMuted, setIsMuted] = useState(true); // Controle de som
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const [error, setError] = useState(null); // Estado de erro
    const [retryCount, setRetryCount] = useState(0); // Contador de tentativas de retry
    const iframeRef = useRef(null); // Referência ao iframe do vídeo
    const hideTimerRef = useRef(null); // Referência ao timer de esconder o vídeo

    // Função para extrair o ID do vídeo a partir da URL
    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não foi possível extrair o ID do vídeo.");
        return match[1];
    };

    // Função para buscar o vídeo do servidor
    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [video] = await apiVideo.getVideo(); // Busca o vídeo do serviço
            if (!video || !video.url) throw new Error("URL do vídeo não encontrada.");

            const id = extractVideoId(video.url);
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
    }, [onError, onVideoLoad, retryCount]);

    // Alternar estado de som
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

    // Configurar timer de auto-hide
    const startHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setIsVisible(true); // Exibe o vídeo após 10 segundos sem interação
        }, HIDE_DELAY);
    }, []);

    // Função para manipular a interação do usuário
    const handleUserInteraction = useCallback(() => {
        setIsVisible(false); // Esconde o vídeo quando há interação
        startHideTimer(); // Reinicia o timer para exibir após 10 segundos
    }, [startHideTimer]);

    // Buscar o vídeo ao montar o componente
    useEffect(() => {
        fetchVideo();

        // Adicionar eventos de interação do usuário
        const interactionEvents = [
            "click", "mousemove", "keydown", "touchstart", "scroll"
        ];

        interactionEvents.forEach((event) => {
            window.addEventListener(event, handleUserInteraction);
        });

        // Limpar os eventos e o timer ao desmontar o componente
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }

            interactionEvents.forEach((event) => {
                window.removeEventListener(event, handleUserInteraction);
            });
        };
    }, [fetchVideo, handleUserInteraction]);

    // Limpar o timer ao desmontar o componente
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
