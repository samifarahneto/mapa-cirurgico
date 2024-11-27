import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoadData from "./LoadData";
import PacienteDetails from "./PacienteDetails";
import DataExtractor from "./DataExtractor";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DataExtractor />} />
        <Route path="/loaddata" element={<LoadData />} />
        <Route path="/paciente/:id" element={<PacienteDetails />} />
      </Routes>
    </Router>
  );
};

export default App;
