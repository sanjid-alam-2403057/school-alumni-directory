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

                card.innerHTML = `
                    <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                    <h2>${alumnus.name}</h2>
                    <p><strong>Class of:</strong> ${alumnus.graduationYear}</p>
                    <p>${alumnus.profession}</p>
                `;

                container.appendChild(card);
            });
        })
        .catch(error => console.error("Error loading alumni data:", error));
});
