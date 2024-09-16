"use client";
import { useState, useEffect } from "react";
import styles from "./comentarios.module.css";
import apiUsuarios from "../../service/usuario";

export default function ComentariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [usuariosPerPage] = useState(10);
  const [filterCriteria, setFilterCriteria] = useState({
    minNota: null,
    maxNota: null,
    dateRange: { start: null, end: null },
  });
  const [viewMode, setViewMode] = useState("list");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await apiUsuarios.getUsuarios();
        setUsuarios(data);
        setFilteredUsuarios(data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setError("Erro ao carregar dados.");
      }
    };
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const results = usuarios.filter((usuario) => {
      const matchesSearch = usuario.local.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNota =
        (filterCriteria.minNota === null || usuario.nota >= filterCriteria.minNota) &&
        (filterCriteria.maxNota === null || usuario.nota <= filterCriteria.maxNota);
      const matchesDate =
        (filterCriteria.dateRange.start === null || new Date(usuario.data) >= new Date(filterCriteria.dateRange.start)) &&
        (filterCriteria.dateRange.end === null || new Date(usuario.data) <= new Date(filterCriteria.dateRange.end));
      return matchesSearch && matchesNota && matchesDate;
    });
    setFilteredUsuarios(results);
  }, [searchTerm, usuarios, filterCriteria]);

  //deixar apenas os usuarios que tem comentario
    useEffect(() => {
        const results = usuarios.filter((usuario) => {
            return usuario.observacao !== '';
        });
        setFilteredUsuarios(results);
    }, [usuarios]); 
    

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    const sorted = [...filteredUsuarios].sort((a, b) => {
      const isReversed = sortOrder === "asc" ? 1 : -1;
      return isReversed * (a.nota - b.nota);
    });
    setFilteredUsuarios(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const dataBonita = (data) => {
    const date = new Date(data);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

  return (
    <div className={styles.container}>
      <h1>Lista de Usuários</h1>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Pesquisar local..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.search}
        />
        <button onClick={handleSort} className={styles.sortButton}>
          Ordenar por Nota ({sortOrder})
        </button>
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
      <div className={viewMode === "list" ? styles.listView : styles.gridView}>
        {currentUsuarios.length > 0 ? (
          currentUsuarios.map((usuario) => (
            <div key={usuario.id} className={styles.item}>
              <span>
                ID: {usuario.id} - Nota: {usuario.nota} - Local: {usuario.local} - Data: {dataBonita(usuario.data)} - Observação: {usuario.observacao}
              </span>
            </div>
          ))
        ) : (
          <p className={styles.message}>Nenhum usuário encontrado.</p>
        )}
      </div>
      <div className={styles.pagination}>
        {Array.from({ length: Math.ceil(filteredUsuarios.length / usuariosPerPage) }, (_, i) => (
          <button key={i} onClick={() => handlePageChange(i + 1)} className={styles.pageButton}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}