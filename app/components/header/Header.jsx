"use client"; // Indica que este componente deve ser renderizado no lado do cliente

import React from "react"; // Importa a biblioteca React
import styles from "./header.module.css"; // Importa estilos CSS específicos para este componente

// Componente Header
export default function Header({ nome }) {
  return (
    <header className={styles.header}> {/* Elemento <header> com classe estilizada */}
      <div className={styles.leftSide}> {/* Lado esquerdo do cabeçalho */}
        <img className={styles.img} src="https://i.imgur.com/MFSxuJ3.png" alt="Senai" /> {/* Imagem do logo */}
      </div>
      <div className={styles.divider}></div> {/* Divisória entre a imagem e o texto */}
      <div className={styles.rightSide}> {/* Lado direito do cabeçalho */}
        <h1 className={styles.h1}>{nome}</h1> {/* Título que exibe o nome passado como prop */}
      </div>
    </header>
  );
}