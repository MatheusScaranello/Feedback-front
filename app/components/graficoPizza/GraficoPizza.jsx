import React, { useState, useEffect, useMemo } from "react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import GaugeChart from 'react-gauge-chart';
import apiUsuarios from '@/app/service/usuario';
import styles from "./graficoPizza.module.css";
import Header from "../header/Header";
import Footer from "../footer/footerPage";

// Registrar os elementos do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ initialLocal }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedLocal, setSelectedLocal] = useState(initialLocal || '');
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
    const [rangeInicio, setRangeInicio] = useState(0);
    const [rangeFim, setRangeFim] = useState(100);

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

    const uniqueLocals = useMemo(() => [...new Set(usuarios.map(usuario => usuario.local))], [usuarios]);

    const { menorData, maiorData } = useMemo(() => {
        const datas = usuarios.map(usuario => new Date(usuario.data)).filter(date => !isNaN(date));
        return {
            menorData: new Date(Math.min(...datas)),
            maiorData: new Date(Math.max(...datas))
        };
    }, [usuarios]);

    useEffect(() => {
        if (menorData && maiorData && !isNaN(menorData) && !isNaN(maiorData)) {
            const diasTotal = Math.ceil((maiorData - menorData) / (1000 * 60 * 60 * 24));
            setRangeInicio(0);
            setRangeFim(diasTotal);
            setPeriodo({ inicio: formatDate(menorData), fim: formatDate(maiorData) });
        }
    }, [menorData, maiorData]);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const ajustarDataSlider = (valor, referencia) => {
        const novaData = new Date(menorData);
        novaData.setDate(novaData.getDate() + Number(valor));
        return formatDate(novaData);
    };

    const handleRangeChange = (e, tipo) => {
        const valor = e.target.value;
        const novaData = ajustarDataSlider(valor, tipo);

        if (tipo === 'inicio') {
            setRangeInicio(valor);
            setPeriodo(prev => ({ ...prev, inicio: novaData }));
        } else {
            setRangeFim(valor);
            setPeriodo(prev => ({ ...prev, fim: novaData }));
        }
    };

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(usuario => {
            const dataUsuario = new Date(usuario.data);
            return (!selectedLocal || usuario.local === selectedLocal) &&
                (periodo.inicio === '' || dataUsuario >= new Date(periodo.inicio)) &&
                (periodo.fim === '' || dataUsuario <= new Date(periodo.fim));
        });
    }, [usuarios, selectedLocal, periodo]);

    const calcularEstatisticas = (usuarios) => {
        const insatisfeitos = usuarios.filter(usuario => usuario.nota <= 6).length;
        const satisfeitos = usuarios.filter(usuario => usuario.nota >= 7 && usuario.nota <= 8).length;
        const muitoSatisfeitos = usuarios.filter(usuario => usuario.nota >= 9 && usuario.nota <= 10).length;
        const totalRespondentes = usuarios.length;
        const nps = totalRespondentes > 0 ? (((muitoSatisfeitos - insatisfeitos) / totalRespondentes) * 100).toFixed(2) : 0;

        return { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps };
    };

    const { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps } = useMemo(() => calcularEstatisticas(usuariosFiltrados), [usuariosFiltrados]);

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
                    label: (context) => `${context.label || ''}: ${context.raw || 0} usuários`
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                setSelectedSegment(elements[0].index);
            }
        }
    };

    const segmentDetails = selectedSegment !== null && (
        <div className={styles.details}>
            <h3>Detalhes do Segmento</h3>
            <p>Segmento: {data.labels[selectedSegment]}</p>
            <p>Total: {data.datasets[0].data[selectedSegment]} usuários</p>
        </div>
    );

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
            <Header/>
            
            <h2 className={styles.title}>Pontuação por {selectedLocal || "Todos os Locais"}</h2>
            <select
                className={styles.localSelector}
                value={selectedLocal}
                onChange={(e) => setSelectedLocal(e.target.value)}
            >
                <option value="">Todos os Locais</option>
                {uniqueLocals.map(local => <option key={local} value={local}>{local}</option>)}
            </select>

            <div className={styles.periodo}>
                <label>Período da Pesquisa:</label>
                <div>
                    <input
                        type="date"
                        value={periodo.inicio}
                        onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
                    />
                    <input
                        type="date"
                        value={periodo.fim}
                        onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
                    />
                </div>
                <div className={styles.sliderContainer}>
                    <label>Data de Início</label>
                    <input
                        type="range"
                        min="0"
                        max={rangeFim}
                        value={rangeInicio}
                        onChange={(e) => handleRangeChange(e, 'inicio')}
                    />
                    <label>Data de Fim</label>
                    <input
                        type="range"
                        min="0"
                        max={rangeFim}
                        value={rangeFim}
                        onChange={(e) => handleRangeChange(e, 'fim')}
                    />
                </div>
            </div>

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

            <Pie data={data} options={options} />
            {segmentDetails}
            <button className={styles.exportButton} onClick={handleExportCSV}>Exportar Dados para CSV</button>

            <Footer/>
        </div>
    );
};

export default PieChart;
