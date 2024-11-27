import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

  const generatePDF = (cirurgia) => {
    const doc = new jsPDF();

    // Centraliza o título
    doc.setFontSize(16); // Define tamanho maior para o título
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(`Mapa Cirúrgico - Data: ${cirurgia.date}`, pageWidth / 2, 10, {
      align: "center",
    });

    // Diminui a fonte para o responsável e especialidade
    doc.setFontSize(12); // Fonte menor
    doc.text(`Responsável: ${cirurgia.responsible}`, 10, 20);
    doc.text(`Especialidade: ${cirurgia.specialization}`, 10, 25);

    // Gera os dados da tabela
    const tableData = cirurgia.pacientes.map((paciente, index) => [
      index + 1,
      paciente.name,
      paciente.convenio,
      paciente.cirurgia,
      paciente.lio,
      paciente.obs,
      paciente.obs2,
    ]);

    // Gera a tabela
    doc.autoTable({
      head: [["#", "Nome", "Convênio", "Cirurgia", "Lio", "Obs", "Obs 2"]],
      body: tableData,
      startY: 40, // Ajusta a posição da tabela após o cabeçalho
    });

    // Salva o PDF com o nome baseado na data
    doc.save(`Mapa_Cirurgico_${cirurgia.date}.pdf`);
  };

  const handleRowClick = (pacienteId) => {
    navigate(`/paciente/${pacienteId}`); // Navega para a página do paciente
  };

  return (
    <div style={styles.container}>
      {/* Cabeçalho com seta e título */}
      <div style={styles.header}>
        <IoIosArrowBack
          style={styles.backArrow}
          onClick={() => navigate("/")}
        />
        <h1 style={styles.title}>Dados Carregados</h1>
      </div>
      {cirurgias.map((cirurgia) => (
        <div key={cirurgia.id} style={styles.section}>
          <div style={styles.headerSection}>
            <h2 style={styles.subtitle}>Data do Mapa: {cirurgia.date}</h2>
            <button
              style={styles.pdfButton}
              onClick={() => generatePDF(cirurgia)}
            >
              Gerar PDF
            </button>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>#</th>
                <th style={styles.tableHeader}>Nome</th>
                <th style={styles.tableHeader}>Convênio</th>
                <th style={styles.tableHeader}>Cirurgia</th>
                <th style={styles.tableHeader}>Lio</th>
                <th style={styles.tableHeader}>Observações</th>
                <th style={styles.tableHeader}>Obs 2</th>
              </tr>
            </thead>
            <tbody>
              {cirurgia.pacientes.map((paciente, index) => (
                <tr
                  key={paciente.id}
                  style={{
                    ...styles.tableRow,
                    color: getStatusColor(paciente.statusPgto),
                    cursor: "pointer",
                  }}
                  onClick={() => handleRowClick(paciente.id)}
                  role="button"
                >
                  <td style={styles.tableCell}>{index + 1}</td>
                  <td style={styles.tableCell}>{paciente.name}</td>
                  <td style={styles.tableCell}>{paciente.convenio}</td>
                  <td style={styles.tableCell}>{paciente.cirurgia}</td>
                  <td style={styles.tableCell}>{paciente.lio}</td>
                  <td style={styles.tableCell}>{paciente.obs}</td>
                  <td style={styles.tableCell}>{paciente.obs2}</td>
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
    display: "flex",
    alignItems: "center",
    gap: "10px", // Espaço entre a seta e o título
    marginBottom: "30px",
  },
  backArrow: {
    fontSize: "24px",
    cursor: "pointer",
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
    fontSize: "28px",
    color: "#2c3e50",
    fontWeight: "bold",
    flex: 1, // O título ocupa todo o espaço restante
    textAlign: "center", // Centraliza o título
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
  pdfButton: {
    backgroundColor: "green",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    marginLeft: "auto", // Alinha o botão à direita
  },
  headerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // Distribui o conteúdo
    marginBottom: "20px",
  },
};

export default LoadData;
