"use client"; // Indica que este componente deve ser renderizado no lado do cliente
import axios from "axios"; // Importa a biblioteca Axios para fazer requisições HTTP

// Define a URL base da API
const API_URL = "https://feedback-back-eight.vercel.app/";

// Cria uma instância do Axios com a URL base definida
const api = axios.create({
  baseURL: API_URL,
});

// Objeto apiUsuarios contém métodos para interagir com a API de usuários
const apiUsuarios = {
    // Método para obter todos os usuários
    getUsuarios: async () => {
    try {
      const response = await api.get("/usuario"); // Faz uma requisição GET para buscar usuários
      console.log(response.data); // Loga os dados recebidos no console
      return response.data; // Retorna os dados recebidos
    } catch (error) {
      // Lança um erro caso a requisição falhe
      throw new Error("Erro ao buscar usuarios: " + error.message);
    }
  },

  // Método para obter um usuário específico por local
  getUsuarioByLocal: async (local) => {
    try {
      const response = await api.get(`/usuario/${local}`); // Faz uma requisição GET para buscar um usuário por local
      return response.data; // Retorna os dados recebidos
    } catch (error) {
      // Lança um erro caso a requisição falhe
      throw new Error("Erro ao buscar usuario: " + error.message);
    }
  },

  // Método para criar um novo usuário
  createUsuario: async (usuario) => {
    try {
      const response = await api.post("/usuario", usuario); // Faz uma requisição POST para criar um novo usuário
      return response.data; // Retorna os dados do usuário criado
    } catch (error) {
      // Lança um erro caso a requisição falhe
      throw new Error("Erro ao criar usuario: " + error.message);
    }
  },

  // Método para atualizar um usuário existente
  updateUsuario: async (usuario) => {
    try {
      const response = await api.put(`/usuario/${usuario.id}`, usuario); // Faz uma requisição PUT para atualizar um usuário
      return response.data; // Retorna os dados do usuário atualizado
    } catch (error) {
      // Lança um erro caso a requisição falhe
      throw new Error("Erro ao atualizar usuario: " + error.message);
    }
  },

  // Método para deletar um usuário por ID
  deleteUsuario: async (id) => {
    try {
      const response = await api.delete(`/usuario/${id}`); // Faz uma requisição DELETE para remover um usuário
      return response.data; // Retorna os dados da resposta da remoção
    } catch (error) {
      // Lança um erro caso a requisição falhe
      throw new Error("Erro ao deletar usuario: " + error.message);
    }
  },
};

// Exporta o objeto apiUsuarios para ser utilizado em outras partes da aplicação
export default apiUsuarios;
