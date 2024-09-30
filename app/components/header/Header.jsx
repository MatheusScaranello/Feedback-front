"use client";
import React from "react";
import styles from "./header.module.css";

const Header = (props) => {
    return (
        <header className={styles.header}>
            <div className={styles.leftSide}>
                <img
                    className={styles.img}
                    src="https://i.imgur.com/MFSxuJ3.png"
                    alt="Senai"
                />
            </div>
            <div className={styles.divider}></div> {/* Divisória */}
            <div className={styles.rightSide}>
                <h1 className={styles.h1}>{props.title}</h1>
              
            </div>
        </header>
    );
};

export default Header;

