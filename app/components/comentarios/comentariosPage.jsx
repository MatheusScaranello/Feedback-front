import { useState, useEffect } from "react"; // Importa hooks do React para gerenciar estado e efeitos colaterais
import styles from "./comentarios.module.css"; // Importa o arquivo de estilos CSS específico para este componente
import apiUsuarios from "../../service/usuario"; // Importa o serviço de API para interagir com os dados dos usuários

export default function ComentariosPage() {
  // Declara estados para gerenciar usuários, filtro, pesquisa, ordenação, etc.
  const [usuarios, setUsuarios] = useState([]); // Estado para armazenar todos os usuários
  const [filteredUsuarios, setFilteredUsuarios] = useState([]); // Estado para usuários filtrados com base na pesquisa e critérios
  const [searchTerm, setSearchTerm] = useState(""); // Estado para armazenar o termo de pesquisa
  const [sortOrder, setSortOrder] = useState("asc"); // Estado para armazenar a ordem de classificação
  const [currentPage, setCurrentPage] = useState(1); // Estado para a página atual da lista de usuários
  const [usuariosPerPage] = useState(10); // Define o número de usuários exibidos por página
  const [filterCriteria, setFilterCriteria] = useState({ // Estado para critérios de filtro
    minNota: null,
    maxNota: null,
    dateRange: { start: null, end: null },
  });
  const [viewMode, setViewMode] = useState("list"); // Estado para o modo de visualização (lista ou grade)
  const [error, setError] = useState(null); // Estado para armazenar mensagens de erro

  // useEffect para buscar usuários da API quando o componente é montado
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await apiUsuarios.getUsuarios(); // Chama a API para obter usuários
        setUsuarios(data); // Atualiza o estado com os usuários recebidos
        setFilteredUsuarios(data); // Inicializa os usuários filtrados
      } catch (error) {
        console.error("Erro ao buscar usuários:", error); // Loga o erro no console
        setError("Erro ao carregar dados."); // Atualiza o estado de erro
      }
    };
    fetchUsuarios(); // Executa a função para buscar usuários
  }, []); // O array vazio indica que o efeito é executado apenas uma vez após a montagem

  // useEffect para filtrar usuários com base na pesquisa e critérios de filtro
  useEffect(() => {
    const results = usuarios.filter((usuario) => {
      const matchesSearch = usuario.local.toLowerCase().includes(searchTerm.toLowerCase()); // Verifica se o local do usuário corresponde ao termo de pesquisa
      const matchesNota =
        (filterCriteria.minNota === null || usuario.nota >= filterCriteria.minNota) && // Verifica a nota mínima
        (filterCriteria.maxNota === null || usuario.nota <= filterCriteria.maxNota); // Verifica a nota máxima
      const matchesDate =
        (filterCriteria.dateRange.start === null || new Date(usuario.data) >= new Date(filterCriteria.dateRange.start)) && // Verifica a data de início
        (filterCriteria.dateRange.end === null || new Date(usuario.data) <= new Date(filterCriteria.dateRange.end)); // Verifica a data de fim
      return matchesSearch && matchesNota && matchesDate; // Retorna verdadeiro se todas as condições forem atendidas
    });
    setFilteredUsuarios(results); // Atualiza o estado com os resultados filtrados
  }, [searchTerm, usuarios, filterCriteria]); // Executa quando o termo de pesquisa, usuários ou critérios de filtro mudam

  // useEffect para filtrar usuários com observações não vazias
  useEffect(() => {
    const results = usuarios.filter((usuario) => usuario.observacao !== ''); // Filtra usuários que têm observações
    setFilteredUsuarios(results); // Atualiza o estado com os resultados filtrados
  }, [usuarios]); // Executa quando a lista de usuários muda

  // Função para lidar com a mudança do campo de pesquisa
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Atualiza o estado com o valor do campo de pesquisa
  };

  // Função para ordenar usuários com base na nota
  const handleSort = () => {
    const sorted = [...filteredUsuarios].sort((a, b) => {
      const isReversed = sortOrder === "asc" ? 1 : -1; // Determina a direção da ordenação
      return isReversed * (a.nota - b.nota); // Ordena com base na nota
    });
    setFilteredUsuarios(sorted); // Atualiza o estado com os usuários ordenados
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Alterna a ordem de classificação
  };

  // Função para mudar a página atual
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Atualiza a página atual
  };

  // Função para lidar com mudanças nos critérios de filtro
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    
    // Valida os valores de nota mínima e máxima
    if (name === "minNota" && (value < -1 || value > 10)) return; 
    if (name === "maxNota" && (value < 0 || value > 11)) return; 
    
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value, // Atualiza os critérios de filtro com o novo valor
    }));
  };

  // Função para formatar a data de forma legível
  const dataBonita = (data) => {
    const date = new Date(data);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`; // Retorna a data no formato DD/MM/YYYY
  };

  // Cálculo dos índices de usuários a serem exibidos na página atual
  const indexOfLastUsuario = currentPage * usuariosPerPage; 
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage; 
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario); // Seleciona os usuários da página atual

  // Renderiza o componente
  return (
    <div className={styles.fundo}>
      <div className={styles.container}>
        <h1 className={styles.h1}>Comentários</h1> {/* Título da página */}
        {error && <p className={styles.error}>{error}</p>} {/* Exibe mensagem de erro se houver */}
        <div className={styles.controls}>
          {/* Campo de pesquisa */}
          <input
            type="text"
            placeholder="Pesquisar local..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.search}
          />
          {/* Botão para ordenar usuários */}
          <button onClick={handleSort} className={styles.sortButton}>
            Ordenar por Nota ({sortOrder})
          </button>
          {/* Campos de filtro para notas e datas */}
          <input
            type="number"
            name="minNota"
            placeholder="Nota mínima"
            value={filterCriteria.minNota || ""}
            onChange={handleFilterChange}
            className={styles.filter}
          />
          <input
            type="number"
            name="maxNota"
            placeholder="Nota máxima"
            value={filterCriteria.maxNota || ""}
            onChange={handleFilterChange}
            className={styles.filter}
          />
          <input
            type="date"
            name="start"
            placeholder="Data início"
            value={filterCriteria.dateRange.start || ""}
            onChange={(e) => handleFilterChange({ target: { name: "dateRange.start", value: e.target.value } })}
            className={styles.filter}
          />
          <input
            type="date"
            name="end"
            placeholder="Data fim"
            value={filterCriteria.dateRange.end || ""}
            onChange={(e) => handleFilterChange({ target: { name: "dateRange.end", value: e.target.value } })}
            className={styles.filter}
          />
        </div>
        {/* Renderiza a lista ou grade de usuários com base no modo de visualização */}
        <div className={viewMode === "list" ? styles.listView : styles.gridView}>
          {currentUsuarios.length > 0 ? (
            currentUsuarios.map((usuario) => (
              <div key={usuario.id} className={styles.item}>
                <span className={styles.span}>
                  ID: {usuario.id} - Nota: {usuario.nota} - Local: {usuario.local} - Data: {dataBonita(usuario.data)} - Observação: {usuario.observacao}
                </span>
              </div>
            ))
          ) : (
            <p className={styles.message}>Nenhum usuário encontrado.</p> // Mensagem quando não há usuários
          )}
        </div>
        {/* Renderiza a navegação de páginas */}
        <div className={styles.pagination}>
          {Array.from({ length: Math.ceil(filteredUsuarios.length / usuariosPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ""}`}
            >
              {i + 1} {/* Número da página */}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}