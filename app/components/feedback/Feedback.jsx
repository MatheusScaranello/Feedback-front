"use client"; // Indica que este componente deve ser renderizado no lado do cliente
import styles from './feedback.module.css'; // Importa o arquivo de estilos CSS para o componente
import { useState } from 'react'; // Importa o hook useState do React para gerenciar estado
import apiUsuarios from '../../service/usuario'; // Importa o serviço de API para interagir com os dados dos usuários

// Função para normalizar texto, removendo acentos e caracteres especiais
const normalizeText = (text) => {
  return text.normalize('NFD') // Normaliza o texto para decompor caracteres acentuados
             .replace(/[\u0300-\u036f]/g, '') // Remove os caracteres de acentuação
             .replace(/ç/g, 'c'); // Substitui 'ç' por 'c'
};

// Componente Feedback
const Feedback = (localParametro) => {
  // Declara estados para armazenar informações de feedback
  const [local, setLocal] = useState("SENAI"); // Estado para armazenar o local do feedback
  const [nota, setNota] = useState(0); // Estado para armazenar a nota dada pelo usuário
  const [observacao, setObservacao] = useState(''); // Estado para armazenar a observação do usuário

  // Função chamada ao submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário

    // Cria um objeto usuario com os dados do feedback
    const usuario = {
      local,
      nota,
      observacao: normalizeText(observacao), // Normaliza o texto da observação
      data: new Date().toISOString().split('T')[0], // Obtém a data atual em formato YYYY-MM-DD
    };

    try {
      await apiUsuarios.createUsuario(usuario); // Chama a API para enviar o feedback
      alert('Feedback enviado com sucesso!'); // Alerta de sucesso
    } catch (error) {
      console.error("Erro ao enviar feedback:", error.message); // Loga o erro no console
      alert('Erro ao enviar feedback.'); // Alerta de erro
    }

    clearForm(); // Limpa o formulário após o envio
  };

  // Função para limpar os campos do formulário
  const clearForm = () => {  
    setNota(0); // Reseta a nota para 0
    setObservacao(''); // Limpa a observação
  };

  // Renderiza o componente de feedback
  return (
    <>
      <div className={styles.fundo}> {/* Estilo de fundo */}
        <div className={styles.card}> {/* Estilo do cartão de feedback */}
          <h2 className={styles.text}> {/* Pergunta sobre recomendação */}
            Em uma escala de 0 a 10, o quanto você recomendaria nosso serviço?
          </h2>
          <div className={styles.scale}> {/* Contêiner para os botões de nota */}
            {[...Array(11).keys()].map((num) => ( // Gera botões de 0 a 10
              <button
                key={num}
                className={num === nota ? styles.selected : styles.notSelected} // Aplica estilo baseado na nota selecionada
                onClick={() => setNota(num)} // Atualiza a nota ao clicar no botão
              >
                {num} {/* Exibe o número da nota */}
              </button>
            ))}
          </div>
          <div className={styles.avaliContainer}> {/* Contêiner para textos de avaliação */}
            <p className={styles.avali01}>Não Satisfeito</p> {/* Texto para nota baixa */}
            <p className={styles.avali}>Satisfeito</p> {/* Texto para nota alta */}
          </div>
          <h2 className={styles.text02}> {/* Pergunta sobre melhoria */}
            Fale como podemos melhorar (opcional)
          </h2>
          <textarea
            className={styles.textarea} // Estilo do campo de texto
            placeholder="..." // Placeholder para o campo de texto
            value={observacao} // Valor atual da observação
            onChange={(e) => setObservacao(e.target.value)} // Atualiza a observação ao digitar
          />
          <div>
            <button className={styles.submit} onClick={handleSubmit}> {/* Botão de envio */}
              Enviar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Feedback; // Exporta o componente Feedback