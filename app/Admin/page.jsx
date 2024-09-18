"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import apiUsuarios from "../service/usuario";
import GraficoPizza from "../components/graficoPizza/GraficoPizza";
import GraficoTempo from "../components/graficoTempo/GraficoTempo";
import ComentariosPage from "../components/comentarios/ComentariosPage";


export default function Admin() {
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
        <div className={styles.container}>
            <h1 className={styles.titulo}>Análise de Desempenho</h1>
            <div className={styles.graficoContainer}>
                <div className={styles.grafico}>
                    <GraficoPizza />
                </div>
                <div className={styles.grafico}>
                    <GraficoTempo />
                </div>
            </div>
            <div className={styles.comentarios}>
                <ComentariosPage />
            </div>
        </div>
    );
        
    
}