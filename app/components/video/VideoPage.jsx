"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";

export default function VideoPage({ videoId: initialVideoId }) {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoId, setVideoId] = useState(initialVideoId || "");
    const timerRef = useRef(null);
    const isTypingRef = useRef(false);
    const lastKeyPressRef = useRef(0);
    const typingTimeoutRef = useRef(null);

    const extractVideoId = useCallback((url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não é um vídeo do YouTube.");
        return match[1];
    }, []);

    const startHideTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            if (!isTypingRef.current) {
                setIsVisible(false);
            }
        }, 10000);
    }, []);

    const handleClick = useCallback((e) => {
        // Ignora cliques em elementos de input ou textarea
        if (e.target.tagName.toLowerCase() === 'input' || 
            e.target.tagName.toLowerCase() === 'textarea') {
            return;
        }

        // Verifica se não está digitando
        if (!isTypingRef.current) {
            setIsVisible(true);
            startHideTimer();
        }
    }, [startHideTimer]);

    const handleKeyPress = useCallback((e) => {
        // Atualiza o timestamp da última tecla pressionada
        lastKeyPressRef.current = Date.now();

        // Marca como digitando
        isTypingRef.current = true;

        // Limpa o timeout anterior se existir
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Define um novo timeout para verificar se parou de digitar
        typingTimeoutRef.current = setTimeout(() => {
            const timeSinceLastKeyPress = Date.now() - lastKeyPressRef.current;
            if (timeSinceLastKeyPress >= 1000) { // 1 segundo sem digitar
                isTypingRef.current = false;
                startHideTimer();
            }
        }, 1000);

        // Se for tecla de atalho (Ctrl, Alt, etc) ou teclas de navegação
        if (e.ctrlKey || e.altKey || e.metaKey || 
            ['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (!isTypingRef.current) {
                setIsVisible(true);
                startHideTimer();
            }
        }
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

    useEffect(() => {
        if (!videoId) {
            fetchVideo();
        }
    }, [videoId, fetchVideo]);

    useEffect(() => {
        startHideTimer();

        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleClick, handleKeyPress, startHideTimer]);

    // Detecta quando o foco está em elementos de input
    useEffect(() => {
        const handleFocus = (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'textarea') {
                isTypingRef.current = true;
                setIsVisible(false);
            }
        };

        const handleBlur = (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || 
                e.target.tagName.toLowerCase() === 'textarea') {
                isTypingRef.current = false;
                startHideTimer();
            }
        };

        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);

        return () => {
            document.removeEventListener('focus', handleFocus, true);
            document.removeEventListener('blur', handleBlur, true);
        };
    }, [startHideTimer]);

    return (
        <div className={styles.videoWrapper}>
            {loading && <div className={styles.loading}>Carregando...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {isVisible && !loading && !error && !isTypingRef.current && (
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
                        onClick={handleClick}
                    />
                </>
            )}
        </div>
    );
}
