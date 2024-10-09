"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Slider from 'react-slider';
import format from 'date-fns/format';
import apiUsuarios from '../../service/usuario';
import styles from './rangeDate.module.css';

export default function RangeDate() {
    const [usuarios, setUsuarios] = useState([]);
    const [range, setRange] = useState([0, 0]);
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const data = await apiUsuarios.getUsuarios();
                setUsuarios(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsuarios();
    }, []);

    const { menorData, diasTotal } = useMemo(() => {
        if (usuarios.length === 0) return { menorData: null, diasTotal: 0 };

        const dates = usuarios.map(usuario => new Date(usuario.data));
        const menorData = new Date(Math.min(...dates));
        const hoje = new Date();
        const diasTotal = Math.ceil((hoje - menorData) / (1000 * 60 * 60 * 24));
        return { menorData, diasTotal };
    }, [usuarios]);

    useEffect(() => {
        if (menorData) {
            setRange([0, diasTotal]);
            setPeriodo({ 
                inicio: format(menorData, 'yyyy-MM-dd'),
                fim: format(new Date(), 'yyyy-MM-dd')
            });
        }
    }, [menorData, diasTotal]);

    const ajustarDataSlider = (valor) => {
        const novaData = new Date(menorData);
        novaData.setDate(novaData.getDate() + Number(valor));
        return format(novaData, 'yyyy-MM-dd');
    };

    const handleRangeChange = (values) => {
        setRange(values);
        setPeriodo({
            inicio: ajustarDataSlider(values[0]),
            fim: ajustarDataSlider(values[1])
        });
    };

    const handleInputChange = (e, tipo) => {
        const novaData = new Date(e.target.value);
        if (isNaN(novaData)) return;

        const diasDesdeMenor = Math.ceil((novaData - menorData) / (1000 * 60 * 60 * 24));
        setRange((prevRange) => {
            const novoRange = tipo === 'inicio' ? [diasDesdeMenor, prevRange[1]] : [prevRange[0], diasDesdeMenor];
            handleRangeChange(novoRange);
            return novoRange;
        });
    };

    return (
        <div className={styles.container}>
            <h1>Selecione o período</h1>
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
        </div>
    );
}
