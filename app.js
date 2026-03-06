document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");

    // Fetch the alumni data from the JSON file
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            data.forEach(alumnus => {
                // Create a card for each alumnus
                const card = document.createElement("div");
                card.classList.add("alumni-card");

                // Inject the new data fields into the HTML
                card.innerHTML = `
                    <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                    <h2>${alumnus.name}</h2>
                    <p><strong>University:</strong> ${alumnus.university}</p>
                    <p><strong>Department:</strong> ${alumnus.department}</p>
                    <p><strong>Admission Year:</strong> ${alumnus.admissionYear}</p>
                    <p><strong>SSC Batch:</strong> ${alumnus.sscBatch}</p>
                `;

                container.appendChild(card);
            });
        })
        .catch(error => console.error("Error loading alumni data:", error));
});
