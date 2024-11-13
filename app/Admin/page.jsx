"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import Header from "../components/header/Header";
import Footer from "../components/footer/footerPage";
import Grafico from "../components/graficoPizza/GraficoPizza";
import Comentarios from "../components/comentarios/comentariosPage";
import VideoLink from "../components/videoLink/videoLink";

export default function Admin() {
    const [flag, setFlag] = useState(false);
    const [nome, setNome] = useState("Página admistradora");

    const handleGrafico = () => {
        setFlag(!flag);
    }

    return (
        <div className={flag ? '' : styles.fullPageBackground}>
            <Header nome={nome} />
    
            <div className={styles.container}>
                 <VideoLink />
                <button onClick={handleGrafico} className={styles.btnFlag}>
                    {flag ? 'Comentários' : 'Gráfico'}
                </button>
                <div className={styles.footer}>
                <Footer />
                </div>
            </div>
        </div>
    );  
    
}
