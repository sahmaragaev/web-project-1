chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "extractData") {
        try {
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

            const profile = data.profile;
            const name = `${profile.miniProfile.firstName} ${profile.miniProfile.lastName}`;
            const currentJobTitle = profile.miniProfile.occupation;

            const experiences = data.positionView.elements.map(position => {
                const companyName = position.companyName;
                const startDate = position.timePeriod.startDate;
                const endDate = position.timePeriod.endDate || "Present";

                let duration = "Unknown";
                if (startDate && endDate !== "Present") {
                    const start = new Date(startDate.year, startDate.month - 1);
                    const end = new Date(endDate.year, endDate.month - 1);
                    const diff = new Date(end - start);
                    duration = `${diff.getUTCFullYear() - 1970} years, ${diff.getUTCMonth()} months`;
                }

                return {
                    companyName,
                    startDate: `${startDate.month}/${startDate.year}`,
                    endDate: endDate === "Present" ? "Present" : `${endDate.month}/${endDate.year}`,
                    duration
                };
            });

            const education = data.educationView.elements.map(edu => {
                const schoolName = edu.schoolName;
                const degree = edu.degreeName || "No degree specified";
                const fieldOfStudy = edu.fieldOfStudy || "No field specified";
                return { schoolName, degree, fieldOfStudy };
            });

            const skills = data.skillView.elements.map(skill => skill.name);

            const parsedData = {
                name,
                currentJobTitle,
                experiences,
                education,
                skills
            };

            sendResponse({ success: true, data: parsedData });
        } catch (error) {
            console.error("Error extracting data:", error);
            sendResponse({
                success: false,
                error: error.message || "There was an issue on the server"
            });
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