"use client";
import { useState, useEffect } from "react";
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiUsuarios from '@/app/service/usuario';
import styles from "./graficoPizza.module.css";

// Registrar os elementos do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = (local) => {
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        async function fetchUsuarios() {
            try {
                const data = await apiUsuarios.getUsuarioByLocal(local);
                setUsuarios(data);
            } catch (error) {
                console.error(error);
            }
        }
        fetchUsuarios();
    }, []);

    // Filtrar os usuários por nota Muito satisfeitos (9-10): Usuários satisfeitos que provavelmente recomendaram o serviço.
     //Neutros (7-8): Usuários satisfeitos, mas não entusiasmados.
     //Detratores (0-6): Usuários insatisfeitos que podem prejudicar a reputação.
    const insatisfeitos = usuarios.filter((usuario) => usuario.nota <= 6).length;
    const satisfeitos = usuarios.filter((usuario) => usuario.nota >= 7 && usuario.nota <= 8).length;
    const muitoSatisfeitos = usuarios.filter((usuario) => usuario.nota >= 9 && usuario.nota <= 10).length;




  const data = {
    labels: ['Insatisfeitos', 'Satisfeitos', 'Muito satisfeitos'],
    datasets: [
      {
        label: 'Pontuação',
        data: [insatisfeitos, satisfeitos, muitoSatisfeitos],
        backgroundColor: ['#BFBFBF', '#3366CC', '#FF9933']
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div>
      <h2>Pontuação</h2>
      <Pie data={data} options={options} />
    </div>
  );
};

export default PieChart;