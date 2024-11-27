import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

const LoadData = () => {
  const [cirurgias, setCirurgias] = useState([]);
  const navigate = useNavigate();

  // Função para determinar a cor do status
  const getStatusColor = (statusPgto) => {
    if (statusPgto === "Pago") return "green";
    if (statusPgto === "Aguardando Pgto.") return "red";
    return "black"; // Preto por padrão
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cirurgiasCollectionRef = collection(db, "cirurgias");
        const cirurgiaDocs = await getDocs(cirurgiasCollectionRef);

        const cirurgiasData = await Promise.all(
          cirurgiaDocs.docs.map(async (docSnap) => {
            const cirurgia = { id: docSnap.id, ...docSnap.data() };

            const pacientesCollectionRef = collection(
              db,
              "cirurgias",
              docSnap.id,
              "pacientes"
            );
            const pacientesDocs = await getDocs(pacientesCollectionRef);

            const pacientes = pacientesDocs.docs.map((pacienteDoc) => ({
              id: pacienteDoc.id,
              ...pacienteDoc.data(),
            }));

            return { ...cirurgia, pacientes };
          })
        );

        setCirurgias(cirurgiasData);
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (pacienteId) => {
    navigate(`/paciente/${pacienteId}`); // Navega para a página do paciente
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Dados Carregados</h1>
      {cirurgias.map((cirurgia) => (
        <div key={cirurgia.id} style={styles.section}>
          <h2 style={styles.title}>Data do Mapa: {cirurgia.date}</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>#</th>
                <th style={styles.tableHeader}>Nome</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Convênio</th>
                <th style={styles.tableHeader}>Cirurgia</th>
                <th style={styles.tableHeader}>Lio</th>
                <th style={styles.tableHeader}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {cirurgia.pacientes.map((paciente, index) => (
                <tr
                  key={paciente.id}
                  style={{
                    ...styles.tableRow,
                    color: getStatusColor(paciente.statusPgto), // Define a cor com base no status
                  }}
                  onClick={() => handleRowClick(paciente.id)} // Faz a linha ser clicável
                  role="button" // Adiciona acessibilidade
                >
                  <td style={styles.tableCell}>{index + 1}</td>
                  <td style={styles.tableCell}>{paciente.name}</td>
                  <td style={styles.tableCell}>{paciente.status}</td>
                  <td style={styles.tableCell}>{paciente.convenio}</td>
                  <td style={styles.tableCell}>{paciente.cirurgia}</td>
                  <td style={styles.tableCell}>{paciente.lio}</td>
                  <td style={styles.tableCell}>{paciente.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Arial', sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#f7f7f7",
    borderRadius: "15px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "28px",
    marginBottom: "30px",
    color: "#2c3e50",
    textAlign: "center",
    fontWeight: "bold",
  },
  section: {
    marginBottom: "40px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "15px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "22px",
    marginBottom: "15px",
    color: "#34495e",
    textAlign: "center",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "20px",
    marginTop: "20px",
    marginBottom: "10px",
    color: "#2c3e50",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    marginBottom: "20px",
    textAlign: "center",
    borderRadius: "10px",
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#2c3e50",
    color: "#fff",
    fontWeight: "bold",
    padding: "10px",
  },
  tableRow: {
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #ddd",
  },
  tableCell: {
    padding: "10px",
    textAlign: "center",
    border: "1px solid #ddd",
  },
};

export default LoadData;