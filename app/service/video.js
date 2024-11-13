"use client"; // Indica que este módulo deve ser executado no lado do cliente
import axios from "axios"; // Importa a biblioteca Axios para fazer requisições HTTP

// Define a URL base da API
const API_URL = "http://localhost:4000/";

// Cria uma instância do Axios com a URL base definida
const api = axios.create({
  baseURL: API_URL,
});

// Objeto apiVideo contém métodos para interagir com a API de vídeo
const apiVideo = {
    // Método para obter todos os vídeos
    getVideo: async () => {
        try {
            const response = await api.get("/video"); // Faz uma requisição GET para buscar o vídeo
            return response.data; // Retorna os dados dos vídeos
        } catch (error) {
            console.error("Erro ao buscar vídeo:", error);
            throw new Error("Erro ao buscar vídeo: " + error.message);
        }
    },

    // Método para editar informações de um vídeo
    editVideo: async (video) => {
        try {
            const response = await api.put("/video", video); // Faz uma requisição PUT para atualizar um vídeo
            return response.data; // Retorna os dados do vídeo atualizado
        } catch (error) {
            console.error("Erro ao atualizar vídeo:", error);
            throw new Error("Erro ao atualizar vídeo: " + error.message);
        }
    },
};

export default apiVideo; // Exporta o objeto apiVideo para uso em outros arquivos
