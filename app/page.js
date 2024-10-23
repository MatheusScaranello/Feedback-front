"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import apiUsuarios from "./service/usuario";
import Feedback from "./components/feedback/Feedback";
import Header from "./components/header/Header";
import Footer from "./components/footer/footerPage";

export default function Home() {
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        async function fetchUsuarios() {
            try {
                const data = await apiUsuarios.getUsuarios();
                setUsuarios(data);
            } catch (error) {
                console.error(error);
            }
        }
        fetchUsuarios();
    }, []);



    return (
        <>
            {/* <h1>Lista de Usuários</h1>
            <ul>
                {usuarios.map((usuario) => (
                    <li key={usuario.id} className={styles.item}>
                        <span>ID: {usuario.id} - Nota: {usuario.nota} - Local: {usuario.local} - Data: {usuario.data}</span>
                    </li>
                ))}
            </ul> */}
            <Header />
       
           <Feedback />     
            <Footer />
 
        </>
    );
}