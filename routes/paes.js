const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// GET /api/paes/diagnostic
router.get('/diagnostic-m1', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/paes_m1_diagnostic.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const questions = JSON.parse(data);

        res.status(200).json({
            ok: true,
            questions
        });
    } catch (error) {
        console.error('Error reading diagnostic questions:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener la prueba de diagnóstico'
        });
    }
});

// POST /api/paes/submit-diagnostic
router.post('/submit-diagnostic', (req, res) => {
    const results = req.body; // Aquí recibes lo que enviamos desde el frontend

    // 0. Calcular reporte de respuestas malas por topic
    const topicStats = {};

    // Suponemos que el frontend envía 'incorrectQuestions' con el campo 'topic'
    // O podemos reconstruirlo si envía todas las respuestas. 
    // Basado en el archivo que vi, el frontend ya calcula 'incorrectQuestions'.

    if (results.incorrectQuestions && Array.isArray(results.incorrectQuestions)) {
        // Primero contamos el total de preguntas por topic (basado en el test original)
        // O mejor, el frontend nos envía el total por topic o lo inferimos.
        // Vamos a usar los datos del JSON original para saber cuántas preguntas hay de cada tema.
        try {
            const questionsPath = path.join(__dirname, '../data/paes_m1_diagnostic.json');
            const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

            const totalByTopic = {};
            questionsData.forEach(q => {
                totalByTopic[q.topic] = (totalByTopic[q.topic] || 0) + 1;
            });

            const incorrectByTopic = {};
            results.incorrectQuestions.forEach(q => {
                incorrectByTopic[q.topic] = (incorrectByTopic[q.topic] || 0) + 1;
            });

            Object.keys(totalByTopic).forEach(topic => {
                const total = totalByTopic[topic];
                const incorrect = incorrectByTopic[topic] || 0;
                topicStats[topic] = {
                    total,
                    incorrect,
                    wrongPercentage: Math.round((incorrect / total) * 100)
                };
            });

        } catch (err) {
            console.error('Error calculating topic stats:', err);
        }
    }

    // 1. Definir la carpeta donde se guardarán los resultados
    const folderPath = path.join(__dirname, '../results');

    // 2. Crear la carpeta si no existe
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    // 3. Crear un nombre de archivo único (por ejemplo: user_id + timestamp)
    const fileName = `diagnostic_${results.userId || 'anon'}_${Date.now()}.json`;
    const filePath = path.join(folderPath, fileName);
    // 4. Guardar los datos en el archivo JSON
    fs.writeFile(filePath, JSON.stringify(results, null, 2), (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).json({ ok: false, message: 'Error al procesar el diagnóstico' });
        }
        console.log(`Archivo guardado con éxito: ${fileName}`);
        res.json({
            ok: true,
            message: 'Resultados guardados correctamente',
            report: topicStats
        });
    });
});

module.exports = router;
