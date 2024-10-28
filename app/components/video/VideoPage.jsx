"use client";
import { useState, useEffect } from "react";
import styles from "./video.module.css";

export default function VideoPage({ videoId }) {
    const [isVisible, setIsVisible] = useState(true);

    const handleScreenClick = () => {
        setIsVisible(false); // Oculte o vídeo ao clicar na tela
    };

    useEffect(() => {
        let timeout;

        if (!isVisible) {
            // Configura o temporizador para tornar o vídeo visível novamente após 10 segundos
            timeout = setTimeout(() => setIsVisible(true), 10000);
        }

        return () => {
            clearTimeout(timeout); // Limpa o timeout se o componente for desmontado
        };
    }, [isVisible]);

    return (
        <div className={styles.videoWrapper}>
            {isVisible && (
                <>
                    {/* Contêiner do Vídeo */}
                    <iframe
                        className={styles.video}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    
                    {/* Camada de Overlay Invisível para Capturar o Clique */}
                    <div className={styles.clickOverlay} onClick={handleScreenClick}></div>
                </>
            )}
        </div>
    );
}
