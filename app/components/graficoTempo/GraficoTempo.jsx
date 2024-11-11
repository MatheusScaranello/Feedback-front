import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import apiUsuarios from '@/app/service/usuario';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Button } from 'reactstrap';
import * as tf from '@tensorflow/tfjs';
import Select from 'react-select';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // Estilos padrão
import 'react-date-range/dist/theme/default.css'; // Tema padrão

// Estilos globais
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; // Remove margens padrão do body
    font-family: 'Arial', sans-serif; // Define a fonte padrão
    background-color: #f8f9fa; // Define a cor de fundo
  }
`;

// Tema da aplicação
const theme = {
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  backgroundColor: '#f8f9fa',
  textColor: '#212529',
};

// Componentes estilizados
const Container = styled.div`
  padding: 20px; // Espaçamento interno
  background-color: ${props => props.theme.backgroundColor}; // Cor de fundo do tema
`;

const Controls = styled.div`
  display: flex; // Flexbox para layout
  flex-wrap: wrap; // Permite quebra de linha
  gap: 10px; // Espaçamento entre os controles
  margin-bottom: 20px; // Margem inferior
`;

const ChartContainer = styled.div`
  margin-top: 20px; // Margem superior
`;

const ErrorMessage = styled.div`
  color: red; // Cor do texto de erro
  font-weight: bold; // Negrito
`;

const LoadingMessage = styled.div`
  color: ${props => props.theme.primaryColor}; // Cor do texto de loading
  font-weight: bold; // Negrito
