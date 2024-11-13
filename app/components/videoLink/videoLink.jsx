"use client"; // Indica que este componente deve ser renderizado no lado do cliente
import { useState, useEffect } from "react";
import apiVideo from "../../service/video"; // Importa o serviço de vídeo

const VideoLink = () => {
    const [url, setUrl] = useState(""); // Estado para armazenar o link do vídeo
    const [error, setError] = useState(null); // Estado para armazenar erros
    const [loading, setLoading] = useState(true); // Estado para indicar carregamento

    useEffect(() => {
        // Função assíncrona para buscar o link do vídeo
        const fetchVideo = async () => {
            try {
                const [video] = await apiVideo.getVideo(); // Obtém o primeiro vídeo da lista
                setUrl(video.url); // Atualiza o estado com o link do vídeo
                setError(null); // Limpa o erro, caso exista
            } catch (error) {
                console.error("Erro ao buscar vídeo:", error);
                setError("Não foi possível carregar o vídeo.");
            } finally {
                setLoading(false); // Finaliza o carregamento
            }
        };

        fetchVideo(); // Chama a função para buscar o link do vídeo
    }, []);

    return (
        <div style={styles.container}>
            <h1>Link do vídeo:</h1>
            {loading && <p>Carregando...</p>}
            {error && <p style={styles.error}>{error}</p>}
            {!loading && !error && <p>{url}</p>}
        </div>
    );
};

// Estilos para o componente
const styles = {
    container: {
        textAlign: 'center',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    error: {
        color: 'red',
        fontSize: '14px',
    },
};

export default VideoLink; // Exporta o componente VideoLink para uso em outros arquivos
