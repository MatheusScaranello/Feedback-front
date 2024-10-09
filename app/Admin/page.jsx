"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import GraficoPizza from "../components/graficoPizza/GraficoPizza";
import ComentariosPage from "../components/comentarios/ComentariosPage";
import Header from "../components/header/Header";
import Footer from "../components/footer/footerPage";

export default function Admin() {
    const [flag, setFlag] = useState(false);

    const handleGrafico = () => {
        setFlag(!flag);
    }

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.content}>
                {flag ? <GraficoPizza /> : <ComentariosPage />}
            </div>
                <button onClick={handleGrafico}>{flag ? 'Comentários' : 'Gráfico'}</button>
            <Footer />
        </div>
    );
        
    
}
