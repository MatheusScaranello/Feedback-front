"use client"; // Indica que este componente deve ser renderizado no lado do cliente

import React, { useState, useEffect, useMemo } from 'react'; // Importa bibliotecas e hooks do React
import Slider from 'react-slider'; // Importa o componente Slider para seleção de intervalo
import format from 'date-fns/format'; // Importa função para formatar datas
import apiUsuarios from '../../service/usuario'; // Importa o serviço para buscar usuários
import GraficoPizza from '../graficoPizza/GraficoPizza'; // Importa componente de gráfico de pizza
import styles from './rangeDate.module.css'; // Importa estilos específicos para este componente

// Componente principal para seleção de intervalo de datas
export default function RangeDate() {
    const [usuarios, setUsuarios] = useState([]); // Estado para armazenar a lista de usuários
    const [range, setRange] = useState([0, 0]); // Estado para armazenar o intervalo selecionado pelo slider
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '' }); // Estado para armazenar as datas de início e fim
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Estado para armazenar usuários filtrados

    // Efeito para buscar usuários ao montar o componente
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const data = await apiUsuarios.getUsuarios(); // Chama a API para buscar usuários
                setUsuarios(data); // Atualiza o estado com os dados recebidos
            } catch (error) {
                console.error("Erro ao buscar usuários:", error); // Log de erro caso a busca falhe
            }
        };
        fetchUsuarios(); // Executa a função de busca
    }, []); // Executa apenas uma vez ao montar o componente

    // Cálculo da menor data e total de dias a partir da menor data
    const { menorData, diasTotal } = useMemo(() => {
        if (usuarios.length === 0) return { menorData: null, diasTotal: 0 }; // Retorna valores padrão se não houver usuários

        const dates = usuarios.map(usuario => new Date(usuario.data)); // Converte as datas dos usuários para objetos Date
        const menorData = new Date(Math.min(...dates)); // Encontra a menor data
        const hoje = new Date(); // Obtém a data atual
        const diasTotal = Math.ceil((hoje - menorData) / (1000 * 60 * 60 * 24)); // Calcula a diferença em dias
        return { menorData, diasTotal }; // Retorna a menor data e o total de dias
    }, [usuarios]); // Recalcula quando a lista de usuários muda

    // Inicializa o intervalo de datas após carregar a menor data
    useEffect(() => {
        if (menorData) {
            setRange([0, diasTotal]); // Define o range inicial
            setPeriodo({
                inicio: format(menorData, 'yyyy-MM-dd'), // Formata a menor data como string
                fim: format(new Date(), 'yyyy-MM-dd'), // Formata a data atual como string
            });
        }
    }, [menorData, diasTotal]); // Executa sempre que a menor data ou total de dias muda

    // Ajusta a data a partir de um valor do slider
    const ajustarDataSlider = (valor) => {
        const novaData = new Date(menorData); // Cria uma nova data a partir da menor data
        novaData.setDate(novaData.getDate() + Number(valor)); // Adiciona o valor do slider à data
        return format(novaData, 'yyyy-MM-dd'); // Retorna a data formatada como string
    };

    // Filtra usuários dentro do intervalo de tempo selecionado
    const filtrarUsuariosPorPeriodo = (inicio, fim) => {
        const usuariosFiltrados = usuarios.filter(usuario => {
            const dataUsuario = new Date(usuario.data); // Converte a data do usuário para objeto Date
            return dataUsuario >= new Date(inicio) && dataUsuario <= new Date(fim); // Verifica se a data está dentro do intervalo
        });
        return usuariosFiltrados; // Retorna a lista de usuários filtrados
    };

    // Atualiza o intervalo de datas quando o slider é ajustado
    const handleRangeChange = (values) => {
        const novoPeriodo = {
            inicio: ajustarDataSlider(values[0]), // Ajusta a data de início com o valor do slider
            fim: ajustarDataSlider(values[1]) // Ajusta a data de fim com o valor do slider
        };
        setRange(values); // Atualiza o estado do range
        setPeriodo(novoPeriodo); // Atualiza o estado do período

        // Filtra e define usuários dentro do intervalo
        const usuariosNoIntervalo = filtrarUsuariosPorPeriodo(novoPeriodo.inicio, novoPeriodo.fim);
        setUsuariosFiltrados(usuariosNoIntervalo); // Atualiza o estado dos usuários filtrados
    };

    // Atualiza a data manualmente pelo input
    const handleInputChange = (e, tipo) => {
        const novaData = new Date(e.target.value); // Obtém a nova data do input
        if (isNaN(novaData) || novaData < menorData) return; // Verifica se a data é válida e não anterior à menor data

        const diasDesdeMenor = Math.ceil((novaData - menorData) / (1000 * 60 * 60 * 24)); // Calcula os dias desde a menor data
        setRange((prevRange) => {
            const novoRange = tipo === 'inicio' ? [diasDesdeMenor, prevRange[1]] : [prevRange[0], diasDesdeMenor]; // Atualiza o range baseado no tipo
            handleRangeChange(novoRange); // Chama a função para atualizar o range
            return novoRange; // Retorna o novo range
        });
    };

    return (
        <div>
            <div className={styles.container}> {/* Contêiner principal com estilos */}
                <h1 className={styles.seletec}>Selecione o período</h1> {/* Título da seção */}
                <div className={styles.rangeContainer}> {/* Contêiner para os inputs de data */}
                    <span className={styles.label}>De:</span> {/* Label para data de início */}
                    <input
                        type="date"
                        value={periodo.inicio} // Valor do input de data de início
                        onChange={(e) => handleInputChange(e, 'inicio')} // Atualiza a data de início ao mudar
                        className={styles.dateInput} // Classe para estilização
                    />
                    <span className={styles.label}>Até:</span> {/* Label para data de fim */}
                    <input
                        type="date"
                        value={periodo.fim} // Valor do input de data de fim
                        onChange={(e) => handleInputChange(e, 'fim')} // Atualiza a data de fim ao mudar
                        className={styles.dateInput} // Classe para estilização
                    />
                </div>
                <Slider
                    className={styles.slider} // Classe para estilização do slider
                    thumbClassName={styles.thumb} // Classe para estilização do polegar do slider
                    trackClassName={styles.track} // Classe para estilização da trilha do slider
                    min={0} // Valor mínimo do slider
                    max={diasTotal} // Valor máximo do slider
                    value={range} // Valor atual do slider
                    onChange={handleRangeChange} // Atualiza o intervalo ao mudar o slider
                    withTracks // Adiciona uma trilha visível para o slider
                />

                {/* Componente para exibir os usuários filtrados */}
                <GraficoPizza usuarios={usuariosFiltrados} /> {/* Exibe gráfico com os usuários filtrados */}
            </div> 
        </div>
    );
}