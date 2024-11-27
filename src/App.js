import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoadData from "./LoadData";
import PacienteDetails from "./PacienteDetails";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadData />} />
        <Route path="/paciente/:id" element={<PacienteDetails />} />
      </Routes>
    </Router>
  );
};

export default App;
