"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import RangeDate from "../components/rangeDate/RangeDate";
import ComentariosPage from "../components/comentarios/ComentariosPage";
import Header from "../components/header/Header";
import Footer from "../components/footer/footerPage";
import { div } from "@tensorflow/tfjs";

export default function Admin() {
    const [flag, setFlag] = useState(false);

    const handleGrafico = () => {
        setFlag(!flag);
    }

    return (
        <div>
   <Header />

        <div className={styles.container}>
         
            <div className={styles.content}>
                {flag ? <RangeDate /> : <ComentariosPage />}
            </div>
                <button onClick={handleGrafico}>{flag ? 'Comentários' : 'Gráfico'}</button>
            <Footer />
        </div>
        </div>
    );
        
    
}
