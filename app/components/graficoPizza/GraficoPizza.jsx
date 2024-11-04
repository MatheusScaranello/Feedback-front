import React, { useState, useMemo } from "react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import GaugeChart from 'react-gauge-chart';
import styles from "./graficoPizza.module.css";
import { format } from 'date-fns';
import { he } from "date-fns/locale";

// Registrar os elementos do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ usuarios, initialLocal }) => {
    const [selectedLocal, setSelectedLocal] = useState(initialLocal || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState(null);

    // Obter locais únicos e ordená-los
    const uniqueLocals = useMemo(() => {
        const locals = [...new Set(usuarios.map(({ local }) => local))];
        return locals.sort((a, b) => a.localeCompare(b)); // Ordenação alfabética
    }, [usuarios]);

    // Filtrar os locais com base no termo de busca
    const filteredLocals = useMemo(() => {
        return uniqueLocals.filter(local => 
            local.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, uniqueLocals]);

    const calcularEstatisticas = useMemo(() => {
        const insatisfeitos = usuarios.filter(({ nota }) => nota <= 6).length;
        const satisfeitos = usuarios.filter(({ nota }) => nota >= 7 && nota <= 8).length;
        const muitoSatisfeitos = usuarios.filter(({ nota }) => nota >= 9 && nota <= 10).length;
        const totalRespondentes = usuarios.length;
        const nps = ((muitoSatisfeitos / totalRespondentes) - (insatisfeitos / totalRespondentes)) * 100;

        return { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps };
    }, [usuarios]);

    const { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps } = calcularEstatisticas;

    const data = {
        labels: ['Detratores', 'Neutros', 'Promotores'],
        datasets: [{
            label: 'Pontuação',
            data: [insatisfeitos, satisfeitos, muitoSatisfeitos],
            backgroundColor: ['#FF0000', '#FFFF00', '#00FF00'],
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: ({ label, raw }) => `${label || ''}: ${raw || 0} usuários`
                }
            }
        },
        onClick: (_, elements) => {
            if (elements.length > 0) setSelectedSegment(elements[0].index);
        }
    };

    const segmentDetails = selectedSegment !== null && (
        <div className={styles.details}>
            <h3>Detalhes do Segmento</h3>
            <p >Segmento: {data.labels[selectedSegment]}</p>
            <p>Total: {data.datasets[0].data[selectedSegment]} usuários</p>
        </div>
    );

    const handleExportCSV = () => {
        const csvHeader = "Local,Nota,Observacao,Data\n";
        const csvRows = usuarios.map(({ local, nota, observacao, data }) =>
            `${local},${nota},"${observacao || ''}",${format(new Date(data), 'dd/MM/yyyy')}`
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

            {/* Campo de busca para filtrar os locais */}
            <input
            
                type="text"
                placeholder="Buscar local..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
                className={styles.localSelector}
                value={selectedLocal}
                onChange={(e) => setSelectedLocal(e.target.value)}
            >
                <option value="">Todos os Locais</option>
                {filteredLocals.length > 0 ? (
                    filteredLocals.map(local => (
                        <option key={local} value={local}>{local}</option>
                    ))
                ) : (
                    <option disabled>Nenhum local encontrado</option>
                )}
            </select>

            <div className={styles.gaugeContainer}>
                <h3>NPS</h3>
                <GaugeChart
                    id="nps-gauge"
                    nrOfLevels={50}
                    arcsLength={[0.3, 0.4, 0.3]}
                    colors={['#ff6f61', '#ffc107', '#28a745']}
                    percent={(nps + 100) / 200}
                    arcPadding={0.03}
                    needleColor="#5a6268"
                    needleBaseColor="#5a6268"
                    textColor="#212529"
                    formatTextValue={(value) => `${value}%`}
                    style={{ width: '85%', maxWidth: '400px', margin: '0 auto' }}
                />
            </div>

            <div className={styles.metrics}>
                <div className={styles.metric}>
                    <h3>% Promotores</h3>
                    <p>{totalRespondentes > 0 ? ((muitoSatisfeitos / totalRespondentes) * 100).toFixed(1) : 0}%</p>
                    <h3>Promotores</h3>
                    <p>{muitoSatisfeitos}</p>
                </div>
                <div className={styles.metric}>
                    <h3>% Neutros</h3>
                    <p>{totalRespondentes > 0 ? ((satisfeitos / totalRespondentes) * 100).toFixed(1) : 0}%</p>
                    <h3>Neutros</h3>
                    <p>{satisfeitos}</p>
                </div>
                <div className={styles.metric}>
                    <h3>% Detratores</h3>
                    <p>{totalRespondentes > 0 ? ((insatisfeitos / totalRespondentes) * 100).toFixed(1) : 0}%</p>
                    <h3>Detratores</h3>
                    <p>{insatisfeitos}</p>
                </div>
                <div className={styles.metric}>
                    <h3>Total Pesquisados</h3>
                    <p>{totalRespondentes}</p>
                </div>
            </div>

            <Pie data={data} options={options} style={{ width: '50%', maxWidth: '400px', margin: '0 auto' }}/>
            {segmentDetails}
            <button className={styles.exportButton} onClick={handleExportCSV}>
                Exportar Dados para CSV
            </button>
        </div>
    );
};

export default PieChart;
