"use client";
import React, { useState, useMemo } from "react"; // Importa React e hooks useState e useMemo
import { Pie } from 'react-chartjs-2'; // Importa o componente de gráfico de pizza
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'; // Importa elementos do Chart.js
import GaugeChart from 'react-gauge-chart'; // Importa o gráfico de medidor
import styles from "./graficoPizza.module.css"; // Importa os estilos do módulo CSS
import { format } from 'date-fns'; // Importa a função de formatação de data
import { he } from "date-fns/locale"; // Importa a localidade hebraica para formatação de data

// Registrar os elementos do Chart.js para uso
ChartJS.register(ArcElement, Tooltip, Legend);

// Componente principal do gráfico de pizza
const PieChart = ({ usuarios, initialLocal }) => {
    // Estados para controlar a seleção de local, termo de busca e segmento selecionado
    const [selectedLocal, setSelectedLocal] = useState(initialLocal || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState(null);

    // Obter locais únicos e ordená-los
    const uniqueLocals = useMemo(() => {
        const locals = [...new Set(usuarios.map(({ local }) => local))]; // Cria um conjunto de locais únicos
        return locals.sort((a, b) => a.localeCompare(b)); // Ordena os locais em ordem alfabética
    }, [usuarios]);

    // Filtrar os locais com base no termo de busca
    const filteredLocals = useMemo(() => {
        return uniqueLocals.filter(local => 
            local.toLowerCase().includes(searchTerm.toLowerCase()) // Filtra locais que incluem o termo de busca
        );
    }, [searchTerm, uniqueLocals]);

    // Calcular estatísticas baseadas nas notas dos usuários
    const calcularEstatisticas = useMemo(() => {
        const insatisfeitos = usuarios.filter(({ nota }) => nota <= 6).length; // Contagem de insatisfeitos
        const satisfeitos = usuarios.filter(({ nota }) => nota >= 7 && nota <= 8).length; // Contagem de satisfeitos
        const muitoSatisfeitos = usuarios.filter(({ nota }) => nota >= 9 && nota <= 10).length; // Contagem de muito satisfeitos
        const totalRespondentes = usuarios.length; // Total de respondentes
        const nps = ((muitoSatisfeitos / totalRespondentes) - (insatisfeitos / totalRespondentes)) * 100; // Cálculo do NPS

        return { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps };
    }, [usuarios]);

    // Desestruturação das estatísticas calculadas
    const { insatisfeitos, satisfeitos, muitoSatisfeitos, totalRespondentes, nps } = calcularEstatisticas;

    // Configuração dos dados para o gráfico de pizza
    const data = {
        labels: ['Detratores', 'Neutros', 'Promotores'], // Rótulos para os segmentos do gráfico
        datasets: [{
            label: 'Pontuação',
            data: [insatisfeitos, satisfeitos, muitoSatisfeitos], // Dados a serem exibidos no gráfico
            backgroundColor: ['#FF0000', '#FFFF00', '#00FF00'], // Cores dos segmentos
        }],
    };

    // Opções de configuração para o gráfico
    const options = {
        responsive: true, // Torna o gráfico responsivo
        plugins: {
            legend: { position: 'bottom' }, // Posição da legenda
            tooltip: {
                callbacks: {
                    label: ({ label, raw }) => `${label || ''}: ${raw || 0} usuários` // Formatação do tooltip
                }
            }
        },
        onClick: (_, elements) => { // Tratamento de clique no gráfico
            if (elements.length > 0) setSelectedSegment(elements[0].index); // Atualiza o segmento selecionado
        }
    };

    // Detalhes do segmento selecionado
    const segmentDetails = selectedSegment !== null && (
        <div className={styles.details}>
            <h3>Detalhes do Segmento</h3>
            <p>Segmento: {data.labels[selectedSegment]}</p>
            <p>Total: {data.datasets[0].data[selectedSegment]} usuários</p>
        </div>
    );

    // Função para exportar dados em formato CSV
    const handleExportCSV = () => {
        const csvHeader = "Local,Nota,Observacao,Data\n"; // Cabeçalho do CSV
        const csvRows = usuarios.map(({ local, nota, observacao, data }) =>
            `${local},${nota},"${observacao || ''}",${format(new Date(data), 'dd/MM/yyyy')}`
        ).join("\n"); // Mapeia os usuários para linhas do CSV

        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows; // Cria o conteúdo do CSV
        const encodedUri = encodeURI(csvContent); // Codifica o URI do CSV
        const link = document.createElement("a"); // Cria um link para download
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `usuarios_${selectedLocal || 'todos'}.csv`); // Define o nome do arquivo
        document.body.appendChild(link); // Adiciona o link ao corpo do documento
        link.click(); // Aciona o download
        document.body.removeChild(link); // Remove o link do DOM
    };

    // Renderização do componente
    return (
        <div className={styles.chartContainer}>
            <h2 className={styles.title}>Pontuação por {selectedLocal || "Todos os Locais"}</h2>

            {/* Campo de busca para filtrar os locais */}
            <input
                type="text"
                placeholder="Buscar local..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de busca
            />

            <select
                className={styles.localSelector}
                value={selectedLocal}
                onChange={(e) => setSelectedLocal(e.target.value)} // Atualiza o local selecionado
            >
                <option value="">Todos os Locais</option>
                {filteredLocals.length > 0 ? (
                    filteredLocals.map(local => (
                        <option key={local} value={local}>{local}</option> // Mapeia locais filtrados para opções
                    ))
                ) : (
                    <option disabled>Nenhum local encontrado</option> // Mensagem quando nenhum local é encontrado
                )}
            </select>

            <div className={styles.gaugeContainer}>
                <h3>NPS</h3>
                <GaugeChart
                    id="nps-gauge"
                    nrOfLevels={50} // Número de níveis no gráfico de medidor
                    arcsLength={[0.3, 0.4, 0.3]} // Comprimento dos arcos
                    colors={['#ff6f61', '#ffc107', '#28a745']} // Cores dos arcos
                    percent={(nps + 100) / 200} // Percentual para o gráfico, ajustado para a faixa de NPS
                    arcPadding={0.03} // Espaçamento entre os arcos
                    needleColor="#5a6268" // Cor do ponteiro
                    needleBaseColor="#5a6268" // Cor da base do ponteiro
                    textColor="#212529" // Cor do texto
                    formatTextValue={(value) => `${value}%`} // Formatação do valor do texto
                    style={{ width: '85%', maxWidth: '400px', margin: '0 auto' }} // Estilo do gráfico
                />
            </div>

            {/* Exibição das métricas calculadas */}
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

            {/* Renderiza o gráfico de pizza */}
            <Pie data={data} options={options} style={{ width: '50%', maxWidth: '400px', margin: '0 auto' }}/>
            {segmentDetails} {/* Renderiza os detalhes do segmento selecionado */}
            <button className={styles.exportButton} onClick={handleExportCSV}>
                Exportar Dados para CSV {/* Botão para exportar dados */}
            </button>
        </div>
    );
};

// Exporta o componente PieChart para uso em outros arquivos
export default PieChart;