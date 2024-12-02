"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./video.module.css";
import apiVideo from "../../service/video"; // Importando o serviço correto

const VideoPage = ({ showControls = false }) => {
    const [videoId, setVideoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const iframeRef = useRef(null);

    // Função para extrair o ID do vídeo a partir da URL
    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não foi possível extrair o ID do vídeo.");
        return match[1];
    };

    // Função para buscar o vídeo do servidor
    const fetchVideo = async () => {
        setLoading(true);
        setError(null);

        try {
            const [video] = await apiVideo.getVideo(); // Alinhado com o formato usado no VideoLink
            if (!video || !video.url) throw new Error("URL do vídeo não encontrada.");

            const id = extractVideoId(video.url);
            setVideoId(id);
        } catch (err) {
            console.error("Erro ao carregar o vídeo:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Buscar o vídeo ao montar o componente
    useEffect(() => {
        fetchVideo();
    }, []);

    // Renderizar estado de carregamento
    if (loading) {
        return (
            <div className={styles.videoWrapper}>
                <p>Carregando vídeo...</p>
            </div>
        );
    }

    // Renderizar mensagem de erro
    if (error) {
        return (
            <div className={styles.videoWrapper}>
                <p>{error}</p>
                <button onClick={fetchVideo} className={styles.retryButton}>
                    Tentar Novamente
                </button>
            </div>
        );
    }

    // Renderizar player de vídeo
    return (
        <div className={styles.videoWrapper}>
            <iframe
                ref={iframeRef}
                className={styles.video}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=${showControls ? 1 : 0}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default VideoPage;
