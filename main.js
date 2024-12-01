document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("usernameInput");
    const jsonDataInput = document.getElementById("jsonData");

    const scrapeButton = document.getElementById("scrapeButton");
    const saveButton = document.getElementById("saveButton");
    const loadButton = document.getElementById("loadButton");
    const clearButton = document.getElementById("clearButton");
    const exportDataButton = document.getElementById("exportDataButton");
    const exportToMailButton = document.getElementById("exportMailButton");

    // Scrape Data
    scrapeButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0]) {
                alert("No active tab found. Please try again.");
                return;
            }

            const username = usernameInput.value.trim();
            if (!username) {
                alert("Please enter a username.");
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "extractData", username: username },
                (response) => {
                    if (!response || !response.success) {
                        alert("Error extracting data. Please ensure the page is correct.");
                        return;
                    }

                    const extractedData = response.data;
                    const jsonData = {
                        username: username,
                        ...extractedData,
                    };
                    jsonDataInput.value = JSON.stringify(jsonData, null, 2);
                }
            );
        });
    });

    // Save Profile
    saveButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        const jsonData = jsonDataInput.value.trim();

        if (!username || !jsonData) {
            alert("Username and JSON data are required.");
            return;
        }

        try {
            const parsedData = JSON.parse(jsonData);
            chrome.storage.local.set({ [username]: parsedData }, () => {
                alert(`Profile saved for ${username}`);
            });
        } catch (error) {
            alert("Invalid JSON data. Please correct it.");
        }
    });

    // Load Profile
    loadButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (!username) {
            alert("Please enter a username to load.");
            return;
        }

        chrome.storage.local.get(username, (result) => {
            const data = result[username];
            if (data) {
                jsonDataInput.value = JSON.stringify(data, null, 2);
                alert(`Profile loaded for ${username}`);
            } else {
                alert("No profile found for this username.");
            }
        });
    });

    // Clear Profile
    clearButton.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (!username) {
            alert("Please enter a username to clear.");
            return;
        }

        chrome.storage.local.remove(username, () => {
            usernameInput.value = "";
            jsonDataInput.value = "";
            alert(`Profile cleared for ${username}`);
        });
    });

    // Export Data as JSON
    exportDataButton.addEventListener("click", function () {
        chrome.storage.local.get(null, (data) => {
            if (data) {
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ProfileData.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert("Data exported successfully!");
            } else {
                alert("No data found to export.");
            }
        });
    });

    // Export Data as Mail
    exportToMailButton.addEventListener("click", function () {
        chrome.storage.local.get(null, (data) => {
            if (data) {
                const jsonString = JSON.stringify(data, null, 2);
                const mailtoLink = `mailto:?subject=Profile Data&body=${encodeURIComponent(jsonString)}`;
                window.open(mailtoLink);
            } else {
                alert("No data found to export.");
            }
        });
    });
});