import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const PacienteDetails = () => {
  const { id } = useParams();
  const [paciente, setPaciente] = useState(null);
  const [error, setError] = useState(null);

  // Estados para os valores editáveis
  const [tipoLio, setTipoLio] = useState("");
  const [pix, setPix] = useState(0);
  const [dinheiro, setDinheiro] = useState(0);
  const [debito, setDebito] = useState(0);
  const [credito, setCredito] = useState(0);
  const [aReceber, setAReceber] = useState(0);
  const [statusPgto, setStatusPgto] = useState("Aguardando Pgto.");

  useEffect(() => {
    const fetchPacienteDetails = async () => {
      try {
        const cirurgiasCollectionRef = collection(db, "cirurgias");
        const cirurgiaDocs = await getDocs(cirurgiasCollectionRef);

        let pacienteEncontrado = null;

        for (const cirurgiaDoc of cirurgiaDocs.docs) {
          const pacientesCollectionRef = collection(
            db,
            "cirurgias",
            cirurgiaDoc.id,
            "pacientes"
          );

          const pacienteDocRef = doc(pacientesCollectionRef, id);
          const pacienteSnap = await getDoc(pacienteDocRef);

          if (pacienteSnap.exists()) {
            pacienteEncontrado = {
              id: pacienteSnap.id,
              cirurgiaId: cirurgiaDoc.id,
              ...pacienteSnap.data(),
            };
            break;
          }
        }

        if (pacienteEncontrado) {
          setPaciente(pacienteEncontrado);

          // Inicialize os estados com valores existentes
          setTipoLio(pacienteEncontrado.lio || "");
          setPix(pacienteEncontrado.pix || 0);
          setDinheiro(pacienteEncontrado.dinheiro || 0);
          setDebito(pacienteEncontrado.debito || 0);
          setCredito(pacienteEncontrado.credito || 0);

          // Inicialize "A Receber"
          const valorInicial =
            pacienteEncontrado.lio === "Monofocal"
              ? 1500
              : pacienteEncontrado.lio === "Multifocal"
              ? 3500
              : 0;
          setAReceber(valorInicial);
        } else {
          setError("Paciente não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao carregar os detalhes do paciente:", error);
        setError("Erro ao carregar os detalhes do paciente.");
      }
    };

    fetchPacienteDetails();
  }, [id]);

  // Atualizar "A Receber" dinamicamente
  useEffect(() => {
    const valorInicial =
      tipoLio === "Monofocal" ? 1500 : tipoLio === "Multifocal" ? 3500 : 0;
    const totalRecebido =
      parseFloat(pix || 0) +
      parseFloat(dinheiro || 0) +
      parseFloat(debito || 0) +
      parseFloat(credito || 0);
    setAReceber(valorInicial - totalRecebido);
  }, [tipoLio, pix, dinheiro, debito, credito]);

  const handleSave = async () => {
    if (!paciente || !paciente.cirurgiaId) {
      alert("Informações do paciente ou cirurgia não estão completas.");
      return;
    }

    const novoStatusPgto = aReceber === 0 ? "Pago" : "Aguardando Pgto.";

    try {
      const pacienteDocRef = doc(
        db,
        "cirurgias",
        paciente.cirurgiaId,
        "pacientes",
        paciente.id
      );

      await updateDoc(pacienteDocRef, {
        lio: tipoLio,
        pix: parseFloat(pix) || 0,
        dinheiro: parseFloat(dinheiro) || 0,
        debito: parseFloat(debito) || 0,
        credito: parseFloat(credito) || 0,
        aReceber: parseFloat(aReceber) || 0,
        statusPgto: novoStatusPgto,
      });

      setStatusPgto(novoStatusPgto);
      alert("Informações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar as informações:", error);
      alert("Erro ao salvar as informações.");
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!paciente) {
    return <p>Carregando...</p>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Detalhes do Paciente</h1>
      <div style={styles.row}>
        {/* Primeira Coluna: Informações Gerais */}
        <div style={styles.column}>
          <p>
            <strong>Nome:</strong> {paciente.name}
          </p>
          <p>
            <strong>Status:</strong> {paciente.status}
          </p>
          <p>
            <strong>Convênio:</strong> {paciente.convenio}
          </p>
          <p>
            <strong>Cirurgia:</strong> {paciente.cirurgia}
          </p>
          <p>
            <strong>Lio:</strong> {paciente.lio}
          </p>
          <p>
            <strong>Observações:</strong> {paciente.obs}
          </p>
        </div>

        {/* Segunda Coluna: Tabela */}
        <div style={styles.column}>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.tableCellHeader}>Tipo de Lio</td>
                <td style={styles.tableCell}>
                  <select
                    value={tipoLio}
                    onChange={(e) => setTipoLio(e.target.value)}
                    style={styles.select}
                  >
                    <option value="" abled>
                      Selecionar
                    </option>
                    <option value="Monofocal">Monofocal</option>
                    <option value="Multifocal">Multifocal</option>
                  </select>
                </td>
              </tr>

              <tr>
                <td style={styles.tableCellHeader}>Pix</td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={pix || ""}
                    placeholder="Informe o Valor"
                    onChange={(e) =>
                      setPix(e.target.value ? parseFloat(e.target.value) : "")
                    }
                    style={styles.input}
                  />
                </td>
              </tr>
              <tr>
                <td style={styles.tableCellHeader}>Dinheiro</td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={dinheiro || ""}
                    placeholder="Informe o Valor"
                    onChange={(e) =>
                      setDinheiro(
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    style={styles.input}
                  />
                </td>
              </tr>
              <tr>
                <td style={styles.tableCellHeader}>Débito</td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={debito || ""}
                    placeholder="Informe o Valor"
                    onChange={(e) =>
                      setDebito(
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    style={styles.input}
                  />
                </td>
              </tr>
              <tr>
                <td style={styles.tableCellHeader}>Crédito</td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={credito || ""}
                    placeholder="Informe o Valor"
                    onChange={(e) =>
                      setCredito(
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    style={styles.input}
                  />
                </td>
              </tr>
              <tr>
                <td style={styles.tableCellHeader}>A receber</td>
                <td style={styles.tableCell}>
                  <span style={styles.text}>{`R$ ${aReceber.toFixed(2)}`}</span>
                </td>
              </tr>
              <tr>
                <td style={styles.tableCellHeader}>Status Pgto</td>
                <td style={styles.tableCell}>
                  <span
                    style={{
                      ...styles.statusText,
                      color: statusPgto === "Pago" ? "green" : "red",
                    }}
                  >
                    {statusPgto}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={handleSave} style={styles.button}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Arial', sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#f7f7f7",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "24px",
    marginBottom: "20px",
    color: "#2c3e50",
    textAlign: "center",
    fontWeight: "bold",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  column: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableCellHeader: {
    padding: "10px",
    fontWeight: "bold",
    backgroundColor: "#e9e9e9",
    border: "1px solid #ddd",
  },
  tableCell: {
    padding: "10px",
    border: "1px solid #ddd",
  },
  select: {
    width: "95%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  input: {
    width: "90%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  button: {
    marginTop: "20px",
    width: "100%",
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default PacienteDetails;
