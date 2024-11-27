"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import videoService from "../../service/video";
import { debounce } from 'lodash';
import { toast } from 'react-toastify';

export default function VideoPage({ videoId: initialVideoId, preferences = {} }) {
    // Estados principais
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoId, setVideoId] = useState(initialVideoId || "");
    const [videoQuality, setVideoQuality] = useState('auto');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [volume, setVolume] = useState(50);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedPercentage, setBufferedPercentage] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [annotations, setAnnotations] = useState([]);
    const [userPreferences, setUserPreferences] = useState(preferences);

    // Refs
    const playerRef = useRef(null);
    const timerRef = useRef(null);
    const isTypingRef = useRef(false);
    const lastKeyPressRef = useRef(0);
    const typingTimeoutRef = useRef(null);
    const videoWrapperRef = useRef(null);
    const youtubePlayerRef = useRef(null);
    const gestureRef = useRef({ startX: 0, startY: 0 });
    const volumeBeforeMuteRef = useRef(volume);

    // Analytics state
    const [analytics, setAnalytics] = useState({
        watchTime: 0,
        interactions: 0,
        bufferingEvents: 0,
        qualityChanges: 0,
    });

    const extractVideoId = useCallback((url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não é um vídeo do YouTube.");
        return match[1];
    }, []);

    // Gerenciamento avançado de qualidade do vídeo
    const setOptimalQuality = useCallback(() => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            if (connection.downlink > 5) {
                setVideoQuality('hd1080');
            } else if (connection.downlink > 2.5) {
                setVideoQuality('hd720');
            } else {
                setVideoQuality('medium');
            }
        }
    }, []);

    // Sistema de cache inteligente
    const videoCacheManager = useCallback(() => {
        if ('caches' in window) {
            caches.open('video-cache').then(cache => {
                // Cache de thumbnails e metadados
                cache.add(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
            });
        }
    }, [videoId]);

    // Gerenciamento avançado de buffer
    const handleBuffering = useCallback((event) => {
        if (youtubePlayerRef.current) {
            const buffered = youtubePlayerRef.current.getVideoLoadedFraction();
            setBufferedPercentage(buffered * 100);

            if (buffered < 0.5) {
                setVideoQuality('medium'); // Reduz qualidade automaticamente
                setAnalytics(prev => ({
                    ...prev,
                    bufferingEvents: prev.bufferingEvents + 1
                }));
            }
        }
    }, []);

    // Sistema de gestos
    const handleGestures = useCallback((e) => {
        if (e.type === 'touchstart') {
            gestureRef.current.startX = e.touches[0].clientX;
            gestureRef.current.startY = e.touches[0].clientY;
        } else if (e.type === 'touchmove') {
            const deltaX = e.touches[0].clientX - gestureRef.current.startX;
            const deltaY = e.touches[0].clientY - gestureRef.current.startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Gesto horizontal - Seek
                const seekTime = (deltaX / window.innerWidth) * duration;
                if (youtubePlayerRef.current) {
                    youtubePlayerRef.current.seekTo(currentTime + seekTime, true);
                }
            } else {
                // Gesto vertical - Volume
                const volumeChange = -(deltaY / window.innerHeight) * 100;
                setVolume(prev => Math.max(0, Math.min(100, prev + volumeChange)));
            }
        }
    }, [currentTime, duration]);

    // Sistema de atalhos de teclado aprimorado
    const handleKeyboardShortcuts = useCallback((e) => {
        if (isTypingRef.current) return;

        const shortcuts = {
            ' ': () => togglePlay(),
            'f': () => toggleFullscreen(),
            'm': () => toggleMute(),
            'ArrowLeft': () => seek(-10),
            'ArrowRight': () => seek(10),
            'ArrowUp': () => adjustVolume(5),
            'ArrowDown': () => adjustVolume(-5),
            '0': () => seek(0, true),
            '1': () => seek(0.1, true),
            '2': () => seek(0.2, true),
            '3': () => seek(0.3, true),
            '4': () => seek(0.4, true),
            '5': () => seek(0.5, true),
            '6': () => seek(0.6, true),
            '7': () => seek(0.7, true),
            '8': () => seek(0.8, true),
            '9': () => seek(0.9, true),
        };

        if (shortcuts[e.key]) {
            e.preventDefault();
            shortcuts[e.key]();
            setAnalytics(prev => ({
                ...prev,
                interactions: prev.interactions + 1
            }));
        }
    }, []);

    // Sistema de anotações
    const addAnnotation = useCallback((text) => {
        const newAnnotation = {
            id: Date.now(),
            text,
            timestamp: currentTime,
            videoId
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        
        // Salva no localStorage
        const savedAnnotations = JSON.parse(localStorage.getItem('videoAnnotations') || '{}');
        savedAnnotations[videoId] = [...(savedAnnotations[videoId] || []), newAnnotation];
        localStorage.setItem('videoAnnotations', JSON.stringify(savedAnnotations));
    }, [currentTime, videoId]);

    // Sistema de preferências do usuário
    const saveUserPreferences = useCallback(() => {
        const preferences = {
            volume,
            quality: videoQuality,
            playbackSpeed,
            annotations: annotations.length > 0
        };
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        setUserPreferences(preferences);
    }, [volume, videoQuality, playbackSpeed, annotations]);

    // Otimização de performance
    const optimizePerformance = useCallback(() => {
        if (document.visibilityState === 'hidden') {
            setVideoQuality('low');
        } else {
            setOptimalQuality();
        }
    }, [setOptimalQuality]);

    // Sistema de recuperação de erro
    const handleError = useCallback((error) => {
        console.error("Erro no player:", error);
        setError(error.message);

        // Tenta recuperar automaticamente
        const recoveryStrategies = [
            () => fetchVideo(), // Recarrega o vídeo
            () => setVideoQuality('medium'), // Reduz qualidade
            () => playerRef.current?.reload(), // Recarrega o player
        ];

        const tryRecovery = async () => {
            for (const strategy of recoveryStrategies) {
                try {
                    await strategy();
                    setError(null);
                    break;
                } catch (e) {
                    console.error("Falha na estratégia de recuperação:", e);
                }
            }
        };

        tryRecovery();
    }, [fetchVideo]);

    // Melhorias na experiência do usuário
    const enhanceUserExperience = useCallback(() => {
        // Preload de thumbnails
        const img = new Image();
        img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // Picture-in-Picture
        if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
            playerRef.current?.requestPictureInPicture();
        }
    }, [videoId]);

    // Sistema de analytics aprimorado
    const trackAnalytics = useCallback(debounce(() => {
        const analyticsData = {
            ...analytics,
            videoId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            performance: {
                buffering: bufferedPercentage,
                quality: videoQuality,
                playbackSpeed
            }
        };

        // Envia para seu sistema de analytics
        try {
            localStorage.setItem('videoAnalytics', JSON.stringify(analyticsData));
            // Aqui você pode enviar para sua API de analytics
        } catch (error) {
            console.error("Erro ao salvar analytics:", error);
        }
    }, 5000), [analytics, videoId, bufferedPercentage, videoQuality, playbackSpeed]);

    useEffect(() => {
        if (!videoId) {
            fetchVideo();
        }

        // Inicialização
        setOptimalQuality();
        videoCacheManager();
        
        // Event Listeners
        window.addEventListener('keydown', handleKeyboardShortcuts);
        document.addEventListener('visibilitychange', optimizePerformance);
        videoWrapperRef.current?.addEventListener('touchstart', handleGestures);
        videoWrapperRef.current?.addEventListener('touchmove', handleGestures);

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            window.removeEventListener('keydown', handleKeyboardShortcuts);
            document.removeEventListener('visibilitychange', optimizePerformance);
            videoWrapperRef.current?.removeEventListener('touchstart', handleGestures);
            videoWrapperRef.current?.removeEventListener('touchmove', handleGestures);
        };
    }, [
        videoId,
        fetchVideo,
        handleKeyboardShortcuts,
        optimizePerformance,
        handleGestures,
        setOptimalQuality,
        videoCacheManager
    ]);

    // Renderização do componente
    return (
        <div className={styles.videoWrapper} ref={videoWrapperRef}>
            {loading && <div className={styles.loading}>Carregando...</div>}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={() => fetchVideo()}>Tentar novamente</button>
                </div>
            )}

            {isVisible && !loading && !error && !isTypingRef.current && (
                <div className={`${styles.playerContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
                    <iframe
                        ref={playerRef}
                        className={styles.video}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=1&enablejsapi=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => {
                            setLoading(false);
                            enhanceUserExperience();
                        }}
                    />

                    {/* Controles customizados */}
                    <div className={styles.customControls}>
                        <div className={styles.progressBar}>
                            <div 
                                className={styles.buffer}
                                style={{ width: `${bufferedPercentage}%` }}
                            />
                            <div 
                                className={styles.progress}
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>

                        <div className={styles.controlsBottom}>
                            <button onClick={() => togglePlay()}>
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>

                            <div className={styles.volumeControl}>
                                <button onClick={() => toggleMute()}>
                                    {isMuted ? 'Unmute' : 'Mute'}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                />
                            </div>

                            <select 
                                value={videoQuality}
                                onChange={(e) => setVideoQuality(e.target.value)}
                            >
                                <option value="auto">Auto</option>
                                <option value="hd1080">1080p</option>
                                <option value="hd720">720p</option>
                                <option value="medium">480p</option>
                                <option value="small">360p</option>
                            </select>

                            <select
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                            >
                                <option value="0.25">0.25x</option>
                                <option value="0.5">0.5x</option>
                                <option value="1">Normal</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2x</option>
                            </select>

                            <button onClick={() => toggleFullscreen()}>
                                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            </button>
                        </div>
                    </div>

                    {/* Anotações */}
                    <div className={styles.annotations}>
                        {annotations.map(annotation => (
                            <div 
                                key={annotation.id}
                                className={styles.annotation}
                                style={{
                                    left: `${(annotation.timestamp / duration) * 100}%`
                                }}
                            >
                                {annotation.text}
                            </div>
                        ))}
                    </div>

                    {/* Overlay para gestos */}
                    <div 
                        className={styles.gestureOverlay}
                        onTouchStart={handleGestures}
                        onTouchMove={handleGestures}
                    />
                </div>
            )}

            {/* Estatísticas e debug info (pode ser toggleado) */}
            <div className={styles.stats}>
                <p>Buffer: {bufferedPercentage.toFixed(1)}%</p>
                <p>Quality: {videoQuality}</p>
                <p>Watch Time: {analytics.watchTime}s</p>
                <p>Interactions: {analytics.interactions}</p>
            </div>
        </div>
    );
}
