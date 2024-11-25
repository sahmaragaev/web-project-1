chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "extractData") {
        try {
            const nameElement = document.querySelector('h1.inline.t-24.v-align-middle.break-words');
            const name = nameElement ? nameElement.innerText.trim() : null;

            const jobTitleElement = document.querySelector('.text-body-medium.break-words');
            const jobTitle = jobTitleElement ? jobTitleElement.innerHTML.trim() : null;

            let education = [];
            const educationElements = document.querySelectorAll('.pvs-entity.pvs-entity--padded');
            educationElements.forEach((eduElement) => {
                const institution = eduElement.querySelector('.t-bold span')?.innerText?.trim();
                const degree = eduElement.querySelector('.t-14 span')?.innerText?.trim();
                if (institution) {
                    education.push({ institution, degree });
                }
            });

            let skills = [];
            const skillsElements = document.querySelectorAll('.pv-skill-category-entity__name-text');
            skillsElements.forEach((skillElement) => {
                const skillName = skillElement.innerText.trim();
                if (skillName) {
                    skills.push(skillName);
                }
            });

            const data = {
                name,
                jobTitle,
                education,
                skills,
            };

            sendResponse({ success: true, data });
        } catch (error) {
            console.error('Error extracting data:', error);
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === "generateCoverLetter") {
        try {
            const prompt = `According to this user data: ${request.data}, write a cover letter please`;

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
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY",
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

            const generatedText = data?.contents?.[0]?.parts?.[0]?.text;

            sendResponse({ success: true, data: generatedText });
        } catch (error) {
            console.error("Error generating cover letter:", error);
            sendResponse({
                success: false,
                error: error.message || "There was an issue on the server"
            });
        }
    }

    return true;
});