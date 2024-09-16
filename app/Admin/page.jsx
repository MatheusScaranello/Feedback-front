"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import apiUsuarios from "./service/usuario";
import GraficoPizza from "./components/graficoPizza/GraficoPizza";
import GraficoTempo from "./components/graficoTempo/GraficoTempo";
import ComentariosPage from "../components/comentarios/ComentariosPage";