import axios from "axios";

const API_URL = "https://feedback-back-alpha.vercel.app/";

const api = axios.create({
  baseURL: API_URL,
});

const apiUsuarios = {
    getUsuarios: async () => {
    try {
      const response = await api.get("/usuario");
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao buscar usuarios: " + error.message);
    }
  },
  getUsuarioByLocal: async (local) => {
    try {
      const response = await api.get(`/usuario/${local}`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao buscar usuario: " + error.message);
    }
  },
  createUsuario: async (usuario) => {
    try {
      const response = await api.post("/usuario", usuario);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao criar usuario: " + error.message);
    }
  },
  updateUsuario: async (usuario) => {
    try {
      const response = await api.put(`/usuario/${usuario.id}`, usuario);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao atualizar usuario: " + error.message);
    }
  },
  deleteUsuario: async (id) => {
    try {
      const response = await api.delete(`/usuario/${id}`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao deletar usuario: " + error.message);
    }
  },
};
export default apiUsuarios;