import express from "express";
import cors from "cors";
import LinkedInClient from "./client.js";

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://127.0.0.1:5500" }));

app.use(express.json());

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const client = new LinkedInClient({ email, password, debug: true });

        await client.ensureAuthenticated();

        res.json({ message: "Login successful", cookies: client.cookies });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ error: error.message });
    }
});


app.get("/api/profile/:publicId", async (req, res) => {
    const publicId = req.params.publicId;
    const { email, password } = req.query;
    try {
        const client = new LinkedInClient({ email, password, debug: true });

        const profile = await client.getProfile(publicId);
        res.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
