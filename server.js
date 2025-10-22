
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = 'patients.json';

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading patients:', error);
    res.status(500).json({ error: 'Failed to read patients' });
  }
});

// Add new patient
app.post('/api/patients', async (req, res) => {
  try {
    const { room, name, complaint, treatments, customFields, ...otherFields } = req.body;
    
    if (!room || !name || !complaint || !treatments) {
      return res.status(400).json({ error: 'All required fields (room, name, complaint, treatments) must be provided' });
    }

    const data = await fs.readFile(DATA_FILE, 'utf8');
    const patients = JSON.parse(data);
    
    const newPatient = { room, name, complaint, treatments, id: Date.now() };
    if (customFields && Object.keys(customFields).length > 0) {
      newPatient.customFields = customFields;
    }
    patients.push(newPatient);
    
    await fs.writeFile(DATA_FILE, JSON.stringify(patients, null, 2));
    res.json(newPatient);
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).json({ error: 'Failed to add patient' });
  }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const patients = JSON.parse(data);
    
    const filteredPatients = patients.filter(p => p.id !== id);
    
    if (filteredPatients.length === patients.length) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(filteredPatients, null, 2));
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { room, name, complaint, treatments, customFields, ...otherFields } = req.body;
    
    if (!room || !name || !complaint || !treatments) {
      return res.status(400).json({ error: 'All required fields (room, name, complaint, treatments) must be provided' });
    }

    const data = await fs.readFile(DATA_FILE, 'utf8');
    const patients = JSON.parse(data);
    
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const updatedPatient = { ...patients[patientIndex], room, name, complaint, treatments };
    if (customFields && Object.keys(customFields).length > 0) {
      updatedPatient.customFields = customFields;
    } else {
      delete updatedPatient.customFields; // Remove custom fields if none provided
    }
    
    patients[patientIndex] = updatedPatient;
    
    await fs.writeFile(DATA_FILE, JSON.stringify(patients, null, 2));
    res.json(patients[patientIndex]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

initializeDataFile().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
