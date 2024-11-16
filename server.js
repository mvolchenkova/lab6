const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const builder = require("xmlbuilder");
const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const readData = (filename) => {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
};

const writeData = (filename, data) => {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// GET-сервис для получения вариантов голосования
app.get("/variants", (req, res) => {
    const variants = readData("variants.json");
    res.json(variants);
});

// POST-сервис для голосования
app.post("/vote", (req, res) => {
    const { variantId } = req.body;

    if (!variantId) {
        return res.status(400).json({ error: "Выберите вариант для голосования." });
    }

    const stats = readData("stats.json");
    stats[variantId].votes += 1;
    writeData("stats.json", stats);
    res.json(stats);
});

// GET-сервис для получения статистики голосования
app.get("/stats", (req, res) => {
    const stats = readData("stats.json");
    res.json(stats);
});
//добавить библиотеку для xml
// Сервис для получения данных в формате XML/HTML/JSON в зависимости от заголовка Accept
app.get("/data", (req, res) => {
    const stats = readData("stats.json");
    const acceptHeader = req.headers.accept;

    if (acceptHeader.includes("application/json")) {
        return res.json(stats);
    } else if (acceptHeader.includes("text/html")) {
        res.send(`<html><body><pre>${JSON.stringify(stats, null, 2)}</pre></body></html>`);
    } else if (acceptHeader.includes("application/xml")) {
        const xml = builder.create('stats')
            .att('version', '1.0') 
            .ele('variants'); 

        for (const key in stats) {
            xml.ele('variant', { id: key })
                .ele('votes', stats[key].votes).up() 
                .up(); 
        }
        
        res.type('application/xml').send(xml.end({ pretty: true })); 
    } else {
        res.status(406).send('Not Acceptable');
    }
});


//КОД ДЛЯ УДАЛЕНИЯ ГОЛОСА (СНАЧАЛА ЗАПУСК В ОТЛАДКЕ)
// fetch('http://localhost:5000/vote/1', {
// method: 'DELETE'
// })
// .then(response => {
// if (response.ok) {
// return response.json();
// }
// throw new Error('Network response was not ok.');
// })
// .then(data => console.log(data))
// .catch(error => console.error('There was a problem with your fetch operation:', error));


// DELETE-сервис для отмены голосования
app.delete("/vote/:variantId", (req, res) => {
    const variantId = req.params.variantId;

    const stats = readData("stats.json");

    if (!stats[variantId]) {
        return res.status(404).json({ error: "Вариант не найден." });
    }

    if (stats[variantId].votes > 0) {
        stats[variantId].votes -= 1;
        writeData("stats.json", stats);
        res.json({ message: "Голос отменен.", stats });
    } else {
        res.status(400).json({ error: "Нет голосов для отмены." });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});