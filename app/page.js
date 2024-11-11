"use client"; // Indica que este componente deve ser renderizado no lado do cliente

import { useState, useEffect } from "react"; // Importa os hooks useState e useEffect do React
import styles from "./page.module.css"; // Importa o arquivo de estilos CSS para este componente
import apiUsuarios from "./service/usuario"; // Importa a API de usuários para fazer requisições
import Feedback from "./components/feedback/Feedback"; // Importa o componente de feedback
import Header from "./components/header/Header"; // Importa o cabeçalho do aplicativo
import Footer from "./components/footer/footerPage"; // Importa o rodapé do aplicativo
import VideoPage from "./components/video/VideoPage"; // Importa o componente para exibir vídeos

export default function Home() {
    // Declara um estado para armazenar a lista de usuários e um estado para o título
    const [usuarios, setUsuarios] = useState([]); // Estado inicial para usuários como um array vazio
    const [nome, setNome] = useState("Pesquisa de Satisfação"); // Estado inicial para o nome

    // useEffect é utilizado para buscar dados da API quando o componente é montado
    useEffect(() => {
        async function fetchUsuarios() { // Função assíncrona para buscar usuários
            try {
                const data = await apiUsuarios.getUsuarios(); // Chama a função para obter usuários
                setUsuarios(data); // Atualiza o estado com os dados recebidos
            } catch (error) {
                console.error(error); // Loga qualquer erro que ocorra durante a busca
            }
        }
        fetchUsuarios(); // Chama a função para buscar usuários
    }, []); // O array vazio indica que o efeito é executado apenas uma vez após a montagem

    return (
        <>
            {/* Comentado: Exibe uma lista de usuários, caso necessário
            <h1>Lista de Usuários</h1>
            <ul>
                {usuarios.map((usuario) => (
                    <li key={usuario.id} className={styles.item}>
                        <span>ID: {usuario.id} - Nota: {usuario.nota} - Local: {usuario.local} - Data: {usuario.data}</span>
                    </li>
                ))}
            </ul>
            */}

            {/* Renderiza um componente de vídeo passado um ID específico */}
            <div className={styles.video}>
                <VideoPage videoId="bLvrvixKfuM" />
            </div>
            <Header nome={nome} /> {/* Renderiza o cabeçalho com o título */}
            <Feedback /> {/* Renderiza o componente de feedback */}
            <Footer /> {/* Renderiza o rodapé */}
        </>
    );
}