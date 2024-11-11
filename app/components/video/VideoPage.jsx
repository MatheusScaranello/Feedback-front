"use client"; // Indica que este componente deve ser renderizado no lado do cliente (relevante em frameworks como Next.js)

import { useState, useEffect } from "react"; // Importa hooks do React para gerenciar estado e efeitos colaterais
import styles from "./video.module.css"; // Importa estilos CSS específicos para este componente

// Componente principal para a página de vídeo
export default function VideoPage({ videoId }) {
    const [isVisible, setIsVisible] = useState(true); // Estado para controlar a visibilidade do vídeo

    // Função para lidar com cliques na tela
    const handleScreenClick = () => {
        setIsVisible(false); // Oculta o vídeo ao clicar na tela
    };

    // Efeito que controla a visibilidade do vídeo
    useEffect(() => {
        let timeout; // Declara uma variável para armazenar o timeout

        if (!isVisible) {
            // Se o vídeo não estiver visível, configura o temporizador para torná-lo visível novamente após 10 segundos
            timeout = setTimeout(() => setIsVisible(true), 10000);
        }

        // Limpa o timeout quando o componente é desmontado ou quando o estado 'isVisible' muda
        return () => {
            clearTimeout(timeout); // Cancela o temporizador se o componente for desmontado ou se 'isVisible' mudar
        };
    }, [isVisible]); // Reexecuta o efeito sempre que 'isVisible' muda

    return (
        <div className={styles.videoWrapper}> {/* Contêiner principal do vídeo */}
            {isVisible && ( // Renderiza o vídeo e a camada de clique apenas se 'isVisible' for verdadeiro
                <>
                    {/* Contêiner do Vídeo */}
                    <iframe
                        className={styles.video} // Aplica estilos ao iframe do vídeo
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=0`} // URL do vídeo do YouTube, configurado para autoplay e loop
                        title="YouTube video player" // Título acessível para o iframe
                        frameBorder="0" // Remove a borda do iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" // Permissões para o iframe
                        allowFullScreen // Permite que o vídeo seja exibido em tela cheia
                    ></iframe>
                    
                    {/* Camada de Overlay Invisível para Capturar o Clique */}
                    <div className={styles.clickOverlay} onClick={handleScreenClick}></div> {/* Camada que captura cliques para ocultar o vídeo */}
                </>
            )}
        </div>
    );
}