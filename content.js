chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractData") {
        extractData(request, sendResponse);
        return true;
    }
    else if (request.action === "generateCoverLetter") {
        generateCoverLetter(request, sendResponse);
        return true;
    } else if (request.action === "getFormFields") {
        const formFields = getFormFields();
        sendResponse({ success: true, data: formFields });
        return true;
    } else if (request.action === "fillFormWithData") {
        fillFormWithData(request.filledData);
        sendResponse({ success: true });
        return true;
    } else if (request.action === "fillFormWithMappings") {
        fillFormWithMappings(request.mappings, request.userData);
        sendResponse({ success: true });
        return true;
    }

    return false;
});

async function generateCoverLetter(request, sendResponse) {
    (async () => {
        try {
            const prompt = `According to this user data: ${request.data}, company name: ${request.companyName}, job title: ${request.jobTitle}, write a cover letter please`;

            const payload = JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            });

            const response = await fetch(
                // You should put your API key here :)
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=API_KEY",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: payload
                }
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const generatedText = String(data.candidates[0].content.parts[0].text).trim();

            console.log("Generated Text:", generatedText);
            sendResponse({ success: true, data: generatedText });
        } catch (error) {
            console.error("Error generating cover letter:", error);
            sendResponse({
                success: false,
                error: error.message || "There was an issue on the server"
            });
        }
        return true;
    })();
}

async function extractData(request, sendResponse) {
    (async () => {
        try {
            // sendResponse({ success: true, data: { name: "John Doe", currentJobTitle: "Software Engineer", experiences: [], education: [], skills: [] } });
            const username = request.username;
            if (!username) {
                throw new Error("Username is required but not provided.");
            }

            const response = await fetch(`http://localhost:3000/api/profile/${username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const name = `${data.profile?.miniProfile?.firstName || "Unknown"} ${data.profile?.miniProfile?.lastName || ""}`.trim();
            const currentJobTitle = data.profile?.miniProfile?.occupation || "No job title";

            const experiences = (data.positionView.elements || []).map(position => {
                const companyName = position.companyName || "Unknown";
                const startDate = position.timePeriod?.startDate || {};
                const endDate = position.timePeriod?.endDate || "Present";

                let duration = "Unknown";
                if (startDate.year && endDate !== "Present") {
                    const start = new Date(startDate.year, (startDate.month || 1) - 1);
                    const end = new Date(endDate.year, (endDate.month || 1) - 1);
                    const diff = new Date(end - start);
                    duration = `${diff.getUTCFullYear() - 1970} years, ${diff.getUTCMonth()} months`;
                }

                return {
                    companyName,
                    startDate: startDate.year ? `${startDate.month || "1"}/${startDate.year}` : "Unknown",
                    endDate: endDate === "Present" ? "Present" : `${endDate.month || "1"}/${endDate.year}`,
                    duration
                };
            });

            const education = (data.educationView.elements || []).map(edu => ({
                schoolName: edu.schoolName || "Unknown School",
                degree: edu.degreeName || "No degree specified",
                fieldOfStudy: edu.fieldOfStudy || "No field specified"
            }));

            const skills = (data.skillView.elements || []).map(skill => skill.name || "Unknown Skill");
            const parsedData = { name, currentJobTitle, experiences, education, skills };

            console.log("Parsed Data:", parsedData);
            sendResponse({ success: true, data: parsedData });
            return true;
        } catch (error) {
            console.error("Error extracting data:", error.message);
            sendResponse({
                success: false,
                error: error.message || "There was an issue on the server"
            });
        }
    })();
}

function getFormFields() {
    const formElements = document.querySelectorAll("input, textarea, select");
    const formFields = [];

    formElements.forEach(element => {
        const name = element.name || element.id || '';
        if (name) {
            formFields.push({
                tagName: element.tagName.toLowerCase(),
                type: element.type,
                name: name,
                label: getLabelText(element),
            });
        }
    });

    return formFields;
}

function getLabelText(element) {
    let label = '';
    if (element.labels && element.labels.length > 0) {
        label = element.labels[0].innerText;
    }
    return label.trim();
}

function fillFormWithData(filledData) {
    for (let formFieldName in filledData) {
        const value = filledData[formFieldName];
        const field = document.querySelector(`[name="${formFieldName}"]`);
        if (field) {
            field.value = value;
            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
        }
    }
}

function fillFormWithMappings(mappings, userData) {
    for (let formFieldName in mappings) {
        const userDataKey = mappings[formFieldName];
        const value = userData[userDataKey];
        const field = document.querySelector(`[name="${formFieldName}"]`);
        if (field) {
            field.value = value;
            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
        }
    }
}
