const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
}

// Helper functions
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// API Endpoints
app.get('/api/students', (req, res) => {
    try {
        const students = readData();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Error reading student data' });
    }
});

app.post('/api/students', (req, res) => {
    try {
        const students = readData();
        const newStudent = {
            id: students.length ? Math.max(...students.map(s => s.id)) + 1 : 1,
            ...req.body,
            age: parseInt(req.body.age)
        };
        students.push(newStudent);
        saveData(students);
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ error: 'Invalid student data' });
    }
});

app.put('/api/students/:id', (req, res) => {
    try {
        const students = readData();
        const index = students.findIndex(s => s.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Student not found' });
        
        students[index] = { 
            ...students[index], 
            ...req.body,
            id: parseInt(req.params.id),
            age: parseInt(req.body.age)
        };
        saveData(students);
        res.json(students[index]);
    } catch (error) {
        res.status(400).json({ error: 'Invalid update data' });
    }
});

app.delete('/api/students/:id', (req, res) => {
    const students = readData();
    const filtered = students.filter(s => s.id !== parseInt(req.params.id));
    if (students.length === filtered.length) {
        return res.status(404).json({ error: 'Student not found' });
    }
    saveData(filtered);
    res.json({ message: 'Student deleted successfully' });
});

app.get('/api/students/export', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE);
        res.setHeader('Content-Disposition', 'attachment; filename=students.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        res.status(500).json({ error: 'Error exporting data' });
    }
});

app.post('/api/students/import', (req, res) => {
    try {
        if (!Array.isArray(req.body)) throw new Error('Invalid data format');
        saveData(req.body);
        res.json({ message: 'Data imported successfully', count: req.body.length });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});