"use client";
import { useState, useEffect } from "react";
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiUsuarios from '@/app/service/usuario';
import styles from "./graficoPizza.module.css";

// Registrar os elementos do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ initialLocal }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedLocal, setSelectedLocal] = useState(initialLocal || '');
    const [selectedSegment, setSelectedSegment] = useState(null);

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

    const uniqueLocals = [...new Set(usuarios.map(usuario => usuario.local))];

    const usuariosFiltrados = selectedLocal ? usuarios.filter((usuario) => usuario.local === selectedLocal) : usuarios;

    const insatisfeitos = usuariosFiltrados.filter((usuario) => usuario.nota <= 6).length;
    const satisfeitos = usuariosFiltrados.filter((usuario) => usuario.nota >= 7 && usuario.nota <= 8).length;
    const muitoSatisfeitos = usuariosFiltrados.filter((usuario) => usuario.nota >= 9 && usuario.nota <= 10).length;

    const data = {
        labels: ['Insatisfeitos', 'Satisfeitos', 'Muito satisfeitos'],
        datasets: [
            {
                label: 'Pontuação',
                data: [insatisfeitos, satisfeitos, muitoSatisfeitos],
                backgroundColor: ['#BFBFBF', '#3366CC', '#FF9933'],
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} usuários`;
                    }
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                setSelectedSegment(index);
            }
        }
    };

    const segmentDetails = selectedSegment !== null ? (
        <div className={styles.details}>
            <h3>Detalhes do Segmento</h3>
            <p>Segmento: {data.labels[selectedSegment]}</p>
            <p>Total: {data.datasets[0].data[selectedSegment]} usuários</p>
        </div>
    ) : null;

    const handleExportCSV = () => {
        const csvHeader = "Local,Nota,Observacao,Data\n";
        const csvRows = usuariosFiltrados.map(usuario => 
            `${usuario.local},${usuario.nota},"${usuario.observacao || ''}",${usuario.data}`
        ).join("\n");
        
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `usuarios_${selectedLocal || 'todos'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.chartContainer}>
            <h2 className={styles.title}>Pontuação por {selectedLocal || "Todos os Locais"}</h2>
            <select
                className={styles.localSelector}
                value={selectedLocal}
                onChange={(e) => setSelectedLocal(e.target.value)}
            >
                <option value="">Todos os Locais</option>
                {uniqueLocals.map(local => <option key={local} value={local}>{local}</option>)}
            </select>
            <Pie data={data} options={options} />
            {segmentDetails}
            <button className={styles.exportButton} onClick={handleExportCSV}>Exportar Dados para CSV</button>
        </div>
    );
};

export default PieChart;