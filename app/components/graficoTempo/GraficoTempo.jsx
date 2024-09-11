"use client";
import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiUsuarios from '@/app/service/usuario';

const GraficoTempo = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
    const [semanasDisponiveis, setSemanasDisponiveis] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState('');
    const [mesSelecionado, setMesSelecionado] = useState('');
    const [semanaSelecionada, setSemanaSelecionada] = useState('');
    const [dados, setDados] = useState([]);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const usuariosData = await apiUsuarios.getUsuarios();
                setUsuarios(usuariosData);
                const anos = [...new Set(usuariosData.map(usuario => new Date(usuario.data).getFullYear()))];
                setAnosDisponiveis(anos);

                const nomesUsuarios = [...new Set(usuariosData.map(usuario => usuario.nome))];
                setUsuariosDisponiveis(nomesUsuarios);

                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
                setLoading(false);
            }
        };
        fetchUsuarios();
    }, []);

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

    const exportarParaCSV = () => {
        const csvData = dados.map(row => `${row.data},${row.nota}`).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select onChange={(e) => setAnoSelecionado(e.target.value)} value={anoSelecionado}>
                    <option value="">Selecione o Ano</option>
                    {anosDisponiveis.map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                    ))}
                </select>
                {anoSelecionado && (
                    <select onChange={(e) => setMesSelecionado(e.target.value)} value={mesSelecionado}>
                        <option value="">Selecione o Mês</option>
                        {mesesDisponiveis.map(mes => (
                            <option key={mes} value={mes}>{mes}</option>
                        ))}
                    </select>
                )}
                {mesSelecionado && (
                    <select onChange={(e) => setSemanaSelecionada(e.target.value)} value={semanaSelecionada}>
                        <option value="">Selecione a Semana</option>
                        {semanasDisponiveis.map(semana => (
                            <option key={semana} value={semana}>{`Semana ${semana}`}</option>
                        ))}
                    </select>
                )}
                <select onChange={(e) => setUsuarioSelecionado(e.target.value)} value={usuarioSelecionado}>
                    <option value="">Todos os Usuários</option>
                    {usuariosDisponiveis.map(usuario => (
                        <option key={usuario} value={usuario}>{usuario}</option>
                    ))}
                </select>
            </div>
            <button onClick={exportarParaCSV} style={{ marginBottom: '20px' }}>Exportar para CSV</button>
            {loading ? (
                <div>Carregando dados...</div>
            ) : (
                dados.length > 0 && (
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
                )
            )}
        </div>
    );
};

export default GraficoTempo;