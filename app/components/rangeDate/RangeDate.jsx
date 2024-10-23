"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Slider from 'react-slider';
import format from 'date-fns/format';
import apiUsuarios from '../../service/usuario';
import GraficoPizza from '../graficoPizza/GraficoPizza';
import styles from './rangeDate.module.css';
import { div } from '@tensorflow/tfjs';

export default function RangeDate() {
    const [usuarios, setUsuarios] = useState([]);
    const [range, setRange] = useState([0, 0]);
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

    // Fetch de usuários ao montar o componente
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const data = await apiUsuarios.getUsuarios();
                setUsuarios(data);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
            }
        };
        fetchUsuarios();
    }, []);

    // Cálculo da menor data e total de dias desde a menor até hoje
    const { menorData, diasTotal } = useMemo(() => {
        if (usuarios.length === 0) return { menorData: null, diasTotal: 0 };

        const dates = usuarios.map(usuario => new Date(usuario.data));
        const menorData = new Date(Math.min(...dates));
        const hoje = new Date();
        const diasTotal = Math.ceil((hoje - menorData) / (1000 * 60 * 60 * 24)); // Diferença em dias
        return { menorData, diasTotal };
    }, [usuarios]);

    // Inicializa o range de datas após carregar a menor data
    useEffect(() => {
        if (menorData) {
            setRange([0, diasTotal]);
            setPeriodo({
                inicio: format(menorData, 'yyyy-MM-dd'),
                fim: format(new Date(), 'yyyy-MM-dd'),
            });
        }
    }, [menorData, diasTotal]);

    // Ajusta a data a partir de um valor no slider
    const ajustarDataSlider = (valor) => {
        const novaData = new Date(menorData);
        novaData.setDate(novaData.getDate() + Number(valor));
        return format(novaData, 'yyyy-MM-dd');
    };

    // Filtra usuários dentro do intervalo de tempo selecionado
    const filtrarUsuariosPorPeriodo = (inicio, fim) => {
        const usuariosFiltrados = usuarios.filter(usuario => {
            const dataUsuario = new Date(usuario.data);
            return dataUsuario >= new Date(inicio) && dataUsuario <= new Date(fim);
        });
        return usuariosFiltrados;
    };

    // Atualiza o intervalo de datas quando o slider é ajustado
    const handleRangeChange = (values) => {
        const novoPeriodo = {
            inicio: ajustarDataSlider(values[0]),
            fim: ajustarDataSlider(values[1])
        };
        setRange(values);
        setPeriodo(novoPeriodo);

        // Filtrar e definir usuários dentro do intervalo
        const usuariosNoIntervalo = filtrarUsuariosPorPeriodo(novoPeriodo.inicio, novoPeriodo.fim);
        setUsuariosFiltrados(usuariosNoIntervalo);
    };

    // Atualiza a data manualmente pelo input
    const handleInputChange = (e, tipo) => {
        const novaData = new Date(e.target.value);
        if (isNaN(novaData) || novaData < menorData) return; // Verifica se a data é válida e não anterior à menor data

        const diasDesdeMenor = Math.ceil((novaData - menorData) / (1000 * 60 * 60 * 24));
        setRange((prevRange) => {
            const novoRange = tipo === 'inicio' ? [diasDesdeMenor, prevRange[1]] : [prevRange[0], diasDesdeMenor];
            handleRangeChange(novoRange);
            return novoRange;
        });
    };

    return (
        <div>
        <img className={styles.img} src="https://i.imgur.com/gNZu3jD.png" alt="fedback" />
        <div className={styles.container}>
            <h1 className={styles.seletec}>Selecione o período</h1>
            <div className={styles.rangeContainer}>
                <span className={styles.label}>De:</span>
                <input
                    type="date"
                    value={periodo.inicio}
                    onChange={(e) => handleInputChange(e, 'inicio')}
                    className={styles.dateInput}
                />
                <span className={styles.label}>Até:</span>
                <input
                    type="date"
                    value={periodo.fim}
                    onChange={(e) => handleInputChange(e, 'fim')}
                    className={styles.dateInput}
                />
            </div>
            <Slider
                className={styles.slider}
                thumbClassName={styles.thumb}
                trackClassName={styles.track}
                min={0}
                max={diasTotal}
                value={range}
                onChange={handleRangeChange}
                withTracks
            />

            {/* Componente para exibir os usuários filtrados */}
            <GraficoPizza usuarios={usuariosFiltrados} />
        </div> 
        </div>
    );
}
