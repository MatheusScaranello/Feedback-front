"use client"; // Indica que este componente deve ser renderizado no lado do cliente (relevante em frameworks como Next.js)

import { useState, useEffect, useCallback } from "react"; // Importa hooks do React para gerenciar estado e efeitos colaterais
import styles from "./video.module.css"; // Importa estilos CSS específicos para este componente

import videoService from "../../service/video"; // Importa o serviço de vídeo para buscar dados

// Componente principal para a página de vídeo
export default function VideoPage({ videoId: initialVideoId }) {
    const [isVisible, setIsVisible] = useState(true); // Estado para controlar a visibilidade do vídeo
    const [loading, setLoading] = useState(true); // Estado para controlar o carregamento do vídeo
    const [error, setError] = useState(null); // Estado para armazenar erros
    const [videoId, setVideoId] = useState(initialVideoId || ""); // Estado para armazenar o ID do vídeo, podendo ser passado como prop

    // Função para extrair o ID do vídeo da URL
    const extractVideoId = useCallback((url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não é um vídeo do YouTube.");
        return match[1];
    }, []);

    // Função para lidar com cliques na tela
    const handleScreenClick = () => {
        setIsVisible(false); // Oculta o vídeo ao clicar na tela
    };

    // Função assíncrona para buscar o vídeo
    const fetchVideo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [video] = await videoService.getVideo(); // Supondo que 'videoService' tenha o método correto para obter o vídeo
            if (!video?.url) throw new Error("URL do vídeo inválida.");

            const id = extractVideoId(video.url);
            setVideoId(id); // Atualiza o ID do vídeo
        } catch (err) {
            console.error("Erro ao carregar o vídeo: ", err);
            setError(err.message || "Erro ao carregar o vídeo.");
        } finally {
            setLoading(false);
        }
    }, [extractVideoId]);

    useEffect(() => {
        // Executa a função apenas se o ID do vídeo não estiver definido
        if (!videoId) {
            fetchVideo();
        }
    }, [videoId, fetchVideo]);

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
            {loading && <div className={styles.loading}>Carregando...</div>} {/* Exibe mensagem de carregamento */}
            {error && <div className={styles.error}>{error}</div>} {/* Exibe erro se houver */}

            {isVisible && !loading && !error && ( // Renderiza o vídeo apenas se não houver erro ou carregamento
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
