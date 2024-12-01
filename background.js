chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {
            tabId: tab.id,
            files: ['content.js'],
        },
        function: () => {
            chrome.runtime.sendMessage({ action: "extractData", username: 'sahmaragaev' }, (response) => {
                if (response.success) {
                    console.log('Data extracted:', response.data);
                } else {
                    console.error('Error extracting data:', response.error);
                }
            });
        }
    });
});