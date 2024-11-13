"use client"; // Indica que este componente deve ser renderizado no lado do cliente
import { useState, useEffect } from "react";
import apiVideo from "../../service/video"; // Importa o serviço de vídeo

const VideoLink = () => {
    const [url, setUrl] = useState(""); // URL do vídeo
    const [error, setError] = useState(null); // Erro
    const [loading, setLoading] = useState(true); // Carregamento
    const [editMode, setEditMode] = useState(false); // Modo de edição
    const [newUrl, setNewUrl] = useState(""); // Nova URL no modo de edição
    const [videoId, setVideoId] = useState(""); // ID do vídeo
    const [isSaving, setIsSaving] = useState(false); // Estado de salvamento
    const [showConfirmSave, setShowConfirmSave] = useState(false); // Confirmação de salvamento

    // Função assíncrona para buscar o vídeo
    const fetchVideo = async () => {
        setLoading(true);
        setError(null);
        try {
            const [video] = await apiVideo.getVideo();
            if (!video || !video.url) throw new Error("URL do vídeo inválida.");

            const id = extractVideoId(video.url);
            setUrl(video.url);
            setNewUrl(video.url);
            setVideoId(id);
        } catch (err) {
            console.error("Erro ao carregar o vídeo: ", err);
            setError(err.message || "Erro ao carregar o vídeo.");
        } finally {
            setLoading(false);
        }
    };

    // Extraí o ID do vídeo da URL
    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        const match = url.match(regex);
        if (!match) throw new Error("URL inválida. Não é um vídeo do YouTube.");
        return match[1];
    };

    // Efeito para buscar o vídeo na inicialização
    useEffect(() => {
        fetchVideo();
    }, []);

    // Função para iniciar a edição do link
    const handleEditClick = () => {
        setEditMode(true);
        setShowConfirmSave(false);
    };

    // Função para cancelar a edição
    const handleCancelEdit = () => {
        setEditMode(false);
        setNewUrl(url);
    };

    // Função para salvar as alterações do link
    const handleSaveEdit = async () => {
        if (!isValidUrl(newUrl)) {
            setError("A URL fornecida não é válida.");
            return;
        }

        try {
            const id = extractVideoId(newUrl);
            setVideoId(id);
            setUrl(newUrl);
            setEditMode(false);
            await saveVideoChanges();
        } catch (err) {
            console.error("Erro ao salvar as alterações: ", err);
            setError(err.message || "Erro ao salvar as alterações.");
        }
    };

    // Função que valida a URL fornecida
    const isValidUrl = (url) => {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?=[^\w-]|$)/;
        return youtubeRegex.test(url);
    };

    // Função que salva as alterações no servidor
    const saveVideoChanges = async (e) => {
        setIsSaving(true);
        setError(null);
        try {
            await apiVideo.editVideo({ url: newUrl, idVideo: videoId });
            setShowConfirmSave(true);
        } catch (err) {
            console.error("Erro ao salvar o vídeo: ", err);
            setError(err.message || "Erro ao salvar o vídeo.");
        } finally {
            setIsSaving(false);
        }

        return false;
    };

    // Função para recarregar o vídeo em caso de erro
    const handleRetry = () => {
        setLoading(true);
        setError(null);
        fetchVideo();
    };

    return (
        <div style={styles.container}>
            <h1>Editar Vídeo</h1>

            {/* Feedback de carregamento */}
            {loading && <p>Carregando...</p>}

            {/* Exibição de erro com mensagens específicas */}
            {error && (
                <ErrorComponent message={error} onRetry={handleRetry} />
            )}

            {/* Exibição de sucesso após salvar */}
            {showConfirmSave && !loading && !error && (
                <SuccessComponent />
            )}

            {/* Exibição do vídeo ou do formulário de edição */}
            {!loading && !error && !isSaving && (
                <div>
                    {!editMode ? (
                        <div>
                            <h2>Vídeo Atual</h2>
                            <VideoIframe videoId={videoId} />
                            <button onClick={handleEditClick} style={styles.button}>
                                Editar Link
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2>Editar Link do Vídeo</h2>
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                style={styles.input}
                                placeholder="Insira o novo link do vídeo"
                            />
                            <div>
                                <button onClick={handleSaveEdit} style={styles.button}>
                                    Salvar
                                </button>
                                <button onClick={handleCancelEdit} style={styles.button}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Exibição de botão de carregamento durante o processo de salvamento */}
            {isSaving && <p>Salvando...</p>}
        </div>
    );
};

const VideoIframe = ({ videoId }) => {
    return (
        <iframe
            style={styles.video}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&loop=1&playlist=${videoId}&controls=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        ></iframe>
    );
};

const ErrorComponent = ({ message, onRetry }) => {
    return (
        <div style={styles.errorContainer}>
            <p style={styles.error}>{message}</p>
            <button onClick={onRetry} style={styles.button}>
                Tentar Novamente
            </button>
        </div>
    );
};

const SuccessComponent = () => {
    return (
        <div style={styles.successMessage}>
            <p>Alterações salvas com sucesso!</p>
        </div>
    );
};

const styles = {
    container: {
        textAlign: "center",
        padding: "20px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
    },
    errorContainer: {
        backgroundColor: "#f8d7da",
        border: "1px solid #f5c6cb",
        padding: "10px",
        borderRadius: "5px",
        margin: "10px 0",
    },
    successMessage: {
        backgroundColor: "#d4edda",
        border: "1px solid #c3e6cb",
        padding: "10px",
        borderRadius: "5px",
        margin: "10px 0",
    },
    error: {
        color: "#721c24",
        fontSize: "14px",
        marginBottom: "10px",
    },
    input: {
        width: "80%",
        padding: "10px",
        fontSize: "16px",
        margin: "10px 0",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    button: {
        padding: "8px 12px",
        margin: "5px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        backgroundColor: "#007bff",
        color: "white",
        cursor: "pointer",
    },
    video: {
        width: "100%",
        height: "315px",
        maxWidth: "560px",
        margin: "20px auto",
    },
};

export default VideoLink;
