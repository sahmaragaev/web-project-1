document.addEventListener('DOMContentLoaded', function () {
    const usernameInput = document.getElementById('usernameInput');
    const nameInput = document.getElementById('name');
    const jobTitleInput = document.getElementById('jobTitle');
    const educationInput = document.getElementById('education');
    const skillsInput = document.getElementById('skills');
    const experiencesInput = document.getElementById('experiences');

    const scrapeButton = document.getElementById('scrapeButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const clearButton = document.getElementById('clearButton');
    const generateCoverLetterButton = document.getElementById('generateCoverLetterButton');
    const exportDataButton = document.getElementById('exportDataButton');
    const sendDataButton = document.getElementById('sendDataButton');

    // Scrape data
    scrapeButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0]) {
                console.error('No active tab found');
                alert('Unable to find the active tab. Please try again.');
                return;
            }

            const username = usernameInput.value.trim();
            if (!username) {
                alert('Please enter a username');
                return;
            }

            const timeoutId = setTimeout(() => {
                alert('Request timed out. Please check your connection and try again.');
            }, 10000);

            try {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'extractData',
                    username: username
                }, (response) => {
                    clearTimeout(timeoutId);

                    // if (chrome.runtime.lastError) {
                    //     console.error('Runtime error:', chrome.runtime.lastError);
                    //     alert(`Error: ${chrome.runtime.lastError.message}`);
                    //     return;
                    // }

                    if (!response) {
                        console.error('No response received');
                        alert('No response from the webpage. Please ensure you are on the correct page.');
                        return;
                    }

                    if (response.success) {
                        const { name, currentJobTitle, education, skills, experiences } = response.data;

                        nameInput.value = name || 'No name found';
                        jobTitleInput.value = currentJobTitle || 'No job title found';

                        if (education && education.length > 0) {
                            educationInput.value = JSON.stringify(education);
                            // educationInput.value = education
                            //     .map(edu => `${edu.schoolName} (${edu.degree}, ${edu.fieldOfStudy})`)
                            //     .join('\n');
                        } else {
                            educationInput.value = 'No education details found';
                        }

                        if (skills && skills.length > 0) {
                            skillsInput.value = skills.join(', ');
                        } else {
                            skillsInput.value = 'No skills found';
                        }

                        if (experiences && experiences.length > 0) {
                            experiencesInput.value = JSON.stringify(experiences);
                            // experiencesInput.value = experiences
                            //     .map(exp => `${exp.companyName}: ${exp.startDate} - ${exp.endDate} (${exp.duration})`)
                            //     .join('\n');
                        } else {
                            experiencesInput.value = 'No experiences found';
                        }
                    }
                    else {
                        console.error('Extraction failed:', response.error);
                        alert(`Error: ${response.error || 'Unknown error occurred'}`);
                    }

                });
            } catch (error) {
                console.error('Error sending message:', error);
                alert(`Error sending request: ${error.message}`);
            }
        });
    });

    // Save Profile
    saveButton.addEventListener('click', function () {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Username is required.');
            return;
        }

        const data = {
            name: nameInput.value.trim(),
            jobTitle: jobTitleInput.value.trim(),
            education: educationInput.value.trim(),
            skills: skillsInput.value.trim(),
        };

        chrome.storage.local.set({ [username]: data }, () => {
            alert(`Profile saved for ${username}`);
        });
    });

    // Load Profile
    loadButton.addEventListener('click', function () {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username to load.');
            return;
        }

        chrome.storage.local.get(username, (result) => {
            const data = result[username];
            if (data) {
                nameInput.value = data.name || '';
                jobTitleInput.value = data.jobTitle || '';
                educationInput.value = data.education || '';
                skillsInput.value = data.education || '';
                alert(`Profile loaded for ${username}`);
            } else {
                alert('No profile found for this username.');
            }
        });
    });

    // Clear Profile
    clearButton.addEventListener('click', function () {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username to clear.');
            return;
        }

        chrome.storage.local.remove(username, () => {
            alert(`Profile cleared for ${username}`);
        });
    });

    // Generate Cover Letter
    generateCoverLetterButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const data = {
                name: nameInput.value.trim(),
                jobTitle: jobTitleInput.value.trim(),
                education: JSON.parse(educationInput.value || '[]'),
                skills: JSON.parse(skillsInput.value || '[]'),
            };

            chrome.tabs.sendMessage(tabs[0].id, { action: 'generateCoverLetter', data }, function (response) {
                if (response && response.success) {
                    const generatedLetter = response.data;
                    const blob = new Blob([generatedLetter], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "CoverLetter.txt";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    alert(`Error generating cover letter: ${response?.error || 'Unknown error'}`);
                }
            });
        });
    });

    // Export data as JSON
    exportDataButton.addEventListener('click', function () {
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

    // Send data via email
    sendDataButton.addEventListener('click', function () {
        chrome.storage.local.get(null, (data) => {
            if (data) {
                const jsonString = JSON.stringify(data, null, 2);
                const emailBody = encodeURIComponent(jsonString);
                const mailToLink = `mailto:?subject=Exported Profile Data&body=${emailBody}`;
                window.location.href = mailToLink;
            } else {
                alert("No data found to send.");
            }
        });
    });

});
