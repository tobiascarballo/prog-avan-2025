const express = require("express");
const sequelize = require("./config/database");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.get("/users", async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/users", async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) return res.status(400).json({ error: "Nombre y email son requeridos" });
        const newUser = await User.create({ name, email });
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        await user.destroy();
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sincronización DB + levantar servidor
sequelize.sync({ force: false })
    .then(() => {
        console.log("✅ Conectado a PostgreSQL y tablas sincronizadas");
        app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
    })
    .catch(err => console.error("❌ Error de conexión:", err));
