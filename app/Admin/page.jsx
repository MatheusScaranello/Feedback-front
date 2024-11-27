"use client";
import { useState } from "react";
import styles from "./admin.module.css";
import Header from "../components/header/Header";
import Footer from "../components/footer/footerPage";
import Grafico from "../components/rangeDate/RangeDate.jsx";
import Comentarios from "../components/comentarios/comentariosPage";
import VideoLink from "../components/videoLink/videoLink";

export default function Admin() {
    const [nome, setNome] = useState("Página administradora");
    const [showVideo, setShowVideo] = useState(true);
    const [showGrafico, setShowGrafico] = useState(false);
    const [showComentarios, setShowComentarios] = useState(false);

    const handleShowVideo = () => {
        setShowVideo(true);
        setShowGrafico(false);
        setShowComentarios(false);
    };

    const handleShowGrafico = () => {
        setShowVideo(false);
        setShowGrafico(true);
        setShowComentarios(false);
    };

    const handleShowComentarios = () => {
        setShowVideo(false);
        setShowGrafico(false);
        setShowComentarios(true);
    };

    return (
        <div className={styles.fullPageBackground}>
            <Header nome={nome} />

            <div className={styles.container}>
                

                <div className={styles.content}>
                    {showVideo && <VideoLink />}
                    {showGrafico && <Grafico />}
                    {showComentarios && <Comentarios />}
                </div>
                <div className={styles.buttons}>
                    <button onClick={handleShowVideo} className={styles.btnFlag}>
                    Vídeo
                </button>
                <button onClick={handleShowGrafico} className={styles.btnFlag}>
                    Gráfico
                </button>
                <button onClick={handleShowComentarios} className={styles.btnFlag}>
                    Comentários
                </button>
                </div>
                

                <div className={styles.footer}>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
