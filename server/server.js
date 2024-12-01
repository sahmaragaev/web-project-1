import express from "express";
import cors from "cors";
import ClientManager from "./client_manager.js";

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

let email = null;
let password = null;

app.get("/api/auth-status", async (req, res) => {
    try {
        if (!email || !password) {
            return res.status(401).json({ authenticated: false, message: "Not logged in." });
        }

        const client = await ClientManager.getClient({ email, password });
        await client.ensureAuthenticated();

        res.json({ authenticated: true });
    } catch (error) {
        console.error("Error checking auth status:", error.message);
        res.status(500).json({ authenticated: false, error: error.message });
    }
});


app.post("/api/login", async (req, res) => {
    try {
        const { email: reqEmail, password: reqPassword } = req.body;
        email = reqEmail;
        password = reqPassword;

        const client = await ClientManager.getClient({ email, password });
        res.json({ message: "Login successful", cookies: client.cookies });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ error: error.message });
    }
});


app.get("/api/profile/:publicId", async (req, res) => {
    const publicId = req.params.publicId;

    try {
        if (!email || !password) {
            throw new Error("User is not logged in. Please log in first.");
        }

        const client = await ClientManager.getClient({ email, password });
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
