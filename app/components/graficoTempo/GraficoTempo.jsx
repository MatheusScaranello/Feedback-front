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

const ErrorMessage = styled.div`
  color: red;
  font-weight: bold;
`;

const LoadingMessage = styled.div`
  color: ${props => props.theme.primaryColor};
  font-weight: bold;
`;

const MultiSelectDropdown = ({ label, options, value, onChange }) => (
    <div style={{ minWidth: 200 }}>
      <label>{label}</label>
      <Select
        isMulti
        options={options.map(option => ({ value: option, label: option }))}
        value={value.map(v => ({ value: v, label: v }))}
        onChange={(selectedOptions) => onChange(selectedOptions.map(option => option.value))}
      />
    </div>
  );

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

// Function to group data by date
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
    nota: agrupados[data].totalNota / agrupados[data].count,
  }));
};

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

const useDataFiltering = (usuarios, dateRange) => {
  const [anoSelecionado, setAnoSelecionado] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState([]);
  const [localSelecionado, setLocalSelecionado] = useState([]);

  const anosDisponiveis = useMemo(() => [...new Set(usuarios.map(usuario => new Date(usuario.data).getFullYear()))], [usuarios]);
  const locaisDisponiveis = useMemo(() => [...new Set(usuarios.map(usuario => usuario.local))], [usuarios]);

  const mesesDisponiveis = useMemo(() => {
    if (anoSelecionado.length > 0) {
      return [...new Set(usuarios
        .filter(usuario => anoSelecionado.includes(new Date(usuario.data).getFullYear()))
        .map(usuario => new Date(usuario.data).getMonth() + 1))];
    }
    return [];
  }, [anoSelecionado, usuarios]);

  const dadosFiltrados = useMemo(() => {
    const filtered = usuarios.filter(usuario => {
      const data = new Date(usuario.data);
      return (anoSelecionado.length === 0 || anoSelecionado.includes(data.getFullYear())) &&
             (mesSelecionado.length === 0 || mesSelecionado.includes(data.getMonth() + 1)) &&
             (localSelecionado.length === 0 || localSelecionado.includes(usuario.local)) &&
             (!dateRange || (data >= dateRange.startDate && data <= dateRange.endDate));
    });
    return agruparPorData(filtered);
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

// Main Component
const GraficoTempo = () => {
  const { usuarios, loading, error } = useFetchUsuarios();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
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
  } = useDataFiltering(usuarios, dateRange);

  const [dadosComparacao, setDadosComparacao] = useState([]);

  const handleComparisonSelection = (newAnoComp, newMesComp, newLocalComp) => {
    const filteredData = usuarios.filter(usuario => {
      const data = new Date(usuario.data);
      return (newAnoComp.length === 0 || newAnoComp.includes(data.getFullYear())) &&
             (newMesComp.length === 0 || newMesComp.includes(data.getMonth() + 1)) &&
             (newLocalComp.length === 0 || newLocalComp.includes(usuario.local));
    });
    setDadosComparacao(prev => [...prev, agruparPorData(filteredData)]);
  };

  const exportarParaCSV = () => {
    const csvData = dadosFiltrados.map(row => `${row.data},${row.nota}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    saveAs(blob, 'dados.csv');
  };

  const parseCSV = useCallback((file) => {
    Papa.parse(file, {
      complete: (results) => {
        console.log(results.data);
      },
      header: true,
    });
  }, []);

  const runModel = async () => {
    if (dadosFiltrados.length > 0) {
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

      const xs = tf.tensor1d(dadosFiltrados.map((_, i) => i));
      const ys = tf.tensor1d(dadosFiltrados.map(d => d.nota));

      await model.fit(xs, ys, { epochs: 100 });

      const result = model.predict(tf.tensor1d([dadosFiltrados.length]));
      result.print(); // Log prediction for the next point
    }
  };

  useEffect(() => {
    runModel();
  }, [dadosFiltrados]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Container>
        <Controls>
          <DateRange
            ranges={[dateRange]}
            onChange={item => setDateRange(item.selection)}
            moveRangeOnFirstSelection={false}
          />
          <MultiSelectDropdown
            label="Ano"
            options={anosDisponiveis}
            value={anoSelecionado}
            onChange={setAnoSelecionado}
          />
          <MultiSelectDropdown
            label="Mês"
            options={mesesDisponiveis}
            value={mesSelecionado}
            onChange={setMesSelecionado}
          />
          <MultiSelectDropdown
            label="Local"
            options={locaisDisponiveis}
            value={localSelecionado}
            onChange={setLocalSelecionado}
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

export default GraficoTempo;