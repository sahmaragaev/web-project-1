document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('log-in-button');
    const alreadyLoggedIn = document.getElementById('already-logged-in');

    loginButton.addEventListener('click', async function () {
        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:3000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok && result.ok == true) {
                alert("Login successful!");
                window.location.href = "main.html";
            } else {
                throw new Error(
                    result.error || "Login failed. Please try again."
                );
            }
        } catch (error) {
            console.error("Error:", error.message);
            alert("Error: " + error.message);
        }
    });

    alreadyLoggedIn.addEventListener('click', async function () {
        window.location.href = "main.html";
    });
});
