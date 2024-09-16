"use client";
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import apiUsuarios from '@/app/service/usuario';
import debounce from 'lodash.debounce';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Button, Select } from 'reactstrap';

// Global Styles
const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        font-family: 'Arial', sans-serif;
        background-color: #f8f9fa;
    }
`;

// Themes
const theme = {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    backgroundColor: '#f8f9fa',
    textColor: '#212529',
};

// Styled Components
const Container = styled.div`
    padding: 20px;
    background-color: ${props => props.theme.backgroundColor};
`;

const Controls = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
`;

const ChartContainer = styled.div`
    margin-top: 20px;
`;

const Card = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    padding: 20px;
`;

const FilterSection = styled.div`
    margin-bottom: 20px;
`;

// Custom Hooks
const useFetchUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const usuariosData = await apiUsuarios.getUsuarios();
                setUsuarios(usuariosData);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    return { usuarios, loading, error };
};

const useDataFiltering = (usuarios) => {
    const [anoSelecionado, setAnoSelecionado] = useState('');
    const [mesSelecionado, setMesSelecionado] = useState('');
    const [semanaSelecionada, setSemanaSelecionada] = useState('');
    const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
    const [dados, setDados] = useState([]);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
    const [semanasDisponiveis, setSemanasDisponiveis] = useState([]);
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);

    useEffect(() => {
        if (usuarios.length > 0) {
            const anos = [...new Set(usuarios.map(usuario => new Date(usuario.data).getFullYear()))];
            setAnosDisponiveis(anos);
            const nomesUsuarios = [...new Set(usuarios.map(usuario => usuario.local))];
            setUsuariosDisponiveis(nomesUsuarios);
        }
    }, [usuarios]);

    useEffect(() => {
        if (anoSelecionado) {
            const meses = [...new Set(usuarios
                .filter(usuario => new Date(usuario.data).getFullYear() === parseInt(anoSelecionado))
                .map(usuario => new Date(usuario.data).getMonth() + 1))];
            setMesesDisponiveis(meses);
            setMesSelecionado('');
            setSemanaSelecionada('');
            filtrarDadosPorAno();
        }
    }, [anoSelecionado, usuarios]);

    useEffect(() => {
        if (mesSelecionado) {
            const semanas = [...new Set(usuarios
                .filter(usuario => {
                    const data = new Date(usuario.data);
                    return data.getFullYear() === parseInt(anoSelecionado) && data.getMonth() + 1 === parseInt(mesSelecionado);
                })
                .map(usuario => {
                    const data = new Date(usuario.data);
                    const primeiroDiaMes = new Date(data.getFullYear(), data.getMonth(), 1);
                    return Math.ceil((data.getDate() + primeiroDiaMes.getDay()) / 7);
                }))];
            setSemanasDisponiveis(semanas);
            setSemanaSelecionada('');
            filtrarDadosPorMes();
        }
    }, [mesSelecionado, usuarios, anoSelecionado]);

    useEffect(() => {
        if (semanaSelecionada) {
            filtrarDadosPorSemana();
        }
    }, [semanaSelecionada, usuarios, anoSelecionado, mesSelecionado]);

    const agruparPorData = (dados) => {
        const agrupados = dados.reduce((acc, usuario) => {
            const data = new Date(usuario.data).toLocaleDateString();
            if (!acc[data]) {
                acc[data] = { totalNota: 0, count: 0 };
            }
            acc[data].totalNota += usuario.nota;
            acc[data].count += 1;
            return acc;
        }, {});

        return Object.keys(agrupados).map(data => ({
            data,
            nota: agrupados[data].totalNota / agrupados[data].count
        }));
    };

    const filtrarDadosPorAno = () => {
        const dadosFiltrados = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            return data.getFullYear() === parseInt(anoSelecionado) && (usuarioSelecionado ? usuario.local === usuarioSelecionado : true);
        });
        setDados(agruparPorData(dadosFiltrados));
    };

    const filtrarDadosPorMes = () => {
        const dadosFiltrados = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            return data.getFullYear() === parseInt(anoSelecionado) &&
                data.getMonth() + 1 === parseInt(mesSelecionado) &&
                (usuarioSelecionado ? usuario.local === usuarioSelecionado : true);
        });
        setDados(agruparPorData(dadosFiltrados));
    };

    const filtrarDadosPorSemana = () => {
        const dadosFiltrados = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            const primeiroDiaMes = new Date(data.getFullYear(), data.getMonth(), 1);
            const semana = Math.ceil((data.getDate() + primeiroDiaMes.getDay()) / 7);
            return data.getFullYear() === parseInt(anoSelecionado) &&
                data.getMonth() + 1 === parseInt(mesSelecionado) &&
                semana === parseInt(semanaSelecionada) &&
                (usuarioSelecionado ? usuario.local === usuarioSelecionado : true);
        });
        setDados(agruparPorData(dadosFiltrados));
    };

    return {
        anoSelecionado,
        setAnoSelecionado,
        mesSelecionado,
        setMesSelecionado,
        semanaSelecionada,
        setSemanaSelecionada,
        usuarioSelecionado,
        setUsuarioSelecionado,
        dados,
        anosDisponiveis,
        mesesDisponiveis,
        semanasDisponiveis,
        usuariosDisponiveis
    };
};

// Component for Dropdowns
const Dropdown = ({ label, options, value, onChange }) => (
    <div>
        <label>{label}</label>
        <select onChange={onChange} value={value}>
            <option value="">Selecione</option>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);

// Chart Component
const ChartComponent = ({ dados }) => (
    <ChartContainer>
        <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="data" name="Data" tickFormatter={(tick) => tick} />
                <YAxis type="number" dataKey="nota" name="Nota Média" domain={[0, 'auto']} />
                <ZAxis type="number" range={[100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [value, name === 'nota' ? 'Nota Média' : 'Data']} />
                <Legend />
                <Scatter name="Notas Médias por Data" data={dados} fill="#8884d8" />
            </ScatterChart>
        </ResponsiveContainer>
    </ChartContainer>
);

// Comparison Chart Component
const ComparisonChart = ({ dados }) => {
    const comparisonData = useMemo(() => {
        return dados.map(item => ({
            ...item,
            comparison: item.nota * 1.1 // Example logic
        }));
    }, [dados]);

    return (
        <ChartContainer>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="data" name="Data" tickFormatter={(tick) => tick} />
                    <YAxis type="number" dataKey="nota" name="Nota Média" domain={[0, 'auto']} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [value, name === 'nota' ? 'Nota Média' : 'Data']} />
                    <Legend />
                    <Line type="monotone" dataKey="nota" stroke="#8884d8" />
                    <Line type="monotone" dataKey="comparison" stroke="#82ca9d" />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

// Main Component
const GraficoTempo = () => {
    const { usuarios, loading, error } = useFetchUsuarios();
    const {
        anoSelecionado,
        setAnoSelecionado,
        mesSelecionado,
        setMesSelecionado,
        semanaSelecionada,
        setSemanaSelecionada,
        usuarioSelecionado,
        setUsuarioSelecionado,
        dados,
        anosDisponiveis,
        mesesDisponiveis,
        semanasDisponiveis,
        usuariosDisponiveis
    } = useDataFiltering(usuarios);

    const exportarParaCSV = () => {
        const csvData = dados.map(row => `${row.data},${row.nota}`).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        saveAs(blob, 'dados.csv');
    };

    const exportarParaJSON = () => {
        const json = JSON.stringify(dados, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        saveAs(blob, 'dados.json');
    };

    const exportarParaXML = () => {
        const xml = dados.map(dado => `
            <record>
                <data>${dado.data}</data>
                <nota>${dado.nota}</nota>
            </record>
        `).join('');
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><records>${xml}</records>`;
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        saveAs(blob, 'dados.xml');
    };

    const parseCSV = useCallback((file) => {
        Papa.parse(file, {
            complete: (results) => {
                console.log(results.data);
            },
            header: true
        });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <Container>
                <Controls>
                    <Dropdown
                        label="Ano"
                        options={anosDisponiveis}
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(e.target.value)}
                    />
                    {anoSelecionado && (
                        <Dropdown
                            label="Mês"
                            options={mesesDisponiveis}
                            value={mesSelecionado}
                            onChange={(e) => setMesSelecionado(e.target.value)}
                        />
                    )}
                    {mesSelecionado && (
                        <Dropdown
                            label="Semana"
                            options={semanasDisponiveis}
                            value={semanaSelecionada}
                            onChange={(e) => setSemanaSelecionada(e.target.value)}
                        />
                    )}
                    <Dropdown
                        label="Usuário"
                        options={usuariosDisponiveis}
                        value={usuarioSelecionado}
                        onChange={(e) => setUsuarioSelecionado(e.target.value)}
                    />
                </Controls>
                <FilterSection>
                    <Button color="secondary" onClick={exportarParaCSV}>Exportar para CSV</Button>
                    <Button color="secondary" onClick={exportarParaJSON}>Exportar para JSON</Button>
                    <Button color="secondary" onClick={exportarParaXML}>Exportar para XML</Button>
                    <input type="file" accept=".csv" onChange={(e) => parseCSV(e.target.files[0])} />
                </FilterSection>
                {loading ? (
                    <div>Carregando dados...</div>
                ) : error ? (
                    <div>Erro ao carregar dados. Tente novamente.</div>
                ) : (
                    dados.length > 0 && (
                        <>
                            <ChartComponent dados={dados} />
                            <ComparisonChart dados={dados} />
                        </>
                    )
                )}
            </Container>
        </ThemeProvider>
    );
};

export default GraficoTempo;