`;

// Componente de dropdown para seleção múltipla
const MultiSelectDropdown = ({ label, options, value, onChange }) => (
    <div style={{ minWidth: 200 }}>
      <label>{label}</label>
      <Select
        isMulti // Permite seleção múltipla
        options={options.map(option => ({ value: option, label: option }))} // Formata opções
        value={value.map(v => ({ value: v, label: v }))} // Formata valor selecionado
        onChange={(selectedOptions) => onChange(selectedOptions.map(option => option.value))} // Atualiza seleção
      />
    </div>
);

// Componente para gráfico de dispersão
const ChartComponent = ({ dados }) => (
    <ChartContainer>
        <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis dataKey="data" type="category" name="Data" />
                <YAxis dataKey="nota" type="number" name="Nota" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Nota" data={dados} fill="#8884d8" />
            </ScatterChart>
        </ResponsiveContainer>
    </ChartContainer>
);

// Componente para gráfico de comparação
const ComparisonChart = ({ dados, dadosComparacao }) => (
    <ChartContainer>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis dataKey="data" type="category" name="Data" />
                <YAxis dataKey="nota" type="number" name="Nota" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Line name="Nota" data={dados} fill="#8884d8" />
                {dadosComparacao.map((dadosComp, i) => (
                    <Line key={i} name={`Comparação ${i + 1}`} data={dadosComp} fill="#82ca9d" />
                ))}
            </LineChart>
        </ResponsiveContainer>
    </ChartContainer>
);

// Função para agrupar dados por data
const agruparPorData = (dados) => {
    const agrupados = dados.reduce((acc, usuario) => {
        const data = new Date(usuario.data).toLocaleDateString(); // Formata a data
        if (!acc[data]) {
            acc[data] = { totalNota: 0, count: 0 }; // Inicializa objeto se não existir
        }
        acc[data].totalNota += usuario.nota; // Soma notas
        acc[data].count += 1; // Conta usuários
        return acc;
    }, {});

    return Object.keys(agrupados).map(data => ({
        data,
        nota: agrupados[data].totalNota / agrupados[data].count, // Calcula média
    }));
};

// Hook personalizado para buscar usuários
const useFetchUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]); // Estado para usuários
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const [error, setError] = useState(null); // Estado de erro

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const usuariosData = await apiUsuarios.getUsuarios(); // Chama API
                setUsuarios(usuariosData); // Atualiza estado com dados
            } catch (error) {
                setError(error); // Atualiza estado de erro
            } finally {
                setLoading(false); // Finaliza carregamento
            }
        };

        fetchUsuarios(); // Executa a função
    }, []);

    return { usuarios, loading, error }; // Retorna dados e estados
};

// Hook personalizado para filtrar dados
const useDataFiltering = (usuarios, dateRange) => {
    const [anoSelecionado, setAnoSelecionado] = useState([]); // Estado para ano selecionado
    const [mesSelecionado, setMesSelecionado] = useState([]); // Estado para mês selecionado
    const [localSelecionado, setLocalSelecionado] = useState([]); // Estado para local selecionado

    const anosDisponiveis = useMemo(() => [...new Set(usuarios.map(usuario => new Date(usuario.data).getFullYear()))], [usuarios]); // Anos disponíveis
    const locaisDisponiveis = useMemo(() => [...new Set(usuarios.map(usuario => usuario.local))], [usuarios]); // Locais disponíveis

    const mesesDisponiveis = useMemo(() => {
        if (anoSelecionado.length > 0) {
            return [...new Set(usuarios
                .filter(usuario => anoSelecionado.includes(new Date(usuario.data).getFullYear()))
                .map(usuario => new Date(usuario.data).getMonth() + 1))]; // Meses disponíveis
        }
        return [];
    }, [anoSelecionado, usuarios]);

    // Filtra dados com base nas seleções
    const dadosFiltrados = useMemo(() => {
        const filtered = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            return (anoSelecionado.length === 0 || anoSelecionado.includes(data.getFullYear())) &&
                   (mesSelecionado.length === 0 || mesSelecionado.includes(data.getMonth() + 1)) &&
                   (localSelecionado.length === 0 || localSelecionado.includes(usuario.local)) &&
                   (!dateRange || (data >= dateRange.startDate && data <= dateRange.endDate));
        });
        return agruparPorData(filtered); // Agrupa dados filtrados
    }, [anoSelecionado, mesSelecionado, localSelecionado, usuarios, dateRange]);

    return {
        anoSelecionado,
        setAnoSelecionado,
        mesSelecionado,
        setMesSelecionado,
        localSelecionado,
        setLocalSelecionado,
        dadosFiltrados,
        anosDisponiveis,
        mesesDisponiveis,
        locaisDisponiveis,
    };
};

// Componente principal
const GraficoTempo = () => {
    const { usuarios, loading, error } = useFetchUsuarios(); // Busca usuários
    const [dateRange, setDateRange] = useState({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection', // Chave para identificação do intervalo
    });

    const {
        anoSelecionado,
        setAnoSelecionado,
        mesSelecionado,
        setMesSelecionado,
        localSelecionado,
        setLocalSelecionado,
        dadosFiltrados,
        anosDisponiveis,
        mesesDisponiveis,
        locaisDisponiveis,
    } = useDataFiltering(usuarios, dateRange); // Filtra dados

    const [dadosComparacao, setDadosComparacao] = useState([]); // Estado para dados de comparação

    // Função para lidar com a seleção de comparação
    const handleComparisonSelection = (newAnoComp, newMesComp, newLocalComp) => {
        const filteredData = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            return (newAnoComp.length === 0 || newAnoComp.includes(data.getFullYear())) &&
                   (newMesComp.length === 0 || newMesComp.includes(data.getMonth() + 1)) &&
                   (newLocalComp.length === 0 || newLocalComp.includes(usuario.local));
        });
        setDadosComparacao(prev => [...prev, agruparPorData(filteredData)]); // Atualiza dados de comparação
    };

    // Função para exportar dados para CSV
    const exportarParaCSV = () => {
        const csvData = dadosFiltrados.map(row => `${row.data},${row.nota}`).join('\n'); // Formata dados
        const blob = new Blob([csvData], { type: 'text/csv' }); // Cria um blob CSV
        saveAs(blob, 'dados.csv'); // Salva o arquivo
    };

    // Função para fazer parsing de CSV
    const parseCSV = useCallback((file) => {
        Papa.parse(file, {
            complete: (results) => {
                console.log(results.data); // Log dos dados
            },
            header: true, // Define que a primeira linha é o cabeçalho
        });
    }, []);

    // Função para rodar o modelo de aprendizado de máquina
    const runModel = async () => {
        if (dadosFiltrados.length > 0) {
            const model = tf.sequential(); // Cria um modelo sequencial
            model.add(tf.layers.dense({ units: 1, inputShape: [1] })); // Adiciona uma camada densa
            model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' }); // Compila o modelo

            const xs = tf.tensor1d(dadosFiltrados.map((_, i) => i)); // Cria tensores de entrada
            const ys = tf.tensor1d(dadosFiltrados.map(d => d.nota)); // Cria tensores de saída

            await model.fit(xs, ys, { epochs: 100 }); // Treina o modelo

            const result = model.predict(tf.tensor1d([dadosFiltrados.length])); // Faz previsão
            result.print(); // Loga previsão do próximo ponto
        }
    };

    useEffect(() => {
        runModel(); // Executa o modelo ao atualizar dados filtrados
    }, [dadosFiltrados]);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <Container>
                <Controls>
                    <DateRange
                        ranges={[dateRange]}
                        onChange={item => setDateRange(item.selection)} // Atualiza o intervalo de datas
                        moveRangeOnFirstSelection={false} // Não move o intervalo na primeira seleção
                    />
                    <MultiSelectDropdown
                        label="Ano"
                        options={anosDisponiveis} // Anos disponíveis
                        value={anoSelecionado}
                        onChange={setAnoSelecionado} // Atualiza ano selecionado
                    />
                    <MultiSelectDropdown
                        label="Mês"
                        options={mesesDisponiveis} // Meses disponíveis
                        value={mesSelecionado}
                        onChange={setMesSelecionado} // Atualiza mês selecionado
                    />
                    <MultiSelectDropdown
                        label="Local"
                        options={locaisDisponiveis} // Locais disponíveis
                        value={localSelecionado}
                        onChange={setLocalSelecionado} // Atualiza local selecionado
                    />
                    <Button onClick={() => handleComparisonSelection(anoSelecionado, mesSelecionado, localSelecionado)}>Adicionar Comparação</Button>
                </Controls>
                <Button color="secondary" onClick={exportarParaCSV}>Exportar Excel</Button>
                <input type="file" accept=".csv" onChange={(e) => parseCSV(e.target.files[0])} />

                {loading ? (
                    <LoadingMessage>Carregando dados...</LoadingMessage>
                ) : error ? (
                    <ErrorMessage>Erro ao carregar dados. Tente novamente.</ErrorMessage>
                ) : (
                    dadosFiltrados.length > 0 && (
                        <>
                            <ChartComponent dados={dadosFiltrados} />
                            <ComparisonChart dados={dadosFiltrados} dadosComparacao={dadosComparacao} />
                        </>
                    )
                )}
            </Container>
        </ThemeProvider>
    );
};

export default GraficoTempo; // Exporta o componente principal