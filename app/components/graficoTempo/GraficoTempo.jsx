"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import apiUsuarios from '@/app/service/usuario';
import debounce from 'lodash.debounce';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import { CSVLink } from 'react-csv';
import Papa from 'papaparse';

// Styled Components
const Container = styled.div`
    padding: 20px;
    font-family: Arial, sans-serif;
    background-color: #f8f9fa;
`;

const Controls = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
`;

const Button = styled.button`
    padding: 10px 20px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        background-color: #0056b3;
    }
`;

const Select = styled.select`
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 150px;
`;

const ChartContainer = styled.div`
    margin-top: 20px;
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
                setLoading(false);
            } catch (error) {
                setError(error);
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
            const nomesUsuarios = [...new Set(usuarios.map(usuario => usuario.nome))];
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
            return data.getFullYear() === parseInt(anoSelecionado) && (usuarioSelecionado ? usuario.nome === usuarioSelecionado : true);
        });
        setDados(agruparPorData(dadosFiltrados));
    };

    const filtrarDadosPorMes = () => {
        const dadosFiltrados = usuarios.filter(usuario => {
            const data = new Date(usuario.data);
            return data.getFullYear() === parseInt(anoSelecionado) &&
                data.getMonth() + 1 === parseInt(mesSelecionado) &&
                (usuarioSelecionado ? usuario.nome === usuarioSelecionado : true);
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
                (usuarioSelecionado ? usuario.nome === usuarioSelecionado : true);
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
        usuariosDisponiveis,
    };
};

// Component for Dropdowns
const Dropdown = ({ label, options, value, onChange }) => (
    <div>
        <label>{label}</label>
        <Select onChange={onChange} value={value}>
            <option value="">Selecione</option>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </Select>
    </div>
);

// Export Button Component
const ExportButton = ({ onClick }) => (
    <Button onClick={onClick}>Exportar para CSV</Button>
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
    // Function to prepare data for the comparison chart
    const prepareComparisonData = (dados) => {
        // Implement comparison data logic here
        return dados; // Placeholder
    };

    return (
        <ChartContainer>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="data" name="Data" tickFormatter={(tick) => tick} />
                    <YAxis type="number" dataKey="nota" name="Nota Média" domain={[0, 'auto']} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [value, name === 'nota' ? 'Nota Média' : 'Data']} />
                    <Legend />
                    {/* Add additional Line components for comparison */}
                    <Line type="monotone" dataKey="nota" stroke="#8884d8" />
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
        usuariosDisponiveis,
    } = useDataFiltering(usuarios);

    const exportarParaCSV = () => {
        const csvData = dados.map(row => `${row.data},${row.nota}`).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        saveAs(blob, 'dados.csv');
    };

    return (
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
            <ExportButton onClick={exportarParaCSV} />
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
    );
};

export default GraficoTempo;
