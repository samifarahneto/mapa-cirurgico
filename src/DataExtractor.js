import React, { useState } from "react";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

const DataExtractor = () => {
  const [inputText, setInputText] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const navigate = useNavigate();

  const extractData = (text) => {
    const normalizedText = text.replace(/\bobs\b\.?:/gi, "OBS:").trim();
    const headerRegex =
      /Cirurgias\s*-\s*(.+?),\s*(.+?)\s*-\s*(\d{2}\/\d{2}\/\d{2}),\s*(.+?),\s*às\s*(.+?)\s*horas/;

    const headerMatch = headerRegex.exec(normalizedText);

    const responsible = headerMatch ? headerMatch[1].trim() : "Não informado";
    const specialization = headerMatch
      ? headerMatch[2].trim()
      : "Não informado";
    const date = headerMatch ? headerMatch[3].trim() : "Não informado";
    const dayOfWeek = headerMatch ? headerMatch[4].trim() : "Não informado";
    const time = headerMatch ? headerMatch[5].trim() : "Não informado";

    const patientRegex =
      /\d+ª\s*Paciente:\s*(.+?)\s*-\s*(Confirmado|Ciente)(?:\s*-\s*(.+?))?(?=\s*(DN|Data de nascimento|$))/gi;
    const convenioRegex = /Convênio:\s*(.+?)(?=\n|$)/i;
    const cirurgiaRegex = /Cirurgia:\s*(.+?)(?=\n|$)/i;
    const lioRegex = /Lio:\s*(.+?)(?=\n|$)/i;
    const obsRegex = /OBS:\s*(.+?)(?=\n|$)/i;

    const patients = [];
    const patientMatches = Array.from(normalizedText.matchAll(patientRegex));

    patientMatches.forEach((match, index) => {
      const patientStartIndex = match.index;
      const nextPatientIndex =
        patientMatches[index + 1]?.index || normalizedText.length;

      const patientText = normalizedText.slice(
        patientStartIndex,
        nextPatientIndex
      );

      const name = match[1]?.trim() || "Não informado";
      const payment = match[3]?.trim() || "Sem informação";

      const convenioMatch = convenioRegex.exec(patientText);
      const cirurgiaMatch = cirurgiaRegex.exec(patientText);
      const lioMatch = lioRegex.exec(patientText);
      const obsMatch = obsRegex.exec(patientText);

      // Mover obs2Regex para dentro do loop
      const obs2Regex =
        /(CONFIRMADO|CIENTE)\s*-\s*(.*?)(?=\s*(DN|Data de nascimento))/i;
      const obs2Match = obs2Regex.exec(patientText);
      const obs2 = obs2Match ? obs2Match[2].trim() : "Sem informação";

      const convenio = convenioMatch
        ? convenioMatch[1].trim()
        : "Sem informação";
      const cirurgia = cirurgiaMatch
        ? cirurgiaMatch[1].trim()
        : "Sem informação";
      const lio = lioMatch ? lioMatch[1].trim() : "Sem informação";
      const obs = obsMatch ? obsMatch[1].trim() : "Sem informação";

      patients.push({ name, payment, convenio, cirurgia, lio, obs, obs2 });
    });

    return { responsible, specialization, date, dayOfWeek, time, patients };
  };
  const handleReset = () => {
    setInputText(""); // Reseta o texto de entrada
    setExtractedData(null); // Reseta os dados extraídos
  };

  const handleGenerateData = () => {
    console.log("Texto inserido:", JSON.stringify(inputText)); // Log do texto inserido
    const data = extractData(inputText);
    console.log("Dados extraídos:", data); // Log dos dados extraídos
    setExtractedData(data);
  };

  const handleSave = async () => {
    if (!extractedData || !extractedData.patients.length) {
      alert("Nenhum dado para salvar.");
      return;
    }

    const { responsible, specialization, date, dayOfWeek, time, patients } =
      extractedData;

    try {
      // Gera um UID único para a cirurgia
      const surgeryDocRef = doc(collection(db, "cirurgias"));
      const surgeryId = surgeryDocRef.id;

      // Salva os dados principais da cirurgia
      await setDoc(surgeryDocRef, {
        responsible,
        specialization,
        date,
        dayOfWeek,
        time,
      });

      // Adiciona pacientes com IDs individuais na subcoleção
      const patientsCollectionRef = collection(surgeryDocRef, "pacientes");

      for (const patient of patients) {
        await addDoc(patientsCollectionRef, patient);
      }

      alert(`Dados salvos com sucesso! ID da cirurgia: ${surgeryId}`);
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Extrator de Dados</h1>
      <textarea
        rows="10"
        cols="80"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Cole o texto aqui..."
        style={styles.textarea}
      ></textarea>
      <div style={styles.buttonContainer}>
        <button onClick={handleGenerateData} style={styles.button}>
          Extrair Dados
        </button>
        <button onClick={handleSave} style={styles.button}>
          Salvar
        </button>
        <button onClick={() => navigate("/loaddata")} style={styles.mapButton}>
          Mapas Cirúrgicos
        </button>
        <button onClick={() => handleReset()} style={styles.resetButton}>
          Resetar
        </button>
      </div>

      {extractedData && (
        <div style={styles.dataContainer}>
          <h3 style={styles.subHeader}>Dados Extraídos</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Especialidade</th>
                <th>Data</th>
                <th>Dia da Semana</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{extractedData.responsible}</td>
                <td>{extractedData.specialization}</td>
                <td>{extractedData.date}</td>
                <td>{extractedData.dayOfWeek}</td>
                <td>{extractedData.time}</td>
              </tr>
            </tbody>
          </table>
          <h3 style={styles.subHeader}>Pacientes</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Convênio</th>
                <th>Cirurgia</th>
                <th>Lio</th>
                <th>Obs</th>
                <th>Obs 2</th>
              </tr>
            </thead>
            <tbody>
              {extractedData.patients.map((patient, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{patient.name}</td>
                  <td>{patient.convenio}</td>
                  <td>{patient.cirurgia}</td>
                  <td>{patient.lio}</td>
                  <td>{patient.obs}</td>
                  <td>{patient.obs2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Arial', sans-serif",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    color: "#2c3e50",
    fontSize: "28px",
    marginBottom: "20px",
    textAlign: "center",
  },
  textarea: {
    width: "90%",
    maxWidth: "600px",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
    resize: "vertical",
  },
  title: {
    fontSize: "28px",
    color: "#2c3e50",
    fontWeight: "bold",
    flex: 1, // O título ocupa todo o espaço restante
    textAlign: "center", // Centraliza o título
  },
  buttonContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  button: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  dataContainer: {
    marginTop: "30px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "800px",
  },
  mapButton: {
    backgroundColor: "green",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  resetButton: {
    backgroundColor: "red",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default DataExtractor;
