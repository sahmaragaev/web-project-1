document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("usernameInput");
    const jsonDataInput = document.getElementById("jsonData");
    const scrapeButton = document.getElementById("scrapeButton");
    const saveButton = document.getElementById("saveButton");
    const loadButton = document.getElementById("loadButton");
    const clearButton = document.getElementById("clearButton");
    const exportDataButton = document.getElementById("exportDataButton");
    const exportToMailButton = document.getElementById("exportMailButton");
    const fillButton = document.getElementById("fillButton");
    const dashboardButton = document.getElementById("dashboardButton");
    const managePresetsButton = document.getElementById("managePresetsButton");
    const closePresetManagementButton = document.getElementById("closePresetManagementButton");
    const presetList = document.getElementById("presetList");
    const mappingContainer = document.getElementById("mapping-container");
    const mappingForm = document.getElementById("mapping-form");
    const applyMappingButton = document.getElementById("applyMappingButton");
    const dashboardContainer = document.getElementById("dashboard-container");
    const closeDashboardButton = document.getElementById("closeDashboardButton");
    const generateCoverLetterButton = document.getElementById("generateCoverLetterButton");

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

    generateCoverLetterButton.addEventListener("click", function () {   
        const companyName = prompt("Enter the Company Name:", "");
        const jobTitle = prompt("Enter the Job Title:", "");

        const jsonData = jsonDataInput.value.trim();
        if (!jsonData) {
            alert("Please ensure you have some data loaded.");
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    action: "generateCoverLetter",
                    data: jsonData,
                    companyName: companyName,
                    jobTitle: jobTitle
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        alert("Error: " + chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && response.success) {
                        const generatedText = response.data;
                        navigator.clipboard.writeText(generatedText);
                        alert("Generated Cover Letter:\n\n" + generatedText);
                    } else {
                        alert("Error generating cover letter: " + (response.error || "Unknown error"));
                    }
                }
            );
        });
    });

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

    fillButton.addEventListener("click", function () {
        const jsonData = jsonDataInput.value.trim();
        if (!jsonData) {
            alert("Please ensure you have some data loaded.");
            return;
        }
        let userData;
        try {
            userData = JSON.parse(jsonData);
        } catch (error) {
            alert("Invalid JSON data. Please correct it.");
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);
            const presetsKey = `formPresets_${url.hostname}`;
            chrome.storage.local.get(presetsKey, (result) => {
                const presets = result[presetsKey];
                if (presets && Object.keys(presets).length > 0) {
                    const presetNames = Object.keys(presets);
                    const presetOptions = presetNames.map((name, index) => `${index + 1}. ${name}`).join('\n');
                    const choice = prompt(`Select a preset to use:\n${presetOptions}\nEnter the number or leave blank to skip:`);
                    if (choice) {
                        const index = parseInt(choice) - 1;
                        if (index >= 0 && index < presetNames.length) {
                            const presetName = presetNames[index];
                            const filledData = presets[presetName];
                            chrome.tabs.sendMessage(
                                tabs[0].id,
                                {
                                    action: "fillFormWithData",
                                    filledData: filledData
                                },
                                (response) => {
                                    if (response && response.success) {
                                        alert("Form filled using preset!");
                                    } else {
                                        alert("Error filling the form.");
                                    }
                                }
                            );
                            return;
                        }
                    }
                }
                alert("No preset selected. Proceeding with new mapping.");
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "getFormFields" },
                    (response) => {
                        if (response && response.success) {
                            showMappingUI(response.data, userData, `fieldMappings_${url.hostname}`, tabs[0].id);
                        } else {
                            alert("Error getting form fields.");
                        }
                    }
                );
            });
        });
    });

    function showMappingUI(formFields, userData, mappingKey, tabId) {
        document.getElementById('profile-data').style.display = 'none';
        mappingContainer.style.display = 'block';
        mappingForm.innerHTML = '';
        formFields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = `Map "${field.label || field.name}" to: `;
            const select = document.createElement('select');
            select.name = field.name;
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '--- Select Data Field ---';
            select.appendChild(option);
            for (let key in userData) {
                const userOption = document.createElement('option');
                userOption.value = key;
                userOption.textContent = key;
                select.appendChild(userOption);
            }
            mappingForm.appendChild(label);
            mappingForm.appendChild(select);
            mappingForm.appendChild(document.createElement('br'));
        });
        applyMappingButton.onclick = function () {
            const mappings = {};
            const mappingFormElements = mappingForm.elements;
            for (let i = 0; i < mappingFormElements.length; i++) {
                const element = mappingFormElements[i];
                if (element.name && element.value) {
                    mappings[element.name] = element.value;
                }
            }
            chrome.storage.local.set({ [mappingKey]: mappings }, () => {
                chrome.tabs.sendMessage(
                    tabId,
                    {
                        action: "fillFormWithMappings",
                        mappings: mappings,
                        userData: userData
                    },
                    (response) => {
                        if (response && response.success) {
                            alert("Form filled successfully!");
                            const companyName = prompt("Enter the Company Name:", "");
                            const jobTitle = prompt("Enter the Job Title:", "");
                            const applicationData = {
                                company: companyName || "Unknown Company",
                                jobTitle: jobTitle || "Unknown Job Title",
                                dateApplied: new Date().toISOString(),
                                status: "Applied",
                            };
                            chrome.storage.local.get('applications', (result) => {
                                const applications = result.applications || [];
                                applications.push(applicationData);
                                chrome.storage.local.set({ applications: applications }, () => {
                                    alert("Application saved in your dashboard!");
                                });
                            });
                            if (confirm("Do you want to save this filled data for future use?")) {
                                const presetName = prompt("Enter a name for this preset:", "My Preset");
                                if (presetName) {
                                    const filledData = {};
                                    for (let formFieldName in mappings) {
                                        const userDataKey = mappings[formFieldName];
                                        const value = userData[userDataKey];
                                        filledData[formFieldName] = value;
                                    }
                                    const url = new URL(window.location.href);
                                    const presetsKey = `formPresets_${url.hostname}`;
                                    chrome.storage.local.get(presetsKey, (result) => {
                                        const presets = result[presetsKey] || {};
                                        presets[presetName] = filledData;
                                        chrome.storage.local.set({ [presetsKey]: presets }, () => {
                                            alert("Preset saved successfully!");
                                        });
                                    });
                                }
                            }
                        } else {
                            alert("Error filling the form.");
                        }
                        mappingContainer.style.display = 'none';
                        document.getElementById('profile-data').style.display = 'block';
                    }
                );
            });
        };
    }

    managePresetsButton.addEventListener("click", function () {
        document.getElementById('profile-data').style.display = 'none';
        const presetManagement = document.getElementById('preset-management');
        presetManagement.style.display = 'block';
        const url = new URL(window.location.href);
        const presetsKey = `formPresets_${url.hostname}`;
        chrome.storage.local.get(presetsKey, (result) => {
            const presets = result[presetsKey] || {};
            presetList.innerHTML = '';
            Object.keys(presets).forEach(presetName => {
                const li = document.createElement('li');
                li.textContent = presetName;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '10px';
                deleteButton.onclick = function () {
                    if (confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
                        delete presets[presetName];
                        chrome.storage.local.set({ [presetsKey]: presets }, () => {
                            alert('Preset deleted.');
                            li.remove();
                        });
                    }
                };
                li.appendChild(deleteButton);
                presetList.appendChild(li);
            });
        });
    });

    closePresetManagementButton.addEventListener("click", function () {
        document.getElementById('preset-management').style.display = 'none';
        document.getElementById('profile-data').style.display = 'block';
    });

    dashboardButton.addEventListener("click", function () {
        document.getElementById('profile-data').style.display = 'none';
        dashboardContainer.style.display = 'block';
        const applicationTableBody = document.querySelector('#applicationTable tbody');
        applicationTableBody.innerHTML = '';
        chrome.storage.local.get('applications', (result) => {
            const applications = result.applications || [];
            applications.forEach(app => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${app.company}</td>
                    <td>${app.jobTitle}</td>
                    <td>${new Date(app.dateApplied).toLocaleDateString()}</td>
                    <td>${app.status}</td>
                `;
                applicationTableBody.appendChild(row);
            });
        });
    });

    closeDashboardButton.addEventListener("click", function () {
        dashboardContainer.style.display = 'none';
        document.getElementById('profile-data').style.display = 'block';
    });
